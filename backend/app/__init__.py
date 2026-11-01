import os
import pymysql
from flask import Flask
from flask_cors import CORS
from .models import db, User, Score, GameStats, UserAchievement
from .routes.auth import auth_bp
from .routes.scores import scores_bp
from .utils.response import api_error, api_response
try:
    from config import Config
except ImportError:
    from ..config import Config

def _ensure_database_exists(config_class):
    """
    Verifica que la base de datos MySQL exista antes de que SQLAlchemy intente conectarse.
    Si no existe, la crea automáticamente con charset utf8mb4.
    """
    try:
        connection = pymysql.connect(
            host=config_class.DB_HOST,
            port=int(config_class.DB_PORT),
            user=config_class.DB_USER,
            password=config_class.DB_PASSWORD,
            charset='utf8mb4'
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{config_class.DB_NAME}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        connection.commit()
        connection.close()
        print(f"[DB INIT] Base de datos '{config_class.DB_NAME}' verificada/creada exitosamente en MySQL.")
    except Exception as e:
        print(f"[DB WARN] No se pudo verificar la creación automática de la base de datos: {e}")

def create_app(config_class=Config):
    """Fábrica de la aplicación Flask."""
    # Asegurar existencia física de la base de datos en el servidor MySQL si no está en modo pruebas ni en nube con DATABASE_URL
    if not getattr(config_class, 'TESTING', False) and not str(getattr(config_class, 'SQLALCHEMY_DATABASE_URI', '')).startswith('sqlite') and not os.getenv('DATABASE_URL'):
        _ensure_database_exists(config_class)

    # Ruta absoluta hacia la carpeta del frontend
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend'))
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(config_class)

    # Configuración de CORS para permitir peticiones desde el frontend web
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Inicialización de extensiones
    db.init_app(app)

    # Registro de Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(scores_bp)

    # Ruta raíz: Sirve la aplicación web directamente
    @app.route('/', methods=['GET'])
    def serve_frontend():
        return app.send_static_file('index.html')

    # Endpoint de estado del sistema (Health check)
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return api_response(
            success=True,
            message="GunRun 2D API Operacional",
            data={
                "status": "online",
                "database": config_class.DB_NAME,
                "version": "1.0.0"
            }
        )

    # Cabeceras de Seguridad HTTP de Producción
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    # Manejo global de errores HTTP estándar
    @app.errorhandler(404)
    def not_found_error(error):
        return api_error("Recurso solicitado no encontrado.", 404)

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return api_error("Método HTTP no permitido para esta ruta.", 405)

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return api_error("Error interno del servidor.", 500)

    # Creación automática de tablas si no existen
    with app.app_context():
        try:
            db.create_all()
            print("[DB INIT] Tablas de SQLAlchemy sincronizadas correctamente.")
        except Exception as e:
            print(f"[DB ERROR] Error al sincronizar tablas con MySQL: {e}")

    return app
