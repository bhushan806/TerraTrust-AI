"""Database connectivity and session management."""

import logging
from typing import Generator, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Engine creation with connection pool limits
# Note: For SQLite in testing, connect_args={"check_same_thread": False} is required
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.models.base import Base


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connectivity(db: Optional[Session] = None) -> bool:
    """Verify database connectivity with a lightweight probe."""
    try:
        if db is not None:
            db.execute(text("SELECT 1"))
            return True
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database connectivity check failed: %s", str(exc))
        return False
