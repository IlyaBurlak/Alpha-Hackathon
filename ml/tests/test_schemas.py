import json
from pathlib import Path

from app.schemas import LoanApplication


FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_all_fixtures():
    for name in [
        "application_full.json",
        "application_old_format.json",
        "application_no_register.json",
        "application_no_history.json",
    ]:
        data = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
        app = LoanApplication.model_validate(data)
        assert app.sum is not None
        assert app.creditTime is not None
