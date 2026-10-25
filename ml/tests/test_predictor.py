import json
from pathlib import Path

import pytest

from app.predictor import ModelError, Predictor

predictor = Predictor.load()


def test_predict_is_probability() -> None:
    assert 0 < predictor.predict(predictor.typical) < 1


def test_clip_limits_outliers_and_reports_them() -> None:
    name, (low, high) = next(iter(predictor.ranges.items()))

    clipped, names = predictor.clip({name: high * 10 + 1})
    inside, none = predictor.clip({name: (low + high) / 2})

    assert clipped[name] == high and names == {name}
    assert inside[name] == (low + high) / 2 and none == set()


def test_typical_application_has_no_factors() -> None:
    assert predictor.explain(dict(predictor.typical)) == []


def test_explain_is_sorted_and_skips_absent_features() -> None:
    features = {"business_age_months": 1.0, "expense_ratio": 0.95, "term_months": 6.0}

    points = predictor.explain(features)

    assert {name for name, _ in points} <= set(features)
    assert all(value != 0 for _, value in points)
    assert [abs(v) for _, v in points] == sorted((abs(v) for _, v in points), reverse=True)


def test_load_fails_clearly_without_model(tmp_path: Path) -> None:
    with pytest.raises(ModelError, match="train"):
        Predictor.load(tmp_path)


def test_load_rejects_meta_without_new_keys(tmp_path: Path) -> None:
    (tmp_path / "meta.json").write_text(json.dumps({"version": "x"}), encoding="utf-8")

    with pytest.raises(ModelError, match="retrain"):
        Predictor.load(tmp_path)