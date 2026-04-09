from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import json
import math
from .database import StorageItem, S3User
from .models import StorageItemCreate, StorageItemUpdate

def get_storage_items(
    db: Session, 
    owner_email: str,
    page: int = 1, 
    limit: int = 20, 
    category: Optional[str] = None
):
    """Get storage items with pagination and optional filtering"""
    query = db.query(StorageItem).filter(StorageItem.owner_email == owner_email)
    
    if category:
        query = query.filter(StorageItem.category == category)
    
    # Calculate pagination
    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    
    items = query.offset((page - 1) * limit).limit(limit).all()
    
    # Convert tags from JSON string to list
    for item in items:
        if item.tags:
            try:
                item.tags = json.loads(item.tags)
            except json.JSONDecodeError:
                item.tags = []
        else:
            item.tags = []
    
    return {
        "data": items,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }

def get_storage_item(db: Session, item_id: str, owner_email: str):
    """Get a single storage item by ID"""
    item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.owner_email == owner_email).first()
    if item and item.tags:
        try:
            item.tags = json.loads(item.tags)
        except json.JSONDecodeError:
            item.tags = []
    elif item:
        item.tags = []
    return item

def create_storage_item(db: Session, item: StorageItemCreate, owner_email: str):
    """Create a new storage item"""
    # Convert tags list to JSON string for storage
    tags_json = json.dumps(item.tags) if item.tags else None
    
    db_item = StorageItem(
        owner_email=owner_email,
        name=item.name,
        description=item.description,
        category=item.category,
        quantity=item.quantity,
        unit_price=item.unit_price,
        location=item.location,
        tags=tags_json
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Convert tags back to list for response
    if db_item.tags:
        try:
            db_item.tags = json.loads(db_item.tags)
        except json.JSONDecodeError:
            db_item.tags = []
    else:
        db_item.tags = []
    
    return db_item

def update_storage_item(db: Session, item_id: str, item_update: StorageItemUpdate, owner_email: str):
    """Update an existing storage item"""
    db_item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.owner_email == owner_email).first()
    if not db_item:
        return None
    
    # Update fields that are provided
    update_data = item_update.model_dump(exclude_unset=True)
    
    # Handle tags conversion
    if "tags" in update_data:
        update_data["tags"] = json.dumps(update_data["tags"]) if update_data["tags"] else None
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    
    # Convert tags back to list for response
    if db_item.tags:
        try:
            db_item.tags = json.loads(db_item.tags)
        except json.JSONDecodeError:
            db_item.tags = []
    else:
        db_item.tags = []
    
    return db_item

def delete_storage_item(db: Session, item_id: str, owner_email: str):
    """Delete a storage item"""
    db_item = db.query(StorageItem).filter(StorageItem.id == item_id, StorageItem.owner_email == owner_email).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False


# ---------------------------------------------------------------------------
# S3 User CRUD
# ---------------------------------------------------------------------------

def get_s3_users(db: Session, owner_email: str, environment: Optional[str] = None) -> List[S3User]:
    """Return S3 users ordered by creation date, filtered by owner and optionally environment."""
    query = db.query(S3User).filter(S3User.owner_email == owner_email)
    if environment:
        query = query.filter(S3User.environment == environment)
    return query.order_by(S3User.created_at).all()


def get_s3_user_by_username(
    db: Session, environment: str, username: str
) -> Optional[S3User]:
    """Look up a single S3 user by environment + username."""
    return (
        db.query(S3User)
        .filter(S3User.environment == environment, S3User.username == username)
        .first()
    )


def create_s3_user(
    db: Session,
    owner_email: str,
    environment: str,
    username: str,
    access_key: str,
    comment: Optional[str] = None,
    key_expiry_time: Optional[str] = None,
) -> S3User:
    """Persist a new S3 user record (secret key is not stored)."""
    db_user = S3User(
        owner_email=owner_email,
        environment=environment,
        username=username,
        access_key=access_key,
        comment=comment,
        key_expiry_time=key_expiry_time,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_s3_user(db: Session, owner_email: str, environment: str, username: str) -> bool:
    """Delete an S3 user, bound strictly to the owner_email."""
    db_user = (
        db.query(S3User)
        .filter(S3User.owner_email == owner_email, S3User.environment == environment, S3User.username == username)
        .first()
    )
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# ---------------------------------------------------------------------------
# S3 Bucket CRUD
# ---------------------------------------------------------------------------

def get_s3_buckets(db: Session, owner_email: str, environment: Optional[str] = None):
    from .database import S3Bucket
    query = db.query(S3Bucket).filter(S3Bucket.owner_email == owner_email)
    if environment:
        query = query.filter(S3Bucket.environment == environment)
    return query.order_by(S3Bucket.created_at).all()

def create_s3_bucket(db: Session, owner_email: str, environment: str, name: str):
    from .database import S3Bucket
    db_bucket = S3Bucket(
        owner_email=owner_email,
        environment=environment,
        name=name,
        bucket_uuid="pending"
    )
    db.add(db_bucket)
    db.commit()
    db.refresh(db_bucket)
    return db_bucket

def update_s3_bucket_uuid(db: Session, bucket_id: str, new_uuid: str):
    from .database import S3Bucket
    db_bucket = db.query(S3Bucket).filter(S3Bucket.id == bucket_id).first()
    if db_bucket:
        db_bucket.bucket_uuid = new_uuid
        db.commit()
        db.refresh(db_bucket)
    return db_bucket

def delete_s3_bucket(db: Session, owner_email: str, environment: str, bucket_uuid: str) -> bool:
    from .database import S3Bucket
    db_bucket = (
        db.query(S3Bucket)
        .filter(
            S3Bucket.owner_email == owner_email, 
            S3Bucket.environment == environment, 
            S3Bucket.bucket_uuid == bucket_uuid
        )
        .first()
    )
    if db_bucket:
        db.delete(db_bucket)
        db.commit()
        return True
    return False