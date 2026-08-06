from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # ========================================================
    # SLACK
    # ========================================================

    SLACK_BOT_TOKEN: str
    SLACK_CHANNEL_ID: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()