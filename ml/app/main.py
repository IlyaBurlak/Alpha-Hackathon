from datetime import datetime

from fastapi import FastAPI

from app.scoring_math import pd_to_score, rate_premium_pp, risk_class
from app.schemas import ApplicationIn, FactorV3, ScoreResponse

MODEL_VERSION = "stub-0.1"

app = FastAPI(title="ML scoring service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _stub_pd(application: ApplicationIn) -> float:
    history = application.history
    register = application.register

    if (history and history.bankrupt) or (register and register.isActive is False):
        return 0.45
    delayed = history.casesDelayedPayment if history else None
    income = register.annualIncome if register else None
    if (delayed or 0) > 0 or (income and application.sum > income * 3):
        return 0.18
    return 0.071


def _make_factors(pd: float) -> list[FactorV3]:
    if pd >= 0.45:
        return [
            FactorV3(
                feature="isActive",
                title="Компания неактивна или банкрот",
                description="Компания признана неактивной или в статусе банкрота.",
                points=-20,
                advice="Обратитесь в службу поддержки для уточнения статуса компании.",
            ),
            FactorV3(
                feature="debt_service_ratio",
                title="Высокая долговая нагрузка",
                description="Долговая нагрузка превышает допустимые значения.",
                points=-10,
                advice="Снизьте текущую кредитную нагрузку или увеличьте оборот.",
            ),
            FactorV3(
                feature="requested_to_annual_revenue",
                title="Крупный запрос к выручке",
                description="Запрашиваемая сумма значительна относительно годовой выручки.",
                points=-8,
                advice="Рассмотрите заявку на меньшую сумму.",
            ),
        ]
    if pd >= 0.18:
        return [
            FactorV3(
                feature="requested_to_annual_revenue",
                title="Запрос относительно выручки",
                description="Запрашиваемая сумма составляет значительную долю от годовой выручки.",
                points=-5,
                advice="Рассмотрите заявку на меньшую сумму или увеличьте срок.",
            ),
            FactorV3(
                feature="business_age_months",
                title="Небольшой возраст бизнеса",
                description="Бизнес работает менее 2 лет.",
                points=-3,
                advice="Укажите дополнительные источники обеспечения при подаче заявки.",
            ),
            FactorV3(
                feature="avg_revenue_monthly",
                title="Среднемесячная выручка",
                description="Среднемесячная выручка находится на среднем уровне.",
                points=2,
                advice=None,
            ),
        ]
    return [
        FactorV3(
            feature="avg_revenue_monthly",
            title="Стабильная выручка",
            description="Среднемесячная выручка соответствует требованиям банка.",
            points=5,
            advice=None,
        ),
        FactorV3(
            feature="business_age_months",
            title="Опыт работы бизнеса",
            description="Бизнес успешно работает на рынке достаточное время.",
            points=3,
            advice=None,
        ),
        FactorV3(
            feature="delayed_payment_cases",
            title="Кредитная история",
            description="В кредитной истории отсутствуют просрочки.",
            points=4,
            advice=None,
        ),
    ]


@app.post("/score", response_model=ScoreResponse, response_model_exclude_none=True)
def score(application: ApplicationIn) -> ScoreResponse:
    pd = _stub_pd(application)
    score_val = pd_to_score(pd)
    return ScoreResponse(
        pd=pd,
        score=score_val,
        risk_class=risk_class(score_val),
        rate_premium_pp=rate_premium_pp(score_val),
        model_version=MODEL_VERSION,
        updated_at=datetime.utcnow(),
        mode="full",
        factors=_make_factors(pd),
    )


@app.post("/score/preliminary", response_model=ScoreResponse, response_model_exclude_none=True)
def score_preliminary(application: ApplicationIn) -> ScoreResponse:
    pd = _stub_pd(application)
    # preliminary mode: simplify a bit
    if pd < 0.45:
        pd = min(pd * 0.9, 0.25)
    score_val = pd_to_score(pd)
    factors = _make_factors(pd)
    # in preliminary mode don't emphasize history factors heavily
    factors_out = []
    for f in factors:
        if f.feature in ("delayed_payment_cases",):
            continue
        factors_out.append(f)
    if not factors_out:
        factors_out = factors[:3]
    return ScoreResponse(
        pd=pd,
        score=score_val,
        risk_class=risk_class(score_val),
        rate_premium_pp=rate_premium_pp(score_val),
        model_version=MODEL_VERSION,
        updated_at=datetime.utcnow(),
        mode="preliminary",
        factors=factors_out,
    )