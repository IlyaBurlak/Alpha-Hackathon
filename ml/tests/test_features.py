from app.features import build_features


from pathlib import Path
import json

FIXTURES = Path(__file__).parent / "fixtures"


def test_features_full():
    from app.schemas import ApplicationIn
    app = ApplicationIn.model_validate(json.loads((FIXTURES / "application_full.json").read_text(encoding="utf-8")))
    feats, missing = build_features(app)
    assert "business_age_months" in feats
    assert "avg_revenue_monthly" in feats
    assert "expense_ratio" in feats
    assert "requested_to_monthly_revenue" in feats
    assert "term_months" in feats
    assert "active_loans_count" in feats
    assert "delayed_payment_cases" in feats
    assert "debt_service_ratio" in feats
    assert missing == []
