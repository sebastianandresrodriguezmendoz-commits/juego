from flask import Blueprint, request
from ..models import db, Score, GameStats, UserAchievement, ACHIEVEMENTS_CATALOG
from ..utils.response import api_response, api_error
from ..utils.jwt_manager import token_required
from ..utils.rate_limiter import rate_limit

scores_bp = Blueprint('scores', __name__, url_prefix='/api/scores')

@scores_bp.route('', methods=['POST'])
@token_required
@rate_limit(max_requests=30, window_seconds=60)
def save_score(current_user):
    """
    Registra el resultado de una partida finalizada y actualiza las estadísticas
    acumuladas del jugador en la base de datos real.
    Ruta protegida por JWT.
    """
    data = request.get_json(silent=True)
    if not data:
        return api_error("Cuerpo de petición inválido. Se requiere formato JSON.", 400)

    try:
        score_val = int(data.get('score', 0))
        wave_val = int(data.get('wave', 1))
        kills_val = int(data.get('kills', 0))
        survival_val = int(data.get('survival_time', 0))
        accuracy_val = float(data.get('accuracy', 0.0))
    except (ValueError, TypeError):
        return api_error("Los campos numéricos ('score', 'wave', 'kills', 'survival_time', 'accuracy') son inválidos.", 400)

    # Validaciones de integridad de negocio
    if score_val < 0:
        return api_error("La puntuación no puede ser negativa.", 400)
    if wave_val < 1:
        return api_error("El número de oleada debe ser al menos 1.", 400)
    if kills_val < 0:
        return api_error("El conteo de bajas no puede ser negativo.", 400)
    if survival_val < 0:
        return api_error("El tiempo de supervivencia no puede ser negativo.", 400)
    if accuracy_val < 0.0 or accuracy_val > 100.0:
        return api_error("La precisión debe ser un porcentaje válido entre 0.0 y 100.0.", 400)

    try:
        # 1. Crear nuevo registro individual de partida
        new_score = Score(
            user_id=current_user.id,
            score=score_val,
            wave=wave_val,
            kills=kills_val,
            survival_time=survival_val,
            accuracy=accuracy_val
        )
        db.session.add(new_score)

        # 2. Recuperar o inicializar las estadísticas acumuladas del jugador
        stats = GameStats.query.filter_by(user_id=current_user.id).first()
        if not stats:
            stats = GameStats(
                user_id=current_user.id,
                total_games=1,
                total_kills=kills_val,
                highest_score=score_val,
                highest_wave=wave_val,
                total_playtime_seconds=survival_val
            )
            db.session.add(stats)
        else:
            stats.total_games += 1
            stats.total_kills += kills_val
            stats.total_playtime_seconds += survival_val
            if score_val > stats.highest_score:
                stats.highest_score = score_val
            if wave_val > stats.highest_wave:
                stats.highest_wave = wave_val

        # 3. Comprobación y desbloqueo de Logros (Achievements)
        unlocked_keys = {
            ua.achievement_key for ua in UserAchievement.query.filter_by(user_id=current_user.id).all()
        }
        newly_unlocked = []

        # Criterios de evaluación
        candidates = []
        if kills_val > 0:
            candidates.append("FIRST_BLOOD")
        if accuracy_val >= 70.0 and kills_val >= 10:
            candidates.append("SHARPSHOOTER")
        if wave_val >= 5:
            candidates.append("WAVE_SURVIVOR_5")
        if wave_val > 5:
            candidates.append("TITAN_SLAYER")
        if stats.total_kills >= 100:
            candidates.append("CENTURION")
        if score_val >= 5000:
            candidates.append("SCORE_MASTER")

        for key in candidates:
            if key not in unlocked_keys and key in ACHIEVEMENTS_CATALOG:
                ua = UserAchievement(user_id=current_user.id, achievement_key=key)
                db.session.add(ua)
                newly_unlocked.append(ua)

        db.session.commit()

        return api_response(
            success=True,
            message="Resultado de partida guardado y estadísticas sincronizadas.",
            data={
                "score": new_score.to_dict(),
                "stats": stats.to_dict(),
                "new_achievements": [ua.to_dict() for ua in newly_unlocked]
            },
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return api_error(f"Error interno al guardar la partida en MySQL: {str(e)}", 500)

@scores_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """
    Retorna el Top 10 global de mejores puntuaciones registradas en el sistema.
    Público para consulta rápida en tiempo real.
    """
    try:
        top_scores = (
            Score.query
            .order_by(Score.score.desc(), Score.wave.desc(), Score.survival_time.desc())
            .limit(10)
            .all()
        )

        leaderboard = []
        for index, item in enumerate(top_scores, start=1):
            score_data = item.to_dict()
            score_data['rank'] = index
            leaderboard.append(score_data)

        return api_response(
            success=True,
            data={
                "count": len(leaderboard),
                "leaderboard": leaderboard
            },
            status_code=200
        )
    except Exception as e:
        return api_error(f"Error al consultar el ranking global: {str(e)}", 500)

@scores_bp.route('/my-stats', methods=['GET'])
@token_required
def get_my_stats(current_user):
    """
    Retorna las estadísticas históricas consolidadas del jugador autenticado.
    """
    try:
        stats = GameStats.query.filter_by(user_id=current_user.id).first()
        if not stats:
            return api_response(
                success=True,
                data={
                    "stats": {
                        "user_id": current_user.id,
                        "username": current_user.username,
                        "total_games": 0,
                        "total_kills": 0,
                        "highest_score": 0,
                        "highest_wave": 0,
                        "total_playtime_seconds": 0
                    }
                },
                status_code=200
            )

        return api_response(
            success=True,
            data={
                "stats": stats.to_dict()
            },
            status_code=200
        )
    except Exception as e:
        return api_error(f"Error al obtener estadísticas del jugador: {str(e)}", 500)

@scores_bp.route('/my-history', methods=['GET'])
@token_required
def get_my_history(current_user):
    """
    Retorna el historial de las últimas 20 partidas del jugador autenticado.
    """
    try:
        history = (
            Score.query
            .filter_by(user_id=current_user.id)
            .order_by(Score.created_at.desc())
            .limit(20)
            .all()
        )

        return api_response(
            success=True,
            data={
                "count": len(history),
                "history": [item.to_dict() for item in history]
            },
            status_code=200
        )
    except Exception as e:
        return api_error(f"Error al obtener historial de partidas: {str(e)}", 500)

@scores_bp.route('/achievements', methods=['GET'])
@token_required
def get_achievements(current_user):
    """
    Retorna el estado de todos los logros del catálogo para el jugador:
    desbloqueados (con fecha) y bloqueados (pendientes).
    """
    try:
        unlocked = {
            ua.achievement_key: ua.unlocked_at
            for ua in UserAchievement.query.filter_by(user_id=current_user.id).all()
        }

        achievements_list = []
        for key, meta in ACHIEVEMENTS_CATALOG.items():
            is_unlocked = key in unlocked
            achievements_list.append({
                "key": key,
                "title": meta["title"],
                "description": meta["description"],
                "icon": meta["icon"],
                "color": meta["color"],
                "unlocked": is_unlocked,
                "unlocked_at": unlocked[key].isoformat() if is_unlocked and unlocked[key] else None
            })

        return api_response(
            success=True,
            data={
                "unlocked_count": len(unlocked),
                "total_count": len(ACHIEVEMENTS_CATALOG),
                "achievements": achievements_list
            },
            status_code=200
        )
    except Exception as e:
        return api_error(f"Error al obtener logros del jugador: {str(e)}", 500)
