from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.scoring_math import pd_to_score_exact

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
_META_KEYS = ("version", "features", "medians", "modes", "ranges")


class ModelError(RuntimeError):
    pass


class Predictor:
    """Логистическая регрессия + объяснение «что было бы с типичным значением»."""

    def __init__(self, pipeline: Any, meta: dict[str, Any]):
        self.pipeline = pipeline
        self.version: str = meta["version"]
        self.features: list[str] = meta["features"]
        self.ranges: dict[str, list[float]] = meta["ranges"]
        # Типичное значение: медиана для чисел, самое частое для категорий.
        self.typical: dict[str, Any] = {**meta["medians"], **meta["modes"]}

    @classmethod
    def load(cls, model_dir: Path = MODEL_DIR) -> Predictor:
        meta_path = model_dir / "meta.json"
        if not meta_path.is_file():
            raise ModelError(
                f"model metadata not found: {meta_path}. "
                "Train the model first: python -m train.train_logreg"
            )
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        missing = [key for key in _META_KEYS if key not in meta]
        if missing:
            raise ModelError(f"{meta_path.name}: missing keys {missing}; retrain the model")
        model_path = model_dir / f"{meta['version']}.joblib"
        if not model_path.is_file():
            raise ModelError(f"model file not found: {model_path}")
        return cls(joblib.load(model_path), meta)

    def clip(self, features: dict[str, Any]) -> tuple[dict[str, Any], set[str]]:
        """Ограничивает выбросы диапазонами обучения; возвращает и список ограниченных."""
        clipped: set[str] = set()
        out = dict(features)
        for name, (low, high) in self.ranges.items():
            value = out.get(name)
            if value is None:
                continue
            limited = min(max(value, low), high)
            if limited != value:
                out[name] = limited
                clipped.add(name)
        return out, clipped

    def _pd_batch(self, rows: list[dict[str, Any]]) -> np.ndarray:
        frame = pd.DataFrame(
            [{name: row.get(name, np.nan) for name in self.features} for row in rows],
            columns=self.features,
        )
        return self.pipeline.predict_proba(frame)[:, 1]

    def predict(self, features: dict[str, Any]) -> float:
        return float(self._pd_batch([features])[0])

    def explain(self, features: dict[str, Any]) -> list[tuple[str, int]]:
        """Баллы факторов: на сколько изменится балл, если признак заменить типичным.

        Плюс повышает балл. Нулевые вклады отбрасываются, остальные идут
        по убыванию модуля. Признаки, которых нет в заявке, вклада не дают.
        """
        present = [name for name in self.features if name in features]
        rows = [features] + [{**features, name: self.typical[name]} for name in present]
        pds = self._pd_batch(rows)
        base = pd_to_score_exact(pds[0])
        points = [
            (name, round(base - pd_to_score_exact(alt))) for name, alt in zip(present, pds[1:])
        ]
        return sorted((p for p in points if p[1] != 0), key=lambda p: -abs(p[1]))