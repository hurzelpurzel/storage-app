from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class SvmConfig(BaseModel):
    """Parsed configuration for a single NetApp SVM environment."""
    name: str        # Display name, e.g. "DEV/TEST"
    base_url: str    # e.g. "http://1.2.3.4/api/"
    username: str
    password: str
    svm_uuid: str    # UUID used in NetApp API paths


def _parse_svm_env(raw: Optional[str], slot: int) -> Optional[SvmConfig]:
    """
    Parse a comma-separated SVM config string of the form:
      <name>,<base_url>,<username>,<password>,<svm_uuid>
    Returns None (and logs a warning) if the value is missing or malformed.
    """
    if not raw:
        return None
    parts = [p.strip() for p in raw.split(",")]
    if len(parts) != 5:
        logger.warning(
            "NETAPP_ENV_%d is malformed — expected 5 comma-separated fields "
            "(name,base_url,username,password,svm_uuid), got %d. Ignoring.",
            slot, len(parts),
        )
        return None
    return SvmConfig(
        name=parts[0],
        base_url=parts[1].rstrip("/"),
        username=parts[2],
        password=parts[3],
        svm_uuid=parts[4],
    )


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./storage_app.db"

    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Entra ID (Optional Authentication)
    enable_entra_auth: bool = False
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    azure_tenant_id: Optional[str] = None
    azure_authority: Optional[str] = None
    # The URI Azure will redirect back to after login.
    # Must match exactly what is registered in the Azure app registration.
    # Default is the React dev server root — change for production.
    redirect_uri: str = "http://localhost:3000/"
    # When ENABLE_ENTRA_AUTH=false, this username is used as the auto-logged-in dev user.
    dev_user: str = "dev-user"

    # Zscaler Support
    zscaler: bool = False

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # NetApp SVM environments — one env var per environment, comma-separated:
    #   NETAPP_ENV_1=DEV/TEST,http://1.2.3.4/api/,admin,password,<svm-uuid>
    #   NETAPP_ENV_2=UAT/PROD,http://5.6.7.8/api/,admin,password,<svm-uuid>
    #   NETAPP_ENV_3=INFRA,http://9.10.11.12/api/,admin,password,<svm-uuid>
    netapp_env_1: Optional[str] = None
    netapp_env_2: Optional[str] = None
    netapp_env_3: Optional[str] = None

    # Set to False to disable TLS certificate verification (e.g. self-signed certs)
    netapp_verify_ssl: bool = True

    class Config:
        env_file = ".env"

    def get_svm_configs(self) -> Dict[str, SvmConfig]:
        """
        Return a dict keyed by SVM name for all configured environments.
        Slots with missing or malformed values are silently skipped.
        """
        configs: Dict[str, SvmConfig] = {}
        for slot, raw in enumerate(
            [self.netapp_env_1, self.netapp_env_2, self.netapp_env_3], start=1
        ):
            cfg = _parse_svm_env(raw, slot)
            if cfg:
                configs[cfg.name] = cfg
        return configs


settings = Settings()