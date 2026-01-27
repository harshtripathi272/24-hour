"""
Authentication Routes

Endpoints:
- POST /auth/signup - Register new user
- POST /auth/login - Login and get tokens
- GET /auth/me - Get current user profile
- POST /auth/logout - Invalidate token
- POST /auth/refresh - Get new access token using refresh token
"""
import re
from flask import Blueprint, request, jsonify, current_app

from ..models.user import User
from ..utils.token import (
    generate_access_token,
    generate_refresh_token,
    verify_refresh_token
)
from ..middleware.auth import jwt_required, get_current_user, get_current_token, add_token_to_blacklist
from .. import limiter


auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password strength.
    Requirements:
    - At least 6 characters
    - At least one letter
    - At least one number
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if not re.search(r'[a-zA-Z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, None


@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("10 per minute")
def signup():
    """
    Register a new user.
    
    Request Body:
        name: str (required)
        email: str (required)
        password: str (required)
        
    Returns:
        201: User created successfully with tokens
        400: Validation error
        409: Email already exists
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'Request body must be JSON'
        }), 400
    
    # Validate required fields
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not name:
        return jsonify({
            'error': 'Validation error',
            'message': 'Name is required'
        }), 400
    
    if len(name) < 2:
        return jsonify({
            'error': 'Validation error',
            'message': 'Name must be at least 2 characters'
        }), 400
    
    if not email:
        return jsonify({
            'error': 'Validation error',
            'message': 'Email is required'
        }), 400
    
    if not validate_email(email):
        return jsonify({
            'error': 'Validation error',
            'message': 'Invalid email format'
        }), 400
    
    if not password:
        return jsonify({
            'error': 'Validation error',
            'message': 'Password is required'
        }), 400
    
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        return jsonify({
            'error': 'Validation error',
            'message': error_msg
        }), 400
    
    # Check if email exists
    if User.email_exists(email):
        return jsonify({
            'error': 'Conflict',
            'message': 'Email already registered'
        }), 409
    
    # Create user
    password_hash = User.hash_password(password)
    user = User(name=name, email=email, password_hash=password_hash)
    user.save()
    
    # Generate tokens
    access_token = generate_access_token(user._id)
    refresh_token = generate_refresh_token(user._id)
    
    current_app.logger.info(f'New user registered: {email}')
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_public_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limit login attempts
def login():
    """
    Login with email and password.
    
    Request Body:
        email: str (required)
        password: str (required)
        
    Returns:
        200: Login successful with tokens
        400: Validation error
        401: Invalid credentials
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'Request body must be JSON'
        }), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({
            'error': 'Validation error',
            'message': 'Email and password are required'
        }), 400
    
    # Find user
    user = User.find_by_email(email)
    
    if not user:
        current_app.logger.warning(f'Login attempt with non-existent email: {email}')
        return jsonify({
            'error': 'Authentication failed',
            'message': 'Invalid email or password'
        }), 401
    
    # Verify password
    if not User.verify_password(password, user.password_hash):
        current_app.logger.warning(f'Failed login attempt for: {email}')
        return jsonify({
            'error': 'Authentication failed',
            'message': 'Invalid email or password'
        }), 401
    
    # Generate tokens
    access_token = generate_access_token(user._id)
    refresh_token = generate_refresh_token(user._id)
    
    current_app.logger.info(f'User logged in: {email}')
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_public_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_profile():
    """
    Get current user's profile.
    
    Headers:
        Authorization: Bearer <access_token>
        
    Returns:
        200: User profile
        401: Not authenticated
    """
    user = get_current_user()
    return jsonify({
        'user': user.to_public_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    """
    Logout and invalidate current token.
    
    Headers:
        Authorization: Bearer <access_token>
        
    Returns:
        200: Logout successful
        401: Not authenticated
    """
    token = get_current_token()
    user = get_current_user()
    
    # Add token to blacklist
    add_token_to_blacklist(token)
    
    current_app.logger.info(f'User logged out: {user.email}')
    
    return jsonify({
        'message': 'Logout successful'
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """
    Get new access token using refresh token.
    
    Request Body:
        refresh_token: str (required)
        
    Returns:
        200: New access token
        400: Validation error
        401: Invalid refresh token
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request',
            'message': 'Request body must be JSON'
        }), 400
    
    refresh_token = data.get('refresh_token', '')
    
    if not refresh_token:
        return jsonify({
            'error': 'Validation error',
            'message': 'Refresh token is required'
        }), 400
    
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    
    if not payload:
        return jsonify({
            'error': 'Authentication failed',
            'message': 'Invalid or expired refresh token'
        }), 401
    
    # Check if user still exists
    user = User.find_by_id(payload['user_id'])
    
    if not user:
        return jsonify({
            'error': 'Authentication failed',
            'message': 'User not found'
        }), 401
    
    # Generate new access token
    access_token = generate_access_token(user._id)
    
    current_app.logger.info(f'Token refreshed for: {user.email}')
    
    return jsonify({
        'access_token': access_token,
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }), 200
