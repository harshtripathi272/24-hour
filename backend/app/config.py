"""
Application Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class."""
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'video_app')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-me')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 900))  # 15 minutes
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))  # 7 days
    
    # Playback Token Configuration
    PLAYBACK_TOKEN_SECRET = os.getenv('PLAYBACK_TOKEN_SECRET', 'playback-secret-change-me')
    PLAYBACK_TOKEN_EXPIRES = int(os.getenv('PLAYBACK_TOKEN_EXPIRES', 3600))  # 1 hour
    
    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    MONGO_DB_NAME = 'video_app_test'
