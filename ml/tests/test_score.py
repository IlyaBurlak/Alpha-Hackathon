import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app, service
from app.schemas import ApplicationIn

client = TestClient(app)

FIXTURES = Path(__file__).parent / "fixtures"
# Полный режим требует и историю, и реестр; остальные фикстуры проверяются отдельно.
COMPLETE_FIXTURES = [
    "application_full",
    "application_old_format",
    "application_sole_proprietor",
]


STOP_FEATURES = {"isActive", "bankrupt", "business_age_months", "delayed_payment_cases"}
HISTORY_ONLY = {"active_loans_count", "debt_service_ratio", "delayed_payment_cases"}


def load(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


# --- контракт ответа -------------------------------------------------------


@pytest.mark.parametrize("name", COMPLETE_FIXTURES)
def test_score_accepts_complete_fixtures(name: str) -> None:
    response = client.post("/score", json=load(name))

    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["pd"] <= 1
    assert isinstance(body["model_version"], str)
    assert isinstance(body["score"], int)
    assert 0 <= body["score"] <= 100
    assert body["risk_class"] in ["A", "B", "C", "D", "E"]
    assert isinstance(body["rate_premium_pp"], (int, float))
    assert body["mode"] == "full"
    assert isinstance(body["factors"], list)
    assert 1 <= len(body["factors"]) <= 7
    for factor in body["factors"]:
        assert {"feature", "title", "description", "points"} <= factor.keys()
        assert factor["points"] != 0 or factor["feature"] in STOP_FEATURES
        # совет обязателен для отрицательных факторов и не нужен для положительных
        assert bool(factor.get("advice")) == (factor["points"] < 0) or factor["points"] == 0
        assert "label" not in factor
        assert "impact" not in factor
        assert "hint" not in factor


def test_score_ignores_unknown_fields() -> None:
    payload = load("application_full")
    payload["productId"] = 3
    payload["products"] = [{"id": 3, "name": "Кредит", "persentage": 17}]
    payload["applicationScore"]["mlScore"] = {"pd": 0.5}

    assert client.post("/score", json=payload).status_code == 200


# --- разбор данных внешних систем -----------------------------------------


def test_full_application_is_parsed() -> None:
    parsed = ApplicationIn.model_validate(load("application_full"))

    assert parsed.sum == 100000000
    assert parsed.creditTime.units == "YEAR"
    assert parsed.history is not None
    assert parsed.history.creditHistory[0].status == "PAID"
    assert parsed.history.casesDelayedPayment == 0
    assert parsed.register is not None
    assert parsed.register.registrationDate == date(2021, 1, 15)
    assert parsed.register.annualIncome == 400000
    assert len(parsed.register.lastYearBalances or []) == 16


def test_old_format_has_no_new_register_fields() -> None:
    parsed = ApplicationIn.model_validate(load("application_old_format"))

    assert parsed.register is not None
    assert parsed.register.annualIncome == 400000
    assert parsed.register.lastYearBalances is None
    assert parsed.register.ogrn is None
    assert parsed.register.okved is None


def test_sole_proprietor_register_has_no_kpp_and_capital() -> None:
    parsed = ApplicationIn.model_validate(load("application_sole_proprietor"))

    assert parsed.register is not None
    assert parsed.register.kpp is None
    assert parsed.register.authCapital is None
    assert parsed.creditTime.units == "MONTH"


def test_missing_sources_become_none() -> None:
    no_register = ApplicationIn.model_validate(load("application_no_register"))
    no_history = ApplicationIn.model_validate(load("application_no_history"))

    assert no_register.register is None and no_register.history is not None
    assert no_history.history is None and no_history.register is not None


def test_application_without_score_block_is_accepted() -> None:
    payload = load("application_full")
    del payload["applicationScore"]

    parsed = ApplicationIn.model_validate(payload)

    assert parsed.history is None and parsed.register is None
    assert client.post("/score", json=payload).status_code == 422


def test_error_and_empty_objects_mean_no_data() -> None:
    payload = load("application_full")
    payload["applicationScore"]["history"] = {"error": "No credit history found"}
    payload["applicationScore"]["registerInfo"] = {}

    parsed = ApplicationIn.model_validate(payload)

    assert parsed.history is None
    assert parsed.register is None


def test_info_wrapper_is_flattened() -> None:
    payload = load("application_full")
    block = payload["applicationScore"]
    payload["applicationScore"] = {
        "id": block["id"],
        "info": {"history": block["history"], "registerInfo": block["registerInfo"]},
    }

    parsed = ApplicationIn.model_validate(payload)

    assert parsed.history is not None and parsed.history.casesDelayedPayment == 0
    assert parsed.register is not None and parsed.register.annualIncome == 400000


def test_numeric_enums_are_accepted() -> None:
    payload = load("application_full")
    payload["status"] = 1
    payload["creditTime"] = {"units": 2, "value": 1}
    payload["applicationScore"]["history"]["creditHistory"][0]["status"] = 0

    parsed = ApplicationIn.model_validate(payload)

    assert parsed.creditTime.units == 2
    assert client.post("/score", json=payload).status_code == 200


# --- некорректные запросы ---------------------------------------------------


@pytest.mark.parametrize("field", ["sum", "createdAt", "creditTime"])
def test_missing_required_field_is_422(field: str) -> None:
    payload = load("application_full")
    del payload[field]

    assert client.post("/score", json=payload).status_code == 422


def test_non_positive_sum_is_422() -> None:
    payload = load("application_full")
    payload["sum"] = 0

    assert client.post("/score", json=payload).status_code == 422


def test_broken_date_is_422() -> None:
    payload = load("application_full")
    payload["applicationScore"]["registerInfo"]["registrationDate"] = "вчера"

    assert client.post("/score", json=payload).status_code == 422

# --- режимы и нехватка данных -----------------------------------------------


@pytest.mark.parametrize(
    ("name", "missing_field"),
    [
        ("application_no_history", "history"),
        ("application_no_register", "registerInfo.registrationDate"),
    ],
)
def test_full_mode_needs_history_and_register(name: str, missing_field: str) -> None:
    response = client.post("/score", json=load(name))

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "MISSING_DATA"
    assert missing_field in detail["missing"]


def test_preliminary_works_without_history() -> None:
    response = client.post("/score/preliminary", json=load("application_no_history"))

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "preliminary"
    assert not {f["feature"] for f in body["factors"]} & HISTORY_ONLY


def test_preliminary_ignores_history_even_when_sent() -> None:
    payload = load("application_full")
    payload["applicationScore"]["history"]["bankrupt"] = True

    body = client.post("/score/preliminary", json=payload).json()

    assert not {f["feature"] for f in body["factors"]} & (HISTORY_ONLY | {"bankrupt"})


def test_preliminary_still_needs_register() -> None:
    response = client.post("/score/preliminary", json=load("application_no_register"))

    assert response.status_code == 422


# --- стоп-факторы ------------------------------------------------------------


def _stop_case(mutate) -> dict[str, Any]:
    payload = load("application_full")
    mutate(payload["applicationScore"])
    body = client.post("/score", json=payload).json()
    assert body["score"] <= 30
    assert body["risk_class"] == "E"
    return body


def _stop_factor(body: dict[str, Any], feature: str) -> dict[str, Any]:
    found = [f for f in body["factors"] if f["feature"] == feature]
    assert len(found) == 1, f"expected one '{feature}' factor"
    assert found[0]["points"] <= 0
    assert found[0]["advice"]
    return found[0]


def test_bankrupt_caps_score() -> None:
    body = _stop_case(lambda block: block["history"].update(bankrupt=True))
    _stop_factor(body, "bankrupt")


def test_inactive_company_caps_score() -> None:
    body = _stop_case(lambda block: block["registerInfo"].update(isActive=False))
    _stop_factor(body, "isActive")


def test_young_business_caps_score() -> None:
    body = _stop_case(lambda block: block["registerInfo"].update(registrationDate="2026-08-24"))
    assert "мес." in _stop_factor(body, "business_age_months")["description"]


def test_many_delays_cap_score() -> None:
    body = _stop_case(lambda block: block["history"].update(casesDelayedPayment=5))
    assert "5" in _stop_factor(body, "delayed_payment_cases")["description"]


def test_stop_factor_is_not_duplicated_by_model_factor() -> None:
    payload = load("application_full")
    payload["applicationScore"]["history"]["bankrupt"] = True
    features = [f["feature"] for f in client.post("/score", json=payload).json()["factors"]]

    assert len(features) == len(set(features))


# --- служебное ---------------------------------------------------------------


def test_health_reports_model_version() -> None:
    body = client.get("/health").json()

    assert body["status"] == "ok"
    assert body["model_version"] == service.model_version


def test_unexpected_error_gives_500_without_details(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("secret internal detail")

    monkeypatch.setattr(service, "score", boom)
    quiet_client = TestClient(app, raise_server_exceptions=False)

    response = quiet_client.post("/score", json=load("application_full"))

    assert response.status_code == 500
    assert "secret" not in response.text


def test_every_label_renders() -> None:
    for feature in service.predictor.features:
        typical = service.predictor.typical[feature]
        negative = service.describe(feature, -3, typical, clipped=True)
        positive = service.describe(feature, 3, typical, clipped=False)

        assert negative.advice and negative.description and negative.title
        assert positive.advice is None