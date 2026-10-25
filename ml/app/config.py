from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"


class ConfigError(RuntimeError):
    pass


def _read(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ConfigError(f"config file not found: {path}")
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ConfigError(f"{path.name}: expected a mapping at the top level")
    return data


def _require(cfg: dict[str, Any], file: str, *path: str) -> None:
    node: Any = cfg
    for key in path:
        if not isinstance(node, dict) or key not in node:
            raise ConfigError(f"{file}: missing key '{'.'.join(path)}'")
        node = node[key]


def load_scoring(config_dir: Path = CONFIG_DIR) -> dict[str, Any]:
    cfg = _read(config_dir / "scoring.yaml")
    for path in (
        ("factors", "max_count"),
        ("stop_factors", "score_cap"),
        ("stop_factors", "min_business_age_months"),
        ("stop_factors", "max_delayed_payment_cases"),
        ("thresholds",),
    ):
        _require(cfg, "scoring.yaml", *path)
    return cfg


def load_labels(config_dir: Path = CONFIG_DIR) -> dict[str, Any]:
    labels = _read(config_dir / "labels.yaml")
    for path in (("common", "clipped_note"), ("factors",), ("stop_factors",)):
        _require(labels, "labels.yaml", *path)
    for name, entry in labels["factors"].items():
        for key in ("title", "description", "advice"):
            _require(entry, f"labels.yaml (factors.{name})", key)
    return labels