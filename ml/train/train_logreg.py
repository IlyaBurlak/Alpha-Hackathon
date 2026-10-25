from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score, average_precision_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.features import build_features
from app.schemas import ApplicationIn


FEATURES = [
    "business_age_months",
    "is_sole_proprietor",
    "okved_group",
    "avg_revenue_monthly",
    "expense_ratio",
    "revenue_cv",
    "employees_count",
    "bank_client_months",
    "active_loans_count",
    "debt_service_ratio",
    "delayed_payment_cases",
    "requested_to_monthly_revenue",
    "term_months",
]


def build_app_from_row(row: pd.Series):
    created = datetime(2026, 10, 24)
    business_age_months = float(row["business_age_months"])
    reg = created
    bank_client_months = float(row.get("bank_client_months", 0))
    from datetime import timedelta

    reg = created - timedelta(days=int(business_age_months * 30))
    bcs = created - timedelta(days=int(bank_client_months * 30)) if bank_client_months > 0 else None

    if int(row.get("credit_history_len", 0)) > 0 and float(row.get("active_loans_count", 0)) >= 0:
        # simplified
        pass

    app_dict = {
        "id": 1,
        "userId": 1,
        "organizationId": 1,
        "sum": float(row["sum"]),
        "status": "SUBMITTED",
        "createdAt": created.isoformat() + "Z",
        "creditTime": {"units": "MONTH", "value": int(row["term_months"])},
        "applicationScore": {
            "history": {
                "creditHistory": [],
                "bankrupt": bool(row.get("bankrupt", False)),
                "casesDelayedPayment": int(row.get("delayed_payment_cases", 0)),
            },
            "registerInfo": {
                "isActive": bool(row.get("isActive", True)),
                "registrationDate": reg.date().isoformat(),
                "annualIncome": float(row["annual_income"]),
                "annualExpenses": float(row["annual_expenses"]),
                "employeesCount": int(row.get("employees_count", 1)),
                "lastYearBalances": [float(x) for x in [row.get(f"b{i}", row["annual_income"] / 12.0) for i in range(16)]],
                "ogrn": "123456789012345" if row.get("is_sole_proprietor") else "1234567890123",
                "okved": str(row.get("okved", "46.90")),
                "bankClientSince": bcs.date().isoformat() if bcs else None,
            },
        },
    }
    return ApplicationIn.model_validate(app_dict)


def main():
    data_path = Path("train/data/synthetic.csv")
    df = pd.read_csv(data_path)

    X_list = []
    y_list = []
    for _, row in df.iterrows():
        try:
            app = build_app_from_row(row)
            feats, missing = build_features(app)
            if missing:
                continue
            vec = {}
            for f in FEATURES:
                vec[f] = feats.get(f)
            X_list.append(vec)
            y_list.append(int(row["default"]))
        except Exception:
            continue

    X = pd.DataFrame(X_list)
    y = pd.Series(y_list)

    numeric = [f for f in FEATURES if f not in ("is_sole_proprietor", "okved_group")]
    categorical = ["is_sole_proprietor", "okved_group"]

    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric),
            ("cat", categorical_transformer, categorical),
        ]
    )

    clf = Pipeline([
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(max_iter=1000)),
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    clf.fit(X_train, y_train)

    y_pred = clf.predict_proba(X_test)[:, 1]
    metrics = {
        "roc_auc": float(roc_auc_score(y_test, y_pred)),
        "pr_auc": float(average_precision_score(y_test, y_pred)),
        "brier": float(brier_score_loss(y_test, y_pred)),
    }

    Path("model").mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, "model/logreg-0.1.joblib")

    # типичные значения (для баллов факторов) и диапазоны (для ограничения выбросов)
    medians = {f: float(X_train[f].median()) for f in numeric}
    modes = {}
    for f in categorical:
        top = X_train[f].mode().iloc[0]
        modes[f] = top.item() if hasattr(top, "item") else top
    ranges = {
        f: [float(X_train[f].quantile(0.01)), float(X_train[f].quantile(0.99))] for f in numeric
    }

    meta = {
        "version": "logreg-0.1",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "features": FEATURES,
        "numeric": numeric,
        "categorical": categorical,
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "default_rate": float(y.mean()),
        "medians": medians,
        "modes": modes,
        "ranges": ranges,
    }
    with open("model/meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    with open("model/metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    print(json.dumps({"metrics": metrics, "meta": meta}, ensure_ascii=False))


if __name__ == "__main__":
    main()