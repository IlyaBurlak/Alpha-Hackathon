import copy
import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import ApplicationIn

client = TestClient(app)

FIXTURES = Path(__file__).parent / "fixtures"
FIXTURE_NAMES = [
    "application_full",
    "application_old_format",
    "application_no_register",
    "application_no_history",
    "application_sole_proprietor",
]


def load(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


# --- контракт ответа -------------------------------------------------------


@pytest.mark.parametrize("name", FIXTURE_NAMES)
def test_score_accepts_every_fixture(name: str) -> None:
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
    assert len(body["factors"]) >= 1
    for factor in body["factors"]:
        assert {"feature", "title", "description", "points"} <= factor.keys()
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
    assert client.post("/score", json=payload).status_code == 200


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


# --- заглушка: разные исходы для проверки backend -------------------------


def test_stub_default_outcome() -> None:
    payload = load("application_full")
    payload["sum"] = 500000  # не больше 3 годовых выручек

    assert client.post("/score", json=payload).json()["pd"] == 0.071


def test_stub_large_request_raises_pd() -> None:
    assert client.post("/score", json=load("application_full")).json()["pd"] == 0.18


def test_stub_bankrupt_and_inactive_give_highest_pd() -> None:
    bankrupt = copy.deepcopy(load("application_full"))
    bankrupt["applicationScore"]["history"]["bankrupt"] = True
    inactive = copy.deepcopy(load("application_full"))
    inactive["applicationScore"]["registerInfo"]["isActive"] = False

    assert client.post("/score", json=bankrupt).json()["pd"] == 0.45
    assert client.post("/score", json=inactive).json()["pd"] == 0.45


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