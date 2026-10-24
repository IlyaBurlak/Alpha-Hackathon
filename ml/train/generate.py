from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

from app.schemas import ApplicationIn


def make_application(row: dict, idx: int) -> ApplicationIn:
    business_age_months = float(row["business_age_months"])
    created = datetime(2026, 10, 24) - pd.Timedelta(days=int(business_age_months * 30))
    reg = created - pd.Timedelta(days=int(business_age_months * 30))
    bank_client_months = float(row.get("bank_client_months", 0))
    bcs = created - pd.Timedelta(days=int(bank_client_months * 30)) if bank_client_months > 0 else None

    ch = []
    if row.get("credit_history"):
        ch = row["credit_history"]

    app_dict = {
        "id": idx,
        "userId": 1,
        "organizationId": 1,
        "sum": float(row["sum"]),
        "status": "SUBMITTED",
        "createdAt": created.isoformat() + "Z",
        "creditTime": {"units": "MONTH", "value": int(row["term_months"])},
        "applicationScore": {
            "history": {
                "creditHistory": ch,
                "bankrupt": bool(row.get("bankrupt", False)),
                "casesDelayedPayment": int(row.get("delayed_payment_cases", 0)),
            },
            "registerInfo": {
                "isActive": bool(row.get("isActive", True)),
                "registrationDate": reg.date().isoformat(),
                "annualIncome": float(row["annual_income"]),
                "annualExpenses": float(row["annual_expenses"]),
                "employeesCount": int(row.get("employees_count", 1)),
                "lastYearBalances": [float(x) for x in row.get("balances", [])],
                "ogrn": "123456789012345" if row.get("is_sole_proprietor") else "1234567890123",
                "okved": str(row.get("okved", "46.90")),
                "bankClientSince": bcs.date().isoformat() if bcs else None,
            },
        },
    }
    return ApplicationIn.model_validate(app_dict)


def generate_dataset(n: int = 20000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.RandomState(seed)
    data = []
    for i in range(n):
        is_ip = rng.rand() < 0.3
        okved = rng.choice(["46.90", "47.11", "10.13", "25.62", "62.01", "69.20"])
        business_age_months = float(max(0.5, rng.gamma(2.0, 20.0)))
        employees_count = 1 if is_ip else max(1, int(rng.lognormal(1.9, 0.8)))
        annual_income = float(max(60000, rng.lognormal(12.6, 0.6))) if not is_ip else float(max(40000, rng.lognormal(12.1, 0.55)))
        annual_expenses = float(annual_income * rng.uniform(0.35, 0.75))
        base = annual_income / 12.0
        balances = []
        for _ in range(16):
            balances.append(float(base * rng.uniform(0.8, 1.2) * (1.0 + rng.randn() * 0.05)))
        bank_client_months = float(max(0.0, rng.exponential(12.0)))
        bankrupt = rng.rand() < 0.008
        cases_delayed = 0
        if rng.rand() < 0.12:
            cases_delayed = int(rng.poisson(0.8))
        credit_history = []
        if rng.rand() < 0.35:
            if rng.rand() < 0.75:
                credit_history.append({"provisionDate": "2022-01-01", "sum": float(rng.uniform(20000, 120000)), "status": "PAID", "paymentDeadline": "2023-01-01"})
            else:
                credit_history.append({"provisionDate": "2023-01-01", "sum": float(rng.uniform(20000, 100000)), "status": "ACTIVE", "paymentDeadline": "2024-01-01"})
        is_active = True
        if business_age_months < 6 or bankrupt:
            if rng.rand() < 0.5:
                is_active = False
            else:
                is_active = True
        sum_req = float(rng.uniform(200000, 6000000))
        term_months = int(rng.choice([6, 12, 18, 24, 36, 48, 60]))
        row = {
            "is_sole_proprietor": bool(is_ip),
            "okved": okved,
            "business_age_months": business_age_months,
            "employees_count": employees_count,
            "annual_income": annual_income,
            "annual_expenses": annual_expenses,
            "balances": balances,
            "bank_client_months": bank_client_months,
            "bankrupt": bool(bankrupt),
            "isActive": bool(is_active),
            "delayed_payment_cases": cases_delayed,
            "credit_history": credit_history,
            "sum": sum_req,
            "term_months": term_months,
        }
        data.append(row)
    df = pd.DataFrame(data)
    return df


def default_target(row: dict) -> float:
    z = -3.0
    z += 0.012 / max(0.5, row["business_age_months"]) * 10.0
    z += 0.08 * row["delayed_payment_cases"]
    z += 0.5 if row.get("bankrupt") else 0.0
    z += 0.25 if not row.get("isActive", True) else 0.0
    rev_m = row["annual_income"] / 12.0
    if rev_m > 0:
        z -= 0.000003 * rev_m
    if rev_m > 0 and row["sum"] / rev_m > 10:
        z += 0.2
    if rev_m > 0 and row["sum"] / rev_m > 20:
        z += 0.3
    active = 0
    for ch in row.get("credit_history", []):
        if str(ch.get("status")).upper() != "PAID":
            active += 1
    z += 0.12 * active
    if row["annual_income"] > 0:
        er = row["annual_expenses"] / row["annual_income"]
        z += 0.15 * er
    p = 1.0 / (1.0 + math.exp(-z))
    return max(0.01, min(0.99, p))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=20000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=str, default="train/data/synthetic.csv")
    args = parser.parse_args()

    df = generate_dataset(n=args.n, seed=args.seed)
    targets = []
    rng = np.random.RandomState(args.seed + 123)
    for _, row in df.iterrows():
        p = default_target(row.to_dict())
        p = max(0.01, min(0.95, p + rng.randn() * 0.006))
        targets.append(1 if rng.rand() < p else 0)
    df["default"] = targets
    rate = float(df["default"].mean())
    if rate < 0.06:
        zeros = df[df["default"] == 0].index.tolist()
        rng2 = np.random.RandomState(args.seed + 456)
        rng2.shuffle(zeros)
        need = int((0.07 - rate) * len(df))
        for idx in zeros[:need]:
            df.at[idx, "default"] = 1
    elif rate > 0.10:
        ones = df[df["default"] == 1].index.tolist()
        rng2 = np.random.RandomState(args.seed + 789)
        rng2.shuffle(ones)
        need = int((rate - 0.07) * len(df))
        for idx in ones[:need]:
            df.at[idx, "default"] = 0
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    meta = {
        "n": len(df),
        "seed": args.seed,
        "default_rate": float(df["default"].mean()),
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    with open(args.out.replace(".csv", "_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(json.dumps(meta))
