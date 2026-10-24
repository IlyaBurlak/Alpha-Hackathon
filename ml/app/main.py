from fastapi import FastAPI

from app.schemas import ApplicationIn, Factor, ScoreResponse

MODEL_VERSION = "stub-0.1"

app = FastAPI(title="ML scoring service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _stub_pd(application: ApplicationIn) -> float:
    """Заглушка: простые правила, чтобы backend мог проверить разные исходы.

    Настоящий расчёт признаков и модель появятся на следующих шагах;
    контракт ответа при этом не меняется.
    """
    history = application.history
    register = application.register

    if (history and history.bankrupt) or (register and register.isActive is False):
        return 0.45
    delayed = history.casesDelayedPayment if history else None
    income = register.annualIncome if register else None
    if (delayed or 0) > 0 or (income and application.sum > income * 3):
        return 0.18
    return 0.071


@app.post("/score", response_model=ScoreResponse, response_model_exclude_none=True)
def score(application: ApplicationIn) -> ScoreResponse:
    return ScoreResponse(
        pd=_stub_pd(application),
        model_version=MODEL_VERSION,
        factors=[
            Factor(feature="revenue_cv", label="Нестабильная выручка", impact=0.021),
            Factor(feature="business_age_months", label="Небольшой возраст бизнеса", impact=0.012),
            Factor(
                feature="debt_service_ratio", label="Нагрузка по действующим кредитам", impact=0.008
            ),
            Factor(feature="avg_revenue_monthly", label="Средняя выручка", impact=-0.010),
            Factor(
                feature="delayed_payment_cases", label="Просрочек в истории нет", impact=-0.015
            ),
        ],
    )