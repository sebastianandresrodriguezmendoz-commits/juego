import os
import sys

# Agregar la ruta del backend al sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app
from app.models import db, User, Score, GameStats, UserAchievement
from app.utils.jwt_manager import generate_token

class TestConfig:
    TESTING = True
    DEBUG = False
    SECRET_KEY = 'test_secret_key_gunrun2d_super_secure_key_32_bytes_minimum'
    # Base de datos SQLite en memoria para tests atómicos e instantáneos
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DB_NAME = 'gunrun2d_test'
    DB_HOST = '127.0.0.1'
    DB_PORT = 3306
    DB_USER = 'root'
    DB_PASSWORD = ''

def create_test_client():
    """Crea una aplicación Flask configurada exclusivamente para pruebas."""
    app = create_app(TestConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()

    return app, client

