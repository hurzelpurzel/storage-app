from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import msal
from .config import settings

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    return username

def get_entra_auth_url():
    """Generate Entra ID authentication URL if enabled"""
    if not settings.enable_entra_auth:
        return None
    
    app = msal.ConfidentialClientApplication(
        settings.azure_client_id,
        authority=settings.azure_authority or f"https://login.microsoftonline.com/{settings.azure_tenant_id}",
        client_credential=settings.azure_client_secret,
    )
    
    auth_url = app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri="http://localhost:8000/auth/callback"
    )
    return auth_url

def verify_entra_token(code: str):
    """Verify Entra ID authentication code and return user info"""
    if not settings.enable_entra_auth:
        raise HTTPException(status_code=400, detail="Entra authentication not enabled")
    
    app = msal.ConfidentialClientApplication(
        settings.azure_client_id,
        authority=settings.azure_authority or f"https://login.microsoftonline.com/{settings.azure_tenant_id}",
        client_credential=settings.azure_client_secret,
    )
    
    result = app.acquire_token_by_authorization_code(
        code,
        scopes=["User.Read"],
        redirect_uri="http://localhost:8000/auth/callback"
    )
    
    if "access_token" in result:
        return result
    else:
        raise HTTPException(status_code=400, detail="Failed to authenticate with Entra ID")

# Optional authentication dependency
def get_current_user_optional():
    """Optional authentication - only validates if token is provided"""
    def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
        if settings.enable_entra_auth and credentials:
            return verify_token(credentials)
        elif not settings.enable_entra_auth:
            return "anonymous_user"  # Allow access without auth when disabled
        return None
    return optional_auth