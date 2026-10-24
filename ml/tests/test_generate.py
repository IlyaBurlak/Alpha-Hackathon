from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


def test_generate_reproducible_and_rate():
    root = Path(__file__).parent.parent
    out1 = root / "train" / "data" / "test_gen1.csv"
    out2 = root / "train" / "data" / "test_gen2.csv"
    meta1 = root / "train" / "data" / "test_gen1_meta.json"
    meta2 = root / "train" / "data" / "test_gen2_meta.json"
    for p in [out1, out2, meta1, meta2]:
        try:
            p.unlink()
        except Exception:
            pass

    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    subprocess.run([sys.executable, "train/generate.py", "--n", "2000", "--seed", "42", "--out", str(out1)], cwd=str(root), env=env, check=True)
    subprocess.run([sys.executable, "train/generate.py", "--n", "2000", "--seed", "42", "--out", str(out2)], cwd=str(root), env=env, check=True)

    h1 = hashlib.md5(out1.read_bytes()).hexdigest()
    h2 = hashlib.md5(out2.read_bytes()).hexdigest()
    assert h1 == h2

    m = json.loads(meta1.read_text(encoding="utf-8"))
    rate = m["default_rate"]
    assert 0.06 <= rate <= 0.10

    for p in [out1, out2, meta1, meta2]:
        try:
            p.unlink()
        except Exception:
            pass
