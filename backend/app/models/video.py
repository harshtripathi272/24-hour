"""
Video Model
"""
from datetime import datetime
from bson import ObjectId

from .database import get_db


class Video:
    """Video model for storing video metadata."""
    
    COLLECTION = 'videos'
    
    def __init__(self, title, description, youtube_id, thumbnail_url,
                 is_active=True, _id=None, created_at=None):
        self._id = _id or ObjectId()
        self.title = title
        self.description = description
        self.youtube_id = youtube_id
        self.thumbnail_url = thumbnail_url
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self):
        """Convert video to dictionary for database storage."""
        return {
            '_id': self._id,
            'title': self.title,
            'description': self.description,
            'youtube_id': self.youtube_id,
            'thumbnail_url': self.thumbnail_url,
            'is_active': self.is_active,
            'created_at': self.created_at
        }
    
    def to_public_dict(self):
        """Convert video to public dictionary (no youtube_id exposed)."""
        return {
            'id': str(self._id),
            'title': self.title,
            'description': self.description,
            'thumbnail_url': self.thumbnail_url,
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create Video from dictionary."""
        return cls(
            title=data['title'],
            description=data['description'],
            youtube_id=data['youtube_id'],
            thumbnail_url=data['thumbnail_url'],
            is_active=data.get('is_active', True),
            _id=data.get('_id'),
            created_at=data.get('created_at')
        )
    
    def save(self):
        """Save video to database."""
        db = get_db()
        result = db[self.COLLECTION].insert_one(self.to_dict())
        self._id = result.inserted_id
        return self
    
    @classmethod
    def find_by_id(cls, video_id):
        """Find video by ID."""
        db = get_db()
        try:
            data = db[cls.COLLECTION].find_one({'_id': ObjectId(video_id)})
            if data:
                return cls.from_dict(data)
        except Exception:
            pass
        return None
    
    @classmethod
    def get_active_videos(cls, limit=2):
        """Get active videos for dashboard."""
        db = get_db()
        cursor = db[cls.COLLECTION].find(
            {'is_active': True}
        ).sort('created_at', -1).limit(limit)
        
        return [cls.from_dict(doc) for doc in cursor]
    
    @classmethod
    def get_all(cls):
        """Get all videos."""
        db = get_db()
        cursor = db[cls.COLLECTION].find()
        return [cls.from_dict(doc) for doc in cursor]
