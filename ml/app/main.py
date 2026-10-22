from typing import Literal
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="ML scoring service", version="0.0.1")


class Features(BaseModel):
    business_age_months: int = Field(ge=0)
    is_sole_proprietor: bool
    okved_group: Literal["trade", "manufacturing", "services", "other"]
    avg_revenue_12m: float = Field(ge=0)
    revenue_cv: float = Field(ge=0)
    expense_ratio: float = Field(ge=0)
    debt_service_ratio: float = Field(ge=0)
    max_delinquency_days_12m: int = Field(ge=0)
    active_loans_count: int = Field(ge=0)
    requested_to_monthly_revenue: float = Field(ge=0)
    term_months: int = Field(ge=1)


class ScoreRequest(BaseModel):
    application_id: str
    features: Features


class Factor(BaseModel):
    feature: str
    label: str
    impact: float  # > 0 повышает риск, < 0 снижает


class ScoreResponse(BaseModel):
    pd: float = Field(ge=0, le=1)
    model_version: str
    factors: list[Factor]  # топ-5


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    f = req.features
    # Заглушка: фиксированный ответ + 2 простых переключателя,
    # чтобы backend мог проверить красную и серую зоны.
    pd_value = 0.071
    if f.max_delinquency_days_12m > 30:
        pd_value = 0.45
    elif f.requested_to_monthly_revenue > 4 or f.revenue_cv > 0.6:
        pd_value = 0.18

    return ScoreResponse(
        pd=pd_value,
        model_version="stub-0.0",
        factors=[
            Factor(feature="revenue_cv", label="Нестабильная выручка", impact=0.021),
            Factor(feature="business_age_months", label="Небольшой возраст бизнеса", impact=0.012),
            Factor(feature="debt_service_ratio", label="Нагрузка по действующим кредитам", impact=0.008),
            Factor(feature="avg_revenue_12m", label="Средняя выручка", impact=-0.010),
            Factor(feature="max_delinquency_days_12m", label="Просрочек в истории нет", impact=-0.015),
        ],
    )