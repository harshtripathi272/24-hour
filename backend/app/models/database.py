"""
MongoDB Database Connection
"""
from pymongo import MongoClient
from flask import current_app, g


def get_db():
    """Get database connection from Flask g object or create new one."""
    if 'db' not in g:
        client = MongoClient(current_app.config['MONGO_URI'])
        g.db = client[current_app.config['MONGO_DB_NAME']]
        g.client = client
    return g.db


def close_db(e=None):
    """Close database connection."""
    client = g.pop('client', None)
    g.pop('db', None)
    if client is not None:
        client.close()


def init_db(app):
    """Initialize database with Flask app."""
    app.teardown_appcontext(close_db)
