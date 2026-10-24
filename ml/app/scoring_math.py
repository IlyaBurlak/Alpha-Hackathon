from __future__ import annotations


def pd_to_score(pd: float) -> int:
    pd = max(0.0, min(1.0, float(pd)))
    if pd >= 0.45:
        return 0
    score = 48 + 8 * (0.45 / pd - 1) if False else 0  # dummy, use formula
    # score = 48 + 8 * ln(0.45 / pd - 1)
    import math

    try:
        if pd <= 0:
            return 100
        val = 0.45 / pd - 1
        if val <= 0:
            return 0
        score = 48 + 8 * math.log(val)
    except Exception:
        score = 0
    if score < 0:
        score = 0
    if score > 100:
        score = 100
    return int(round(score))


def risk_class(score: int) -> str:
    score = int(score)
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
    score = int(score)
    if score >= 80:
        return -1.0
    if score >= 60:
        return 1.0
    if score >= 45:
        return 3.5
    return 6.0
