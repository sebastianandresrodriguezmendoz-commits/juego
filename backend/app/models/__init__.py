from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .score import Score, GameStats, UserAchievement, ACHIEVEMENTS_CATALOG

__all__ = ["db", "User", "Score", "GameStats", "UserAchievement", "ACHIEVEMENTS_CATALOG"]
