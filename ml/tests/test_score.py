from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID = {
    "application_id": "a-1",
    "features": {
        "business_age_months": 34, "is_sole_proprietor": True, "okved_group": "trade",
        "avg_revenue_12m": 1850000, "revenue_cv": 0.42, "expense_ratio": 0.7,
        "debt_service_ratio": 0.18, "max_delinquency_days_12m": 0,
        "active_loans_count": 1, "requested_to_monthly_revenue": 2.1, "term_months": 12,
    },
}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_score_contract():
    body = client.post("/score", json=VALID).json()
    assert 0 <= body["pd"] <= 1
    assert len(body["factors"]) == 5


def test_invalid_request_is_422():
    bad = {**VALID, "features": {**VALID["features"], "term_months": 0}}
    assert client.post("/score", json=bad).status_code == 422