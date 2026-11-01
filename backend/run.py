import os
import sys

# Agregar la ruta raíz del backend al path de Python
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from config import Config

app = create_app(Config)

if __name__ == '__main__':
    is_prod = '--prod' in sys.argv or os.getenv('FLASK_ENV', '').lower() == 'production'

    host = os.getenv('HOST', '0.0.0.0' if is_prod else '127.0.0.1')

    print(f"==================================================")
    print(f"  GunRun 2D - Servidor de Producción / API")
    print(f"  Host: {host} | Puerto: {Config.PORT}")
    print(f"  Modo: {'PRODUCCIÓN (Waitress WSGI)' if is_prod else 'DESARROLLO (Flask Debug)'}")
    print(f"  Base de datos: MySQL ({Config.DB_NAME})")
    print(f"==================================================")

    if is_prod:
        from waitress import serve
        print(f"[PROD] Iniciando servidor WSGI Waitress con 6 hilos concurrentes en {host}:{Config.PORT}...")
        serve(app, host=host, port=Config.PORT, threads=6)
    else:
        app.run(host=host, port=Config.PORT, debug=Config.DEBUG)
