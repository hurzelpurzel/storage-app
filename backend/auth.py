from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import msal
import requests
import os
from .config import settings

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Single persistent MSAL instance
# ---------------------------------------------------------------------------
# MSAL stores the PKCE code_verifier in its token cache between the
# get_authorization_request_url() call and acquire_token_by_authorization_code().
# Using a module-level singleton ensures that cache is not discarded.
# ---------------------------------------------------------------------------
_msal_app: Optional[msal.ConfidentialClientApplication] = None

def _get_msal_app() -> msal.ConfidentialClientApplication:
    global _msal_app
    if _msal_app is None:
        http_client = requests.Session()
        if settings.zscaler:
            zscaler_cert_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "data", "zscaler.pem"
            )
            if os.path.exists(zscaler_cert_path):
                http_client.verify = zscaler_cert_path
                
        _msal_app = msal.ConfidentialClientApplication(
            settings.azure_client_id,
            authority=settings.azure_authority
                or f"https://login.microsoftonline.com/{settings.azure_tenant_id}",
            client_credential=settings.azure_client_secret,
            http_client=http_client
        )
    return _msal_app


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username


def get_entra_auth_url(code_challenge: str) -> Optional[str]:
    """
    Build the Entra ID authorisation URL manually so we have full control
    over the PKCE parameters. MSAL's get_authorization_request_url() silently
    drops code_challenge/code_challenge_method via **kwargs — so we bypass it.
    """
    if not settings.enable_entra_auth:
        return None

    # Use MSAL only to resolve the correct authorization endpoint for the tenant
    auth_endpoint = _get_msal_app().authority.authorization_endpoint

    params = {
        "client_id": settings.azure_client_id,
        "response_type": "code",
        "redirect_uri": settings.redirect_uri,
        "scope": "openid",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    from urllib.parse import urlencode
    return f"{auth_endpoint}?{urlencode(params)}"


def verify_entra_token(code: str, code_verifier: str):
    """
    Exchange an authorisation code + PKCE verifier for tokens via MSAL.
    acquire_token_by_authorization_code passes **kwargs through to the
    underlying OAuth client, which sends code_verifier in the POST body.
    """
    if not settings.enable_entra_auth:
        raise HTTPException(status_code=400, detail="Entra authentication not enabled")

    result = _get_msal_app().acquire_token_by_authorization_code(
        code,
        scopes=[],
        redirect_uri=settings.redirect_uri,
        data={"code_verifier": code_verifier},
    )

    if "access_token" not in result:
        error_desc = result.get("error_description", "unknown error")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to authenticate with Entra ID: {error_desc}",
        )
    return result


# ---------------------------------------------------------------------------
# FastAPI auth dependencies
# ---------------------------------------------------------------------------

def get_current_user_optional():
    """Optional authentication — never rejects; used for public routes."""
    def optional_auth(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(
            HTTPBearer(auto_error=False)
        ),
    ):
        if settings.enable_entra_auth and credentials:
            return verify_token(credentials)
        elif not settings.enable_entra_auth:
            return "anonymous_user"
        return None
    return optional_auth


def get_current_user_required():
    """Mandatory authentication — returns 401 when auth is enabled and no valid token present."""
    def required_auth(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(
            HTTPBearer(auto_error=False)
        ),
    ):
        if not settings.enable_entra_auth:
            return "anonymous_user"
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return verify_token(credentials)
    return required_auth
