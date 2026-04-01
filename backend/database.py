from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
from .config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class StorageItem(Base):
    __tablename__ = "storage_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    unit_price = Column(Float, nullable=True)
    location = Column(String(255), nullable=True)
    tags = Column(String, nullable=True)  # JSON string for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class S3User(Base):
    """Stores S3 users created via the NetApp SVM API."""
    __tablename__ = "s3_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Environment name this user belongs to (e.g. "DEV/TEST", "UAT/PROD", "INFRA")
    environment = Column(String(100), nullable=False)
    username = Column(String(255), nullable=False)
    comment = Column(Text, nullable=True)
    access_key = Column(String(255), nullable=False)
    # key_expiry_time returned by NetApp (nullable — not always present)
    key_expiry_time = Column(String(64), nullable=True)
    # The secret key is intentionally NOT stored; it is shown to the user once and then discarded.
    created_at = Column(DateTime, default=datetime.utcnow)

    # A username must be unique within an environment
    __table_args__ = (
        UniqueConstraint("environment", "username", name="uq_s3_users_env_username"),
    )


def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()