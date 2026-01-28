"""
Database Seeder - Verified Embeddable Videos

Seeds the database with sample videos that are confirmed to work with embedding.
These are official creative commons or open source content.
Run with: python seed.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
from datetime import datetime, timezone

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'video_app')

# Videos that are GUARANTEED to allow embedding
# These are open source / Creative Commons videos
SAMPLE_VIDEOS = [
    {
        'title': 'Big Buck Bunny',
        'description': 'A famous open-source animated short film by Blender Foundation.',
        'youtube_id': 'aqz-KE-bpKQ',
        'thumbnail_url': 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'Sintel - Open Movie',
        'description': 'Award-winning fantasy short film by Blender Foundation.',
        'youtube_id': 'eRsGyueVLvQ',
        'thumbnail_url': 'https://img.youtube.com/vi/eRsGyueVLvQ/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'Tears of Steel',
        'description': 'Sci-fi short film combining live action with CGI by Blender Foundation.',
        'youtube_id': 'R6MlUcmOul8',
        'thumbnail_url': 'https://img.youtube.com/vi/R6MlUcmOul8/maxresdefault.jpg',
        'is_active': True
    }
]


def seed_database():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    
    db.videos.delete_many({})
    print("Cleared existing videos")
    
    for video in SAMPLE_VIDEOS:
        video['created_at'] = datetime.now(timezone.utc)
    
    result = db.videos.insert_many(SAMPLE_VIDEOS)
    print(f"Inserted {len(result.inserted_ids)} videos")
    
    count = db.videos.count_documents({})
    print(f"Total videos in database: {count}")
    
    db.users.create_index('email', unique=True)
    db.videos.create_index('is_active')
    db.watch_history.create_index([('user_id', 1), ('video_id', 1)])
    print("Created database indexes")
    
    client.close()
    print("Database seeded successfully!")


if __name__ == '__main__':
    seed_database()
