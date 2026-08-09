"""
Shared DB connection for the whole Flask backend.
Every blueprint (auth, billing, payments, readings...) imports Base/engine/Session
from HERE, so there is exactly one connection setup for the entire app,
mirroring how AppDbContext is the single EF Core context in the WinForms app.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL")  # set this in Render's dashboard

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()



# ── match these to your existing appsettings.json / EF connection string ──
# DB_SERVER = "localhost\\SQLEXPRESS"     # e.g. "DESKTOP-ABC123\\SQLEXPRESS"
# DB_NAME   = "WebConsumerInfo"
# DRIVER    = "ODBC Driver 17 for SQL Server"

# CONN_STR = (
#     f"mssql+pyodbc://@{DB_SERVER}/{DB_NAME}"
#     f"?driver={DRIVER.replace(' ', '+')}&trusted_connection=yes"
# )



# DB_SERVER = os.environ.get("DB_SERVER", "localhost\\SQLEXPRESS")
# DB_NAME   = os.environ.get("DB_NAME", "WebConsumerInfo")
# CONN_STR = os.environ.get("DATABASE_URL") or (
#     f"mssql+pyodbc://@{DB_SERVER}/{DB_NAME}?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
# )


# engine       = create_engine(CONN_STR, echo=False, pool_pre_ping=True)
# SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# Base         = declarative_base()


def get_db():
    """Use as a context manager: `with get_db() as db:`"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()