from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from app.config import ConfigError, load_labels, load_scoring
from app.features import MissingDataError, build_features
from app.predictor import Predictor
from app.schemas import ApplicationIn, FactorV3, ScoreResponse
from app.scoring_math import pd_to_score, rate_premium_pp, risk_class, score_to_pd

Mode = Literal["full", "preliminary"]

# В предварительном режиме согласия на бюро ещё нет: историю не используем.
HISTORY_FEATURES = frozenset({"active_loans_count", "debt_service_ratio", "delayed_payment_cases"})


class ScoringService:
    def __init__(self, predictor: Predictor, scoring_cfg: dict[str, Any], labels: dict[str, Any]):
        unlabeled = [f for f in predictor.features if f not in labels["factors"]]
        if unlabeled:
            raise ConfigError(f"labels.yaml: no texts for model features {unlabeled}")
        self.predictor = predictor
        self.cfg = scoring_cfg
        self.labels = labels

    @classmethod
    def load(cls) -> ScoringService:
        return cls(Predictor.load(), load_scoring(), load_labels())

    @property
    def model_version(self) -> str:
        return self.predictor.version

    def score(self, application: ApplicationIn, mode: Mode) -> ScoreResponse:
        features, missing = build_features(application)
        if mode == "preliminary":
            features = {k: v for k, v in features.items() if k not in HISTORY_FEATURES}
            missing = [m for m in missing if not m.startswith("history")]
        if missing:
            raise MissingDataError(missing)

        # Модель видит значения без выбросов, а клиент и стоп-факторы - исходные.
        model_input, clipped = self.predictor.clip(features)
        pd = self.predictor.predict(model_input)
        model_score = pd_to_score(pd)

        stops = self._stop_factors(application, features, mode)
        if stops:
            pd = max(pd, score_to_pd(self.cfg["stop_factors"]["score_cap"]))
        final_score = pd_to_score(pd)

        factors = [
            self._stop_factor(key, feature, ctx, final_score - model_score)
            for key, feature, ctx in stops
        ]
        covered = {feature for _, feature, _ in stops}
        for feature, points in self.predictor.explain(model_input):
            if len(factors) >= self.cfg["factors"]["max_count"]:
                break
            if feature in covered:
                continue
            factors.append(self.describe(feature, points, features[feature], feature in clipped))

        return ScoreResponse(
            pd=pd,
            score=final_score,
            risk_class=risk_class(final_score),
            rate_premium_pp=rate_premium_pp(final_score),
            model_version=self.model_version,
            updated_at=datetime.now(UTC),
            mode=mode,
            factors=factors,
        )

    def describe(self, feature: str, points: int, value: Any, clipped: bool) -> FactorV3:
        label = self.labels["factors"][feature]
        ctx = {
            "value": label.get("values", {}).get(value, value),
            "typical": self.predictor.typical[feature],
            "threshold": self.cfg["thresholds"].get(feature),
        }
        description = label["description"].format(**ctx)
        if clipped:
            description += " " + self.labels["common"]["clipped_note"]
        advice = label["advice"].format(**ctx) if points < 0 else None
        return FactorV3(
            feature=feature, title=label["title"], description=description, points=points,
            advice=advice,
        )

    def _stop_factors(
        self, application: ApplicationIn, features: dict[str, Any], mode: Mode
    ) -> list[tuple[str, str, dict[str, Any]]]:
        """Сработавшие стоп-факторы: (ключ текста, признак, подстановки)."""
        cfg = self.cfg["stop_factors"]
        found: list[tuple[str, str, dict[str, Any]]] = []
        register, history = application.register, application.history

        if register is not None and register.isActive is False:
            found.append(("inactive", "isActive", {}))
        age = features.get("business_age_months")
        if age is not None and age < cfg["min_business_age_months"]:
            found.append((
                "young_business", "business_age_months",
                {"value": age, "threshold": cfg["min_business_age_months"]},
            ))
        if mode == "full" and history is not None:
            if history.bankrupt:
                found.append(("bankrupt", "bankrupt", {}))
            cases = features.get("delayed_payment_cases")
            if cases is not None and cases > cfg["max_delayed_payment_cases"]:
                found.append((
                    "delayed_cases", "delayed_payment_cases",
                    {"value": cases, "threshold": cfg["max_delayed_payment_cases"]},
                ))
        return found

    def _stop_factor(
        self, key: str, feature: str, ctx: dict[str, Any], points: int
    ) -> FactorV3:
        label = self.labels["stop_factors"][key]
        return FactorV3(
            feature=feature,
            title=label["title"],
            description=label["description"].format(**ctx),
            points=points,
            advice=label["advice"].format(**ctx),
        )