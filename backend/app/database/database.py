from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Initialize SQLAlchemy engine with connection pool pre-pinging to prevent stale connections
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True
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