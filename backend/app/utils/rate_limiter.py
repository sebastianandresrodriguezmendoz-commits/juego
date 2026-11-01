import time
from functools import wraps
from flask import request
from .response import api_error

# Almacén en memoria de peticiones por IP y endpoint: { "ip:endpoint": [timestamp1, timestamp2, ...] }
_request_records = {}

def rate_limit(max_requests: int = 15, window_seconds: int = 60):
    """
    Decorador de Rate Limiting por IP para protección contra ataques de fuerza bruta y DoS.
    :param max_requests: Número máximo de peticiones permitidas en la ventana temporal.
    :param window_seconds: Tamaño de la ventana de tiempo en segundos.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1').split(',')[0].strip()
            key = f"{ip}:{request.endpoint}"
            now = time.time()

            # Obtener timestamps previos y purgar los expirados fuera de la ventana
            timestamps = _request_records.get(key, [])
            valid_timestamps = [t for t in timestamps if now - t < window_seconds]

            if len(valid_timestamps) >= max_requests:
                retry_after = int(window_seconds - (now - valid_timestamps[0])) + 1
                return api_error(
                    f"Demasiadas peticiones. Límite de seguridad excedido. Reintente en {retry_after} segundos.",
                    429
                )

            valid_timestamps.append(now)
            _request_records[key] = valid_timestamps

            return f(*args, **kwargs)
        return decorated_function
    return decorator

