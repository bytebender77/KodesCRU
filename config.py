"""
Configuration module for KodesCRUxxx
Handles environment variables and app settings
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o-mini")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "1000"))
    
    # API Configuration
    API_URL: str = os.getenv("API_URL", "http://127.0.0.1:8000")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Application Settings
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Project paths
    BASE_DIR: Path = Path(__file__).parent
    LOGO_PATH: Path = BASE_DIR / "logo.jpg"
    
    class Config:
        case_sensitive = True

# Initialize settings
settings = Settings()

# Validate OpenAI API key
if not settings.OPENAI_API_KEY:
    print("⚠️  WARNING: OPENAI_API_KEY not set in environment variables")