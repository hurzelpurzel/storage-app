from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import json
import math
from .database import StorageItem
from .models import StorageItemCreate, StorageItemUpdate

def get_storage_items(
    db: Session, 
    page: int = 1, 
    limit: int = 20, 
    category: Optional[str] = None
):
    """Get storage items with pagination and optional filtering"""
    query = db.query(StorageItem)
    
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

def get_storage_item(db: Session, item_id: str):
    """Get a single storage item by ID"""
    item = db.query(StorageItem).filter(StorageItem.id == item_id).first()
    if item and item.tags:
        try:
            item.tags = json.loads(item.tags)
        except json.JSONDecodeError:
            item.tags = []
    elif item:
        item.tags = []
    return item

def create_storage_item(db: Session, item: StorageItemCreate):
    """Create a new storage item"""
    # Convert tags list to JSON string for storage
    tags_json = json.dumps(item.tags) if item.tags else None
    
    db_item = StorageItem(
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

def update_storage_item(db: Session, item_id: str, item_update: StorageItemUpdate):
    """Update an existing storage item"""
    db_item = db.query(StorageItem).filter(StorageItem.id == item_id).first()
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

def delete_storage_item(db: Session, item_id: str):
    """Delete a storage item"""
    db_item = db.query(StorageItem).filter(StorageItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False