#!/usr/bin/env python3
"""Redact common secret patterns from repository files (in-place)."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"ghp_[A-Za-z0-9]+"), "REDACTED_GITHUB_PAT"),
    (re.compile(r"gho_[A-Za-z0-9]+"), "REDACTED_GITHUB_OAUTH"),
    (re.compile(r"ghu_[A-Za-z0-9]+"), "REDACTED_GITHUB_USER"),
    (re.compile(r"ghs_[A-Za-z0-9]+"), "REDACTED_GITHUB_SERVER"),
    (re.compile(r"ghr_[A-Za-z0-9]+"), "REDACTED_GITHUB_REFRESH"),
    (re.compile(r"atsk_[a-f0-9]{32,}"), "REDACTED_AFRICASTALKING_KEY"),
    (re.compile(r"sk_live_[A-Za-z0-9]+"), "REDACTED_STRIPE_LIVE"),
    (re.compile(r"sk_test_[A-Za-z0-9]+"), "REDACTED_STRIPE_TEST"),
    (re.compile(r"pk_live_[A-Za-z0-9]+"), "REDACTED_STRIPE_PK_LIVE"),
    (
        re.compile(
            r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
        ),
        "REDACTED_JWT_TOKEN",
    ),
    (
        re.compile(r"postgresql://([^:\s/]+):([^@\s]+)@"),
        r"postgresql://\1:REDACTED_DB_PASSWORD@",
    ),
    (re.compile(r"redis://default:[^@\s]+@"), "redis://default:REDACTED_REDIS_PASSWORD@"),
    (re.compile(r"mongodb\+srv://([^:]+):([^@]+)@"), r"mongodb+srv://\1:REDACTED_PASSWORD@"),
    (re.compile(r"sms_automation_secret_\d+"), "REDACTED_CRON_SECRET"),
    (re.compile(r"\b[a-f0-9]{32}\b"), "REDACTED_HEX_SECRET"),
    (
        re.compile(r"[A-Za-z0-9+/]{40,}={0,2}"),
        "REDACTED_APP_SECRET",
    ),
    (
        re.compile(r'["\']?(JWT_SECRET|JWT_REFRESH_SECRET|ENCRYPTION_KEY|CRON_SECRET|CELCOM_API_KEY|AFRICASTALKING_API_KEY|MOBITECH_API_KEY|SMSLEOPARD_ACCESS_TOKEN)["\']?\s*[=:]\s*["\']?[^"\'\s]+["\']?'),
        r"\1=REDACTED",
    ),
]


ALLOWED_SUFFIXES = {".md", ".txt", ".js"}
ALLOWED_PREFIXES = ("archive/", "docs/")


def should_process(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "SECURITY_ROTATION_REQUIRED.md":
        return False
    if path.suffix not in ALLOWED_SUFFIXES:
        return False
    if rel.startswith(ALLOWED_PREFIXES):
        return True
    if path.suffix in {".md", ".txt"} and "/" not in rel:
        return True
    return False


def tracked_files() -> list[Path]:
    out = subprocess.check_output(
        ["git", "ls-files"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
    )
    paths = [ROOT / line for line in out.splitlines() if line.strip()]
    return [p for p in paths if should_process(p)]


def redact_file(path: Path) -> bool:
    if not path.is_file():
        return False
    try:
        original = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False

    updated = original
    for pattern, replacement in PATTERNS:
        updated = pattern.sub(replacement, updated)

    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed: list[str] = []
    for path in tracked_files():
        if redact_file(path):
            changed.append(str(path.relative_to(ROOT)))

    print(f"Redacted secrets in {len(changed)} file(s).")
    for name in changed[:50]:
        print(f"  - {name}")
    if len(changed) > 50:
        print(f"  ... and {len(changed) - 50} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
