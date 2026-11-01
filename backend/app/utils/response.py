from flask import jsonify

def api_response(success=True, data=None, message=None, status_code=200):
    """
    Estructura estándar de respuesta para toda la API RESTful.
    """
    payload = {"success": success}
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code

def api_error(message, status_code=400, details=None):
    """
    Estructura estándar de error requerida por la arquitectura:
    { "success": false, "error": "Mensaje" }
    """
    payload = {
        "success": False,
        "error": message
    }
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code
