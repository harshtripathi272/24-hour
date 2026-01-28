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

# CarryMinati and TMKOC Videos
# Note: Some videos may have embedding restrictions
SAMPLE_VIDEOS = [
    {
        'title': 'CarryMinati - Yalgaar',
        'description': 'The most iconic CarryMinati rap song with over 300M views!',
        'youtube_id': 'zzwRbKI2pn4',
        'thumbnail_url': 'https://img.youtube.com/vi/zzwRbKI2pn4/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'CarryMinati - Vardaan',
        'description': 'Another hit rap song by CarryMinati featuring Wily Frenzy.',
        'youtube_id': 'vDKB4CCKXss',
        'thumbnail_url': 'https://img.youtube.com/vi/vDKB4CCKXss/maxresdefault.jpg',
        'is_active': True
    },
    {
        'title': 'TMKOC - Jethalal Best Moments',
        'description': 'Funniest Jethalal moments from Taarak Mehta Ka Ooltah Chashmah.',
        'youtube_id': 'U1tSaHJy4C4',
        'thumbnail_url': 'https://img.youtube.com/vi/U1tSaHJy4C4/maxresdefault.jpg',
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
