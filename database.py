"""
Shared DB connection for the whole Flask backend.
"""

import os
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base


def _normalize_database_url(url: str) -> str:
    """Make DATABASE_URL work with SQLAlchemy + hosted Postgres (Neon/Supabase/Vercel)."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    # Serverless (Vercel) almost always needs TLS to reach managed Postgres.
    if os.environ.get("VERCEL") == "1" or os.environ.get("DATABASE_SSL") == "1":
        parsed = urlparse(url)
        query = parse_qs(parsed.query)
        if "sslmode" not in query:
            query["sslmode"] = ["require"]
            url = urlunparse(parsed._replace(query=urlencode(query, doseq=True)))
    return url


DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

DATABASE_URL = _normalize_database_url(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_tables():
    """Create missing tables (idempotent). Useful when prod DB was never migrated."""
    import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def db_ping():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
