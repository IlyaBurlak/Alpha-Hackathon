import json
from math import inf
from pathlib import Path

from fastapi.testclient import TestClient

from app.features import build_features
from app.main import app
from app.schemas import ApplicationIn

FIXTURES = Path(__file__).parent / "fixtures"
client = TestClient(app)


def bankrupt_payload() -> dict:
    """Компания-банкрот из моков реестра: нулевые доходы и расходы, не действует."""
    payload = json.loads((FIXTURES / "application_full.json").read_text(encoding="utf-8"))
    block = payload["applicationScore"]
    block["history"] = {"creditHistory": [], "bankrupt": True, "casesDelayedPayment": 0}
    block["registerInfo"].update(
        isActive=False, annualIncome=0, annualExpenses=0, employeesCount=0, lastYearBalances=[0] * 16
    )
    return payload


def test_zero_revenue_is_data_not_missing_data() -> None:
    features, missing = build_features(ApplicationIn.model_validate(bankrupt_payload()))

    assert missing == []
    assert features["avg_revenue_monthly"] == 0
    assert features["requested_to_monthly_revenue"] == inf
    assert "expense_ratio" not in features  # 0 / 0 не определено, признак не считаем


def test_expenses_with_zero_revenue_are_infinite_ratio() -> None:
    payload = bankrupt_payload()
    payload["applicationScore"]["registerInfo"]["annualExpenses"] = 50000

    features, missing = build_features(ApplicationIn.model_validate(payload))

    assert missing == []
    assert features["expense_ratio"] == inf


def test_negative_revenue_is_still_missing_data() -> None:
    payload = bankrupt_payload()
    payload["applicationScore"]["registerInfo"]["annualIncome"] = -1

    _, missing = build_features(ApplicationIn.model_validate(payload))

    assert "registerInfo.annualIncome" in missing


def test_bankrupt_company_gets_a_response() -> None:
    response = client.post("/score", json=bankrupt_payload())

    assert response.status_code == 200
    assert response.json()["score"] <= 45
