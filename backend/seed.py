"""
Database Seeder

Seeds the database with sample videos for testing.
Run with: python seed.py
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient

# Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'video_app')


# Sample videos - popular tech talks
SAMPLE_VIDEOS = [
    {
        'title': 'How Great Leaders Inspire Action',
        'description': 'Simon Sinek presents a simple but powerful model for how leaders inspire action, starting with a golden circle and the question "Why?"',
        'youtube_id': 'qp0HIF3SfI4',
        'thumbnail_url': 'https://img.youtube.com/vi/qp0HIF3SfI4/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'The Power of Vulnerability',
        'description': 'Brené Brown studies human connection -- our ability to empathize, belong, love. In this talk, she shares insights from her research.',
        'youtube_id': 'iCvmsMzlF7o',
        'thumbnail_url': 'https://img.youtube.com/vi/iCvmsMzlF7o/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'Inside the Mind of a Master Procrastinator',
        'description': 'Tim Urban knows that procrastination doesn\'t make sense, but he\'s never been able to shake his habit of waiting until the last minute.',
        'youtube_id': 'arj7oStGLkU',
        'thumbnail_url': 'https://img.youtube.com/vi/arj7oStGLkU/maxresdefault.jpg',
        'is_active': True
    }
]


def seed_database():
    """Seed the database with sample videos."""
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    
    # Clear existing videos
    db.videos.delete_many({})
    print("Cleared existing videos")
    
    # Insert sample videos
    from datetime import datetime
    for video in SAMPLE_VIDEOS:
        video['created_at'] = datetime.utcnow()
    
    result = db.videos.insert_many(SAMPLE_VIDEOS)
    print(f"Inserted {len(result.inserted_ids)} videos")
    
    # Verify
    count = db.videos.count_documents({})
    print(f"Total videos in database: {count}")
    
    # Create indexes
    db.users.create_index('email', unique=True)
    db.videos.create_index('is_active')
    db.watch_history.create_index([('user_id', 1), ('video_id', 1)])
    print("Created database indexes")
    
    client.close()
    print("Database seeded successfully!")


if __name__ == '__main__':
    seed_database()
