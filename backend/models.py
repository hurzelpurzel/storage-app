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


# ---------------------------------------------------------------------------
# S3 User models
# ---------------------------------------------------------------------------

class S3UserCreate(BaseModel):
    """Request body for creating a new S3 user via the NetApp SVM API."""
    username: str = Field(..., min_length=1, max_length=255)
    comment: Optional[str] = Field(None, max_length=1000)
    environment: str = Field(..., min_length=1, max_length=100)


class S3User(BaseModel):
    """Persisted S3 user record (secret key is never stored)."""
    id: str
    owner_email: str
    environment: str
    username: str
    comment: Optional[str]
    access_key: str
    key_expiry_time: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class S3UserCreateResponse(S3User):
    """Response returned immediately after creation — includes the one-time secret."""
    secret_key: str


class S3UserListResponse(BaseModel):
    data: List[S3User]


# ---------------------------------------------------------------------------
# SVM environment listing (returned to the frontend)
# ---------------------------------------------------------------------------

class SvmEnvironment(BaseModel):
    """Minimal public info about a configured SVM environment (no credentials)."""
    name: str


class SvmEnvironmentsResponse(BaseModel):
    environments: List[SvmEnvironment]