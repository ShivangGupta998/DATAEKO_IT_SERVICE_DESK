import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Initialize SQLAlchemy engine with SSL, keepalives, and pool management
engine = create_engine(
    db_url,
    echo=True,
    pool_pre_ping=True,      # Tests connection health before issuing queries
    pool_recycle=300,        # Recycles connections every 5 minutes to prevent stale timeouts
    connect_args={
        "sslmode": "require",
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for ORM models
Base = declarative_base()

# Dependency to yield database sessions per API request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()