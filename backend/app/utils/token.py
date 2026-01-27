"""
JWT and Playback Token Utilities

This module implements:
1. Access tokens (short-lived, for API authentication)
2. Refresh tokens (long-lived, for getting new access tokens)
3. Playback tokens (signed tokens for secure video streaming)
"""
import jwt
from datetime import datetime, timedelta
from flask import current_app


def generate_access_token(user_id):
    """Generate a short-lived access token for API authentication."""
    payload = {
        'user_id': str(user_id),
        'type': 'access',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(
            seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        )
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def generate_refresh_token(user_id):
    """Generate a long-lived refresh token for getting new access tokens."""
    payload = {
        'user_id': str(user_id),
        'type': 'refresh',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(
            seconds=current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
        )
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def generate_playback_token(video_id):
    """
    Generate a signed playback token for secure video streaming.
    
    This token:
    - Contains the video_id to prevent token reuse across videos
    - Has a short expiry (1 hour by default)
    - Is signed with a separate secret for additional security
    """
    payload = {
        'video_id': str(video_id),
        'type': 'playback',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(
            seconds=current_app.config['PLAYBACK_TOKEN_EXPIRES']
        )
    }
    return jwt.encode(payload, current_app.config['PLAYBACK_TOKEN_SECRET'], algorithm='HS256')


def verify_access_token(token):
    """
    Verify an access token and return the payload.
    
    Returns:
        dict: Token payload with user_id if valid
        None: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        if payload.get('type') != 'access':
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_refresh_token(token):
    """
    Verify a refresh token and return the payload.
    
    Returns:
        dict: Token payload with user_id if valid
        None: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        if payload.get('type') != 'refresh':
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_playback_token(token, video_id):
    """
    Verify a playback token for a specific video.
    
    Args:
        token: The playback token to verify
        video_id: The video ID the token should be valid for
        
    Returns:
        dict: Token payload if valid
        None: If token is invalid, expired, or for wrong video
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['PLAYBACK_TOKEN_SECRET'],
            algorithms=['HS256']
        )
        if payload.get('type') != 'playback':
            return None
        if payload.get('video_id') != str(video_id):
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
