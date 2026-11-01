import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, current_app
from ..models import User
from .response import api_error

def generate_token(user_id: int, username: str) -> str:
    """Genera un token JWT firmado criptográficamente con algoritmo HS256."""
    secret = current_app.config['SECRET_KEY']
    exp_hours = current_app.config.get('JWT_EXPIRATION_HOURS', 24)
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'username': username,
        'iat': now,
        'exp': now + timedelta(hours=exp_hours)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def decode_token(token: str) -> dict:
    """Decodifica y valida la firma y expiración de un token JWT."""
    secret = current_app.config['SECRET_KEY']
    return jwt.decode(token, secret, algorithms=['HS256'])

def token_required(f):
    """
    Middleware de autorización:
    Verifica que la petición contenga el encabezado 'Authorization: Bearer <token>'.
    Recupera al usuario real de la base de datos y lo inyecta como 'current_user'.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return api_error("Cabecera de autorización ausente. Debe incluir 'Authorization: Bearer <token>'", 401)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return api_error("Formato de token inválido. Utilice 'Bearer <token>'", 401)

        token = parts[1]
        try:
            payload = decode_token(token)
            user_id = int(payload.get('sub'))
            from ..models import db
            user = db.session.get(User, user_id)
            if not user:
                return api_error("El usuario asociado al token ya no existe.", 401)
        except jwt.ExpiredSignatureError:
            return api_error("El token de sesión ha expirado. Inicie sesión nuevamente.", 401)
        except jwt.InvalidTokenError:
            return api_error("Token de autenticación inválido o corrupto.", 401)
        except Exception as e:
            return api_error(f"Error procesando la autenticación: {str(e)}", 401)

        return f(current_user=user, *args, **kwargs)
    return decorated
