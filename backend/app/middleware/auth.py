"""
Authentication Middleware

Provides JWT authentication decorator for protected routes.
"""
from functools import wraps
from flask import request, jsonify, g

from ..utils.token import verify_access_token
from ..models.user import User
from ..models.database import get_db


# Token blacklist (in production, use Redis or database)
token_blacklist = set()


def add_token_to_blacklist(token):
    """Add a token to the blacklist (for logout)."""
    token_blacklist.add(token)


def is_token_blacklisted(token):
    """Check if a token has been blacklisted."""
    return token in token_blacklist


def jwt_required(f):
    """
    Decorator to protect routes with JWT authentication.
    
    Usage:
        @app.route('/protected')
        @jwt_required
        def protected_route():
            user = get_current_user()
            return jsonify({'message': f'Hello {user.name}'})
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'error': 'Authorization header is missing',
                'message': 'Please provide a valid access token'
            }), 401
        
        parts = auth_header.split()
        
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({
                'error': 'Invalid authorization header format',
                'message': 'Use format: Bearer <token>'
            }), 401
        
        token = parts[1]
        
        # Check if token is blacklisted
        if is_token_blacklisted(token):
            return jsonify({
                'error': 'Token has been invalidated',
                'message': 'Please login again'
            }), 401
        
        # Verify token
        payload = verify_access_token(token)
        
        if not payload:
            return jsonify({
                'error': 'Invalid or expired token',
                'message': 'Please login again'
            }), 401
        
        # Get user from database
        user = User.find_by_id(payload['user_id'])
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'The user associated with this token no longer exists'
            }), 401
        
        # Store user and token in Flask g object for access in route
        g.current_user = user
        g.current_token = token
        
        return f(*args, **kwargs)
    
    return decorated


def get_current_user():
    """
    Get the current authenticated user.
    
    Must be called from within a route decorated with @jwt_required.
    
    Returns:
        User: The current authenticated user
    """
    return g.get('current_user')


def get_current_token():
    """
    Get the current access token.
    
    Must be called from within a route decorated with @jwt_required.
    
    Returns:
        str: The current access token
    """
    return g.get('current_token')
