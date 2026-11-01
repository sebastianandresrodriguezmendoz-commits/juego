import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde la raíz del proyecto
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
env_path = os.path.join(base_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

class Config:
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'gunrun2d')

    # URI de conexión para SQLAlchemy con driver PyMySQL o DATABASE_URL de la nube
    _cloud_db_url = os.getenv('DATABASE_URL')
    if _cloud_db_url:
        if _cloud_db_url.startswith('mysql://'):
            SQLALCHEMY_DATABASE_URI = _cloud_db_url.replace('mysql://', 'mysql+pymysql://', 1)
        elif _cloud_db_url.startswith('postgres://'):
            SQLALCHEMY_DATABASE_URI = _cloud_db_url.replace('postgres://', 'postgresql://', 1)
        else:
            SQLALCHEMY_DATABASE_URI = _cloud_db_url
    else:
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    }

    SECRET_KEY = os.getenv('SECRET_KEY', 'gunrun2d_super_secret_jwt_key_2026_dev_prod')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
    PORT = int(os.getenv('PORT', '5000'))
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
