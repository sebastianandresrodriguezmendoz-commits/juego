import re
from flask import Blueprint, request
from ..models import db, User
from ..utils.response import api_response, api_error
from ..utils.jwt_manager import generate_token, token_required
from ..utils.rate_limiter import rate_limit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

@auth_bp.route('/register', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def register():
    """
    Registro de nuevo jugador en la base de datos real.
    Valida campos, unicidad de nombre de usuario/correo y guarda hash de contraseña.
    """
    data = request.get_json(silent=True)
    if not data:
        return api_error("Cuerpo de petición inválido. Se requiere formato JSON.", 400)

    username = str(data.get('username', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    # Validaciones rigurosas
    if not username or len(username) < 3 or len(username) > 30:
        return api_error("El nombre de usuario debe contener entre 3 y 30 caracteres.", 400)

    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return api_error("El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.", 400)

    if not email or not re.match(EMAIL_REGEX, email):
        return api_error("Debe proporcionar una dirección de correo electrónico válida.", 400)

    if not password or len(password) < 6:
        return api_error("La contraseña debe tener un mínimo de 6 caracteres.", 400)

    # Verificación de duplicados en MySQL
    if User.query.filter_by(username=username).first():
        return api_error(f"El nombre de usuario '{username}' ya se encuentra registrado.", 409)

    if User.query.filter_by(email=email).first():
        return api_error(f"El correo '{email}' ya se encuentra registrado.", 409)

    try:
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        # Generar token JWT real tras registro exitoso
        token = generate_token(new_user.id, new_user.username)

        return api_response(
            success=True,
            message="Jugador registrado exitosamente.",
            data={
                "token": token,
                "user": new_user.to_dict()
            },
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return api_error(f"Error interno al registrar usuario en la base de datos: {str(e)}", 500)

@auth_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=15, window_seconds=60)
def login():
    """
    Autenticación de jugador existente.
    Permite iniciar sesión con username o email.
    """
    data = request.get_json(silent=True)
    if not data:
        return api_error("Cuerpo de petición inválido. Se requiere formato JSON.", 400)

    identifier = str(data.get('identifier', '')).strip()
    # Soporte retrocompatible si envían 'username' o 'email' directamente
    if not identifier:
        identifier = str(data.get('username', '') or data.get('email', '')).strip()

    password = str(data.get('password', ''))

    if not identifier or not password:
        return api_error("Debe ingresar su usuario/correo y contraseña.", 400)

    # Búsqueda en MySQL por username o email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return api_error("Credenciales de acceso incorrectas. Verifique usuario y contraseña.", 401)

    token = generate_token(user.id, user.username)

    return api_response(
        success=True,
        message="Inicio de sesión exitoso.",
        data={
            "token": token,
            "user": user.to_dict()
        },
        status_code=200
    )

@auth_bp.route('/profile', methods=['GET'])
@token_required
def profile(current_user):
    """
    Ruta protegida por JWT: retorna los datos del jugador autenticado.
    """
    return api_response(
        success=True,
        data={
            "user": current_user.to_dict()
        },
        status_code=200
    )

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify(current_user):
    """
    Ruta protegida para validar la vigencia de un token almacenado.
    """
    return api_response(
        success=True,
        message="Token de autenticación válido y vigente.",
        data={
            "user": current_user.to_dict()
        },
        status_code=200
    )
