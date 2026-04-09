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
    owner_email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    quantity = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    location = Column(String(255), nullable=True)
    
    # Store tags as a JSON string
    tags = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class S3User(Base):
    """Stores S3 users created via the NetApp SVM API."""
    __tablename__ = "s3_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_email = Column(String(255), nullable=False)
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


class S3Bucket(Base):
    """Stores locally tracked S3 Buckets, natively syncing pending UUIDs from SVMs."""
    __tablename__ = "s3_buckets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_email = Column(String(255), nullable=False)
    environment = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Defaults to 'pending'. Checked asynchronously via UI refresh sweeps.
    bucket_uuid = Column(String(255), default="pending", nullable=False)
    
    # Defaults to None. Transitions to "pending", then a UTC timestamp on full purge.
    deletion = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Names must be unique within a target environment SVM
    __table_args__ = (
        UniqueConstraint("environment", "name", name="uq_s3_buckets_env_name"),
    )


def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()