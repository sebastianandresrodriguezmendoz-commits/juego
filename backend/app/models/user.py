from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def set_password(self, password: str) -> None:
        """Genera y almacena el hash criptográfico de la contraseña."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifica la contraseña ingresada contra el hash seguro."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Serializa la entidad a formato JSON seguro (excluyendo hash)."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}'>"
