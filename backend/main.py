from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os

from .config import settings
from .database import get_db, create_tables
from .models import (
    StorageItem, StorageItemCreate, StorageItemUpdate, 
    StorageItemListResponse, ErrorResponse
)
from .crud import (
    get_storage_items, get_storage_item, create_storage_item,
    update_storage_item, delete_storage_item
)
from .auth import get_current_user_optional, get_entra_auth_url, verify_entra_token, create_access_token

# Create tables on startup
create_tables()

app = FastAPI(
    title="Storage Items API",
    description="A simple API for managing storage items with CRUD operations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "build")
if os.path.exists(frontend_dist_path):
    app.mount("/static", StaticFiles(directory=frontend_dist_path, html=True), name="static")

@app.get("/", response_class=FileResponse)
async def serve_frontend():
    """Serve the React frontend"""
    frontend_index = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {"message": "Storage API is running. Frontend not built yet."}

# Authentication endpoints (optional)
@app.get("/api/auth/login-url")
async def get_login_url():
    """Get Entra ID login URL if authentication is enabled"""
    if not settings.enable_entra_auth:
        return {"enabled": False}
    
    auth_url = get_entra_auth_url()
    return {"enabled": True, "login_url": auth_url}

@app.post("/api/auth/callback")
async def auth_callback(code: str):
    """Handle Entra ID authentication callback"""
    try:
        result = verify_entra_token(code)
        # Create a JWT token for the authenticated user
        access_token = create_access_token({"sub": result.get("account", {}).get("username", "user")})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Storage Items API endpoints
@app.get(
    "/api/storage-items", 
    response_model=StorageItemListResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def list_storage_items(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional())
):
    """List all storage items with optional pagination and filtering"""
    try:
        result = get_storage_items(db, page=page, limit=limit, category=category)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/api/storage-items", 
    response_model=StorageItem,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 409: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def create_new_storage_item(
    item: StorageItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional())
):
    """Create a new storage item"""
    try:
        return create_storage_item(db, item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/api/storage-items/{item_id}", 
    response_model=StorageItem,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_storage_item_by_id(
    item_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional())
):
    """Get a storage item by ID"""
    item = get_storage_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Storage item not found")
    return item

@app.put(
    "/api/storage-items/{item_id}", 
    response_model=StorageItem,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def update_storage_item_by_id(
    item_id: str,
    item_update: StorageItemUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional())
):
    """Update a storage item"""
    updated_item = update_storage_item(db, item_id, item_update)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Storage item not found")
    return updated_item

@app.delete(
    "/api/storage-items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def delete_storage_item_by_id(
    item_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional())
):
    """Delete a storage item"""
    deleted = delete_storage_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Storage item not found")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "auth_enabled": settings.enable_entra_auth,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)