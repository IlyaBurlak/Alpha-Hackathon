from __future__ import annotations

import math

# Формула из дизайна кабинета: pd = 0.45 / (1 + exp((score - 48) / 8)).
_PD_MAX = 0.45
_CENTER = 48
_SCALE = 8


def pd_to_score_exact(pd: float) -> float:
    """Балл 0-100 без округления (нужен для баллов факторов)."""
    if pd >= _PD_MAX:
        return 0.0
    if pd <= 0:
        return 100.0
    score = _CENTER + _SCALE * math.log(_PD_MAX / pd - 1)
    return min(100.0, max(0.0, score))


def pd_to_score(pd: float) -> int:
    return round(pd_to_score_exact(pd))


def score_to_pd(score: float) -> float:
    """Обратная формула: нужна, чтобы стоп-фактор ограничивал и pd, и балл."""
    return _PD_MAX / (1 + math.exp((score - _CENTER) / _SCALE))


def risk_class(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 70:
        return "B"
    if score >= 60:
        return "C"
    if score >= 45:
        return "D"
    return "E"


def rate_premium_pp(score: int) -> float:
    if score >= 80:
        return -1.0
    if score >= 60:
        return 1.0
    if score >= 45:
        return 3.5
    return 6.0