"""
CardioAI Application Configuration
Centralized configuration management for different environments
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # Application Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cardioai-secret-key-change-in-production'
    
    # Flask Settings
    FLASK_APP = 'app.py'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    DEBUG = False
    TESTING = False
    
    # Server Settings
    HOST = os.environ.get('HOST') or '0.0.0.0'
    PORT = int(os.environ.get('PORT') or 8080)
    #DEBUG_MODE = int(os.environ.get('DEBUG_MODE', 1))
    DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() in ['true', '1', 'yes', 'on']
    
    # Model Configuration
    MODEL_PATH = os.environ.get('MODEL_PATH') or './rf_model.pkl'
    MODEL_FEATURES = [
        'Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol',
        'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina',
        'Oldpeak', 'ST_Slope'
    ]
    
    # Chart Configuration
    CHART_DPI = 150
    CHART_STYLE = 'dark_background'
    CHART_COLORS = {
        'low_risk': '#00ff88',
        'high_risk': '#ff4757',
        'background': 'black'
    }
    
    # API Settings
    API_TITLE = 'CardioAI - Heart Disease Prediction API'
    API_VERSION = '1.0.0'
    API_DESCRIPTION = 'AI-powered heart disease risk assessment'
    
    # CORS Settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:8080']
    CORS_METHODS = ['GET', 'POST', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
    
    # Session Configuration
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Security Headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_DEFAULT = "100 per hour"
    RATE_LIMIT_PREDICT = "10 per minute"
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.environ.get('LOG_FILE') or 'logs/cardioai.log'
    
    # Health Check Settings
    HEALTH_CHECK_ENDPOINT = '/health'
    HEALTH_CHECK_TIMEOUT = 30
    
    @staticmethod
    def init_app(app):
        """Initialize the Flask app with configuration"""
        pass

class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    FLASK_ENV = 'development'
    SESSION_COOKIE_SECURE = False
    
    # Development-specific settings
    CORS_ORIGINS = ['*']  # Allow all origins in development
    LOG_LEVEL = 'DEBUG'
    
    # Chart settings for development
    CHART_DPI = 100  # Lower DPI for faster generation
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        
        # Development-specific initialization
        print("🔧 Running in DEVELOPMENT mode")
        print("🚨 Debug mode is ON - Do not use in production!")

class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Production-specific settings
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    RATE_LIMIT_ENABLED = True
    
    # Production CORS (restrict to specific domains)
    CORS_ORIGINS = [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
    ]
    
    # High-quality charts for production
    CHART_DPI = 200
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        
        # Production-specific initialization
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug:
            # File logging for production
            if not os.path.exists('logs'):
                os.makedirs('logs')
            
            file_handler = RotatingFileHandler(
                'logs/cardioai.log', maxBytes=10240000, backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(Config.LOG_FORMAT))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            
            app.logger.setLevel(logging.INFO)
            app.logger.info('🫀 CardioAI startup - Production Mode')

class TestingConfig(Config):
    """Testing environment configuration"""
    TESTING = True
    DEBUG = True
    
    # Testing-specific settings
    SECRET_KEY = 'testing-secret-key'
    SESSION_COOKIE_SECURE = False
    RATE_LIMIT_ENABLED = False  # Disable rate limiting for tests
    
    # Use in-memory or test database
    MODEL_PATH = './test_model.pkl'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        print("🧪 Running in TESTING mode")

class DockerConfig(Config):
    """Docker container configuration"""
    DEBUG = False
    
    # Docker-specific settings
    HOST = '0.0.0.0'
    PORT = 8080
    
    # Use environment variables in Docker
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'docker-secret-key'
    MODEL_PATH = os.environ.get('MODEL_PATH') or '/app/rf_model.pkl'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        print("🐳 Running in DOCKER mode")

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'docker': DockerConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development').lower()
    
    # Check if running in Docker
    if os.environ.get('DOCKER_ENV'):
        return config['docker']
    
    return config.get(env, config['default'])

# Medical Configuration
class MedicalConfig:
    """Medical-specific configuration and constants"""
    
    # Risk thresholds
    RISK_THRESHOLDS = {
        'age_high_risk': 50,
        'cholesterol_high': 240,
        'bp_high': 140,
        'heart_rate_low': 150
    }
    
    # Feature validation ranges
    FEATURE_RANGES = {
        'Age': {'min': 1, 'max': 120, 'unit': 'years'},
        'RestingBP': {'min': 80, 'max': 250, 'unit': 'mmHg'},
        'Cholesterol': {'min': 100, 'max': 600, 'unit': 'mg/dl'},
        'MaxHR': {'min': 60, 'max': 220, 'unit': 'bpm'},
        'Oldpeak': {'min': 0, 'max': 10, 'unit': 'ST depression'}
    }
    
    # Medical terminology mappings
    CHEST_PAIN_TYPES = {
        0: 'Typical Angina',
        1: 'Atypical Angina', 
        2: 'Non-Anginal Pain',
        3: 'Asymptomatic'
    }
    
    RESTING_ECG_TYPES = {
        0: 'Normal',
        1: 'ST-T Wave Abnormality',
        2: 'LV Hypertrophy'
    }
    
    ST_SLOPE_TYPES = {
        0: 'Upsloping',
        1: 'Flat',
        2: 'Downsloping'
    }
    
    # Recommendation templates
    RECOMMENDATIONS = {
        'high_risk': [
            "🚨 Consult a cardiologist immediately for comprehensive evaluation",
            "💊 Follow prescribed medications and treatment plans strictly",
            "🏃‍♂️ Start supervised exercise program as recommended by your doctor"
        ],
        'age_based': "🔬 Regular cardiac screenings are essential at your age",
        'cholesterol': "🥗 Adopt a heart-healthy diet low in saturated fats",
        'blood_pressure': "🧘‍♀️ Practice stress management and monitor blood pressure regularly",
        'general': [
            "🚭 Avoid smoking and limit alcohol consumption",
            "⚖️ Maintain a healthy weight through balanced diet and exercise", 
            "😴 Ensure adequate sleep (7-9 hours per night)",
            "📱 Use health monitoring apps to track your progress"
        ]
    }
    
    # Medical disclaimer
    MEDICAL_DISCLAIMER = (
        "This AI tool is for educational purposes only and should not replace "
        "professional medical advice, diagnosis, or treatment. Always consult "
        "healthcare professionals for medical decisions."
    )