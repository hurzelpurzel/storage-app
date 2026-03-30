from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class StorageItemBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., max_length=100)
    quantity: int = Field(..., ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = Field(default_factory=list)

class StorageItemCreate(StorageItemBase):
    pass

class StorageItemUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = None

class StorageItem(StorageItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginationResponse(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

class StorageItemListResponse(BaseModel):
    data: List[StorageItem]
    pagination: PaginationResponse

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None