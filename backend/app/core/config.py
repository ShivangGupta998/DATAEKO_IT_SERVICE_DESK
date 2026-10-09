from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # ========================================================
    # SLACK
    # ========================================================

    SLACK_BOT_TOKEN: str | None = None
    SLACK_CHANNEL_ID: str | None = None

    # ========================================================
    # DEFAULT ADMIN (optional)
    # Only seed when these values are explicitly configured.
    # ========================================================

    DEFAULT_ADMIN_EMAIL: str | None = None
    DEFAULT_ADMIN_USERNAME: str | None = None
    DEFAULT_ADMIN_PASSWORD: str | None = None

    # ========================================================
    # GEMINI AI
    # ========================================================
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()