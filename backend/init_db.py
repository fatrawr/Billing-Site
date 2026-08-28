"""
Create all tables defined in models.py on the DATABASE_URL database.
Safe to re-run: existing tables are left alone.

Usage (from project root, with .env loaded or env vars set):
  python init_db.py
"""

import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from database import Base, engine
import models  # noqa: F401 — registers all models on Base.metadata


def main():
    print("Creating tables (if missing)...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables ready:")
    for name in sorted(Base.metadata.tables):
        print(f"  - {name}")


if __name__ == "__main__":
    if not os.environ.get("DATABASE_URL"):
        raise SystemExit("DATABASE_URL is not set. Put it in .env or export it first.")
    main()
