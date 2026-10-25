from __future__ import annotations

from datetime import date, datetime
from math import inf, sqrt
from typing import Any

from app.schemas import ApplicationIn


class MissingDataError(Exception):
    def __init__(self, missing: list[str]):
        self.missing = missing
        super().__init__("missing required data")


def _to_date(v: Any) -> date | None:
    if v is None:
        return None
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, str):
        s = v.strip()
        if not s or s.lower() == "null":
            return None
        try:
            if "T" in s or "+" in s or "Z" in s:
                if s.endswith("Z"):
                    s2 = s[:-1] + "+00:00"
                else:
                    s2 = s
                try:
                    dt = datetime.fromisoformat(s2.replace("+00:00", ""))
                    return dt.date()
                except Exception:
                    pass
            try:
                return date.fromisoformat(s[:10])
            except Exception:
                pass
        except Exception:
            pass
    return None


def _months_between(start: date, end: date) -> float:
    if end < start:
        return 0.0
    return (end.year - start.year) * 12 + (end.month - start.month) + (end.day - start.day) / 30.0


def _parse_credit_units(units: Any) -> int | None:
    if units is None:
        return None
    if isinstance(units, int):
        if units in (1, 2, 3):
            return units
        return None
    if isinstance(units, str):
        u = units.strip().upper()
        if u == "DAY":
            return 1
        if u == "MONTH":
            return 2
        if u == "YEAR":
            return 3
    return None


def _okved_group(okved: str | None) -> str | None:
    if not okved:
        return None
    s = okved.strip()
    for i, c in enumerate(s):
        if c.isdigit():
            if i + 1 < len(s) and s[i + 1].isdigit():
                code = int(s[i] + s[i + 1])
                break
            continue
    else:
        return None
    if 45 <= code <= 47:
        return "trade"
    if 10 <= code <= 33:
        return "manufacturing"
    if 49 <= code <= 96:
        return "services"
    return "other"


def _is_sole_proprietor(ogrn: str | None) -> bool | None:
    if not ogrn:
        return None
    ogrn_clean = "".join(c for c in str(ogrn) if c.isdigit())
    if len(ogrn_clean) == 15:
        return True
    if len(ogrn_clean) == 13:
        return False
    return None


def _cv(values: list[float]) -> float | None:
    if not values or len(values) < 3:
        return None
    n = len(values)
    mean = sum(values) / n
    if mean == 0:
        return 0.0
    var = sum((x - mean) ** 2 for x in values) / n
    std = sqrt(var)
    return std / abs(mean)


def build_features(application: ApplicationIn) -> tuple[dict[str, Any], list[str]]:
    missing: list[str] = []
    features: dict[str, Any] = {}

    history = getattr(application, "history", None)
    register = getattr(application, "register", None)

    created_at = _to_date(getattr(application, "createdAt", None))
    if created_at is None:
        missing.append("createdAt")

    reg_date = _to_date(getattr(register, "registrationDate", None)) if register else None
    if reg_date is None:
        missing.append("registerInfo.registrationDate")
    else:
        if created_at is not None:
            features["business_age_months"] = _months_between(reg_date, created_at)
        else:
            missing.append("createdAt")

    ogrn = getattr(register, "ogrn", None) if register else None
    isp = _is_sole_proprietor(ogrn)
    if isp is not None:
        features["is_sole_proprietor"] = isp

    okved = getattr(register, "okved", None) if register else None
    og = _okved_group(okved)
    if og is not None:
        features["okved_group"] = og

    annual_income = getattr(register, "annualIncome", None) if register else None
    if annual_income is None:
        missing.append("registerInfo.annualIncome")
    else:
        try:
            # Нулевая выручка это данные (компания не работает), а не их отсутствие.
            if float(annual_income) < 0:
                missing.append("registerInfo.annualIncome")
            else:
                features["avg_revenue_monthly"] = float(annual_income) / 12.0
        except Exception:
            missing.append("registerInfo.annualIncome")

    annual_expenses = getattr(register, "annualExpenses", None) if register else None
    if annual_expenses is None:
        missing.append("registerInfo.annualExpenses")
    else:
        try:
            if "avg_revenue_monthly" in features:
                income = float(annual_income)
                expenses = float(annual_expenses)
                if income > 0:
                    features["expense_ratio"] = expenses / income
                elif expenses > 0:
                    features["expense_ratio"] = inf  # расходы при нулевой выручке
                # при нулевых доходах и расходах отношение не определено: признак не считаем
        except Exception:
            missing.append("registerInfo.annualExpenses")

    balances = getattr(register, "lastYearBalances", None) if register else None
    if balances:
        try:
            vals = [float(x) for x in balances if x is not None][:12]
            cv = _cv(vals)
            if cv is not None:
                features["revenue_cv"] = cv
        except Exception:
            pass

    ec = getattr(register, "employeesCount", None) if register else None
    if ec is not None:
        try:
            features["employees_count"] = float(ec)
        except Exception:
            pass

    bcs = _to_date(getattr(register, "bankClientSince", None)) if register else None
    if bcs is not None and created_at is not None:
        try:
            features["bank_client_months"] = _months_between(bcs, created_at)
        except Exception:
            pass

    if history is None:
        missing.append("history")
    else:
        ch = getattr(history, "creditHistory", None)
        if ch is None:
            missing.append("history.creditHistory")
        else:
            try:
                active = 0
                for item in ch:
                    status = getattr(item, "status", None)
                    if status is None:
                        continue
                    s = str(status).strip().upper()
                    if s == "PAID":
                        continue
                    active += 1
                features["active_loans_count"] = active
            except Exception:
                missing.append("history.creditHistory")

            try:
                total_monthly = 0.0
                for item in ch:
                    status = getattr(item, "status", None)
                    if status is None:
                        continue
                    s = str(status).strip().upper()
                    if s == "PAID":
                        continue
                    prov = _to_date(getattr(item, "provisionDate", None))
                    pdead = _to_date(getattr(item, "paymentDeadline", None))
                    ssum = getattr(item, "sum", None)
                    if prov is None or pdead is None or ssum is None:
                        continue
                    months = _months_between(prov, pdead)
                    if months < 1.0:
                        months = 1.0
                    total_monthly += float(ssum) / months
                if "avg_revenue_monthly" in features:
                    revenue = float(features["avg_revenue_monthly"])
                    if revenue > 0:
                        features["debt_service_ratio"] = total_monthly / revenue
                    else:
                        features["debt_service_ratio"] = inf if total_monthly > 0 else 0.0
            except Exception:
                pass

        cdp = getattr(history, "casesDelayedPayment", None)
        if cdp is None:
            missing.append("history.casesDelayedPayment")
        else:
            try:
                features["delayed_payment_cases"] = int(cdp)
            except Exception:
                missing.append("history.casesDelayedPayment")

    if "avg_revenue_monthly" in features:
        try:
            revenue = float(features["avg_revenue_monthly"])
            requested = float(getattr(application, "sum"))
            # при нулевой выручке отношение бесконечно: модель ограничит его верхней границей
            features["requested_to_monthly_revenue"] = requested / revenue if revenue > 0 else inf
        except Exception:
            missing.append("sum")

    ct = getattr(application, "creditTime", None)
    if ct is None:
        missing.append("creditTime")
    else:
        units = _parse_credit_units(getattr(ct, "units", None))
        value = getattr(ct, "value", None)
        if units is None or value is None:
            missing.append("creditTime")
        else:
            try:
                v = float(value)
                if v <= 0:
                    missing.append("creditTime")
                elif units == 3:
                    features["term_months"] = int(v * 12)
                elif units == 2:
                    features["term_months"] = int(v)
                elif units == 1:
                    features["term_months"] = max(1, int(v / 30))
            except Exception:
                missing.append("creditTime")

    seen = set()
    missing_dedup = []
    for m in missing:
        if m in seen:
            continue
        seen.add(m)
        missing_dedup.append(m)

    return features, missing_dedup
