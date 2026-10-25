import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import load_scoring
from app.features import MissingDataError
from app.schemas import ApplicationIn, ScoreResponse
from app.scoring import Mode, ScoringService

logger = logging.getLogger("ml")

# Сервис не стартует без модели и конфига: ошибка загрузки видна сразу.
service = ScoringService.load()

app = FastAPI(title="ML scoring service", version="0.2.0")


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("scoring failed")
    return JSONResponse(status_code=500, content={"detail": "internal error"})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_version": service.model_version}


@app.get("/thresholds")
def thresholds() -> dict[str, Any]:
    cfg = load_scoring()
    return {
        "interface": cfg.get("thresholds", {}),
        "risk": {
            "reject_below": 45,
            "auto_approve": 75,
        },
        "score": {
            "min": 0,
            "max": 100,
        },
        "stop_factors": cfg.get("stop_factors", {}),
        "factors": cfg.get("factors", {}),
    }


def _score(application: ApplicationIn, mode: Mode) -> ScoreResponse:
    try:
        return service.score(application, mode)
    except MissingDataError as error:
        raise HTTPException(
            status_code=422, detail={"code": "MISSING_DATA", "missing": error.missing}
        ) from error


@app.post("/score", response_model=ScoreResponse, response_model_exclude_none=True)
def score(application: ApplicationIn) -> ScoreResponse:
    return _score(application, "full")


@app.post("/score/preliminary", response_model=ScoreResponse, response_model_exclude_none=True)
def score_preliminary(application: ApplicationIn) -> ScoreResponse:
    return _score(application, "preliminary")