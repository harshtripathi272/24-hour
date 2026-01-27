"""
User Model
"""
from datetime import datetime
from bson import ObjectId
import bcrypt

from .database import get_db


class User:
    """User model for authentication and profile management."""
    
    COLLECTION = 'users'
    
    def __init__(self, name, email, password_hash, _id=None, created_at=None):
        self._id = _id or ObjectId()
        self.name = name
        self.email = email.lower()
        self.password_hash = password_hash
        self.created_at = created_at or datetime.utcnow()
    
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password, password_hash):
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            '_id': self._id,
            'name': self.name,
            'email': self.email,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }
    
    def to_public_dict(self):
        """Convert user to public dictionary (no sensitive data)."""
        return {
            'id': str(self._id),
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create User from dictionary."""
        return cls(
            name=data['name'],
            email=data['email'],
            password_hash=data['password_hash'],
            _id=data.get('_id'),
            created_at=data.get('created_at')
        )
    
    def save(self):
        """Save user to database."""
        db = get_db()
        result = db[self.COLLECTION].insert_one(self.to_dict())
        self._id = result.inserted_id
        return self
    
    @classmethod
    def find_by_email(cls, email):
        """Find user by email."""
        db = get_db()
        data = db[cls.COLLECTION].find_one({'email': email.lower()})
        if data:
            return cls.from_dict(data)
        return None
    
    @classmethod
    def find_by_id(cls, user_id):
        """Find user by ID."""
        db = get_db()
        try:
            data = db[cls.COLLECTION].find_one({'_id': ObjectId(user_id)})
            if data:
                return cls.from_dict(data)
        except Exception:
            pass
        return None
    
    @classmethod
    def email_exists(cls, email):
        """Check if email already exists."""
        db = get_db()
        return db[cls.COLLECTION].find_one({'email': email.lower()}) is not None
