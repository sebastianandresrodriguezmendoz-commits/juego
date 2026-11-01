from datetime import datetime, timezone
from . import db

class Score(db.Model):
    __tablename__ = 'scores'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False, default=0, index=True)
    wave = db.Column(db.Integer, nullable=False, default=1)
    kills = db.Column(db.Integer, nullable=False, default=0)
    survival_time = db.Column(db.Integer, nullable=False, default=0)  # Segundos
    accuracy = db.Column(db.Float, nullable=False, default=0.0)       # Porcentaje (0.0 - 100.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relación con la entidad User
    user = db.relationship('User', backref=db.backref('scores', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self) -> dict:
        """Serializa la entidad Score con información del jugador."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else "Desconocido",
            "score": self.score,
            "wave": self.wave,
            "kills": self.kills,
            "survival_time": self.survival_time,
            "accuracy": round(self.accuracy, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self) -> str:
        return f"<Score id={self.id} user_id={self.user_id} score={self.score} wave={self.wave}>"


class GameStats(db.Model):
    __tablename__ = 'game_stats'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    total_games = db.Column(db.Integer, nullable=False, default=0)
    total_kills = db.Column(db.Integer, nullable=False, default=0)
    highest_score = db.Column(db.Integer, nullable=False, default=0)
    highest_wave = db.Column(db.Integer, nullable=False, default=0)
    total_playtime_seconds = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relación con la entidad User
    user = db.relationship('User', backref=db.backref('stats', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self) -> dict:
        """Serializa las estadísticas acumuladas del jugador."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else "Desconocido",
            "total_games": self.total_games,
            "total_kills": self.total_kills,
            "highest_score": self.highest_score,
            "highest_wave": self.highest_wave,
            "total_playtime_seconds": self.total_playtime_seconds,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self) -> str:
        return f"<GameStats user_id={self.user_id} high_score={self.highest_score}>"


# Catálogo Maestro de Logros y Medallas del Videojuego
ACHIEVEMENTS_CATALOG = {
    "FIRST_BLOOD": {
        "key": "FIRST_BLOOD",
        "title": "Primera Sangre",
        "description": "Elimina a tu primer enemigo en combate.",
        "icon": "bi-droplet-fill",
        "color": "#ff0055"
    },
    "SHARPSHOOTER": {
        "key": "SHARPSHOOTER",
        "title": "Tirador de Élite",
        "description": "Finaliza una partida con al menos 70% de precisión y 10 bajas.",
        "icon": "bi-crosshair",
        "color": "#00ffcc"
    },
    "WAVE_SURVIVOR_5": {
        "key": "WAVE_SURVIVOR_5",
        "title": "Veterano de Guerra",
        "description": "Alcanza o supera la Oleada 5.",
        "icon": "bi-shield-shaded",
        "color": "#39ff14"
    },
    "TITAN_SLAYER": {
        "key": "TITAN_SLAYER",
        "title": "Cazador de Titanes",
        "description": "Supera la Oleada 5 y destruye al Titan Protocol Omega.",
        "icon": "bi-robot",
        "color": "#ffe600"
    },
    "CENTURION": {
        "key": "CENTURION",
        "title": "Centurión del Caos",
        "description": "Acumula 100 o más bajas totales en tu carrera.",
        "icon": "bi-fire",
        "color": "#ff5500"
    },
    "SCORE_MASTER": {
        "key": "SCORE_MASTER",
        "title": "Récord Legendario",
        "description": "Alcanza una puntuación superior a 5,000 puntos en una sola partida.",
        "icon": "bi-trophy-fill",
        "color": "#00ccff"
    }
}


class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    achievement_key = db.Column(db.String(50), nullable=False, index=True)
    unlocked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'achievement_key', name='uq_user_achievement'),
    )

    user = db.relationship('User', backref=db.backref('achievements', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self) -> dict:
        """Serializa el logro desbloqueado con metadatos del catálogo."""
        meta = ACHIEVEMENTS_CATALOG.get(self.achievement_key, {
            "key": self.achievement_key,
            "title": self.achievement_key,
            "description": "Logro completado.",
            "icon": "bi-award-fill",
            "color": "#00ffcc"
        })
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_key": self.achievement_key,
            "title": meta["title"],
            "description": meta["description"],
            "icon": meta["icon"],
            "color": meta["color"],
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None
        }

    def __repr__(self) -> str:
        return f"<UserAchievement user_id={self.user_id} key='{self.achievement_key}'>"
