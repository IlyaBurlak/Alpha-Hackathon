import pytest

from app.scoring_math import pd_to_score, rate_premium_pp, risk_class, score_to_pd


@pytest.mark.parametrize(
    ("pd", "score"),
    [(0, 100), (0.0149, 75), (0.267, 45), (0.45, 0), (1, 0)],
)
def test_pd_to_score_boundaries(pd: float, score: int) -> None:
    assert pd_to_score(pd) == score


@pytest.mark.parametrize("score", [10, 30, 45, 75, 90])
def test_score_to_pd_is_inverse(score: int) -> None:
    assert pd_to_score(score_to_pd(score)) == score


@pytest.mark.parametrize(
    ("score", "expected"),
    [(100, "A"), (80, "A"), (79, "B"), (70, "B"), (69, "C"), (60, "C"), (59, "D"), (45, "D"),
     (44, "E"), (0, "E")],
)
def test_risk_class_boundaries(score: int, expected: str) -> None:
    assert risk_class(score) == expected


@pytest.mark.parametrize(
    ("score", "expected"),
    [(100, -1.0), (80, -1.0), (79, 1.0), (60, 1.0), (59, 3.5), (45, 3.5), (44, 6.0), (0, 6.0)],
)
def test_rate_premium_boundaries(score: int, expected: float) -> None:
    assert rate_premium_pp(score) == expected