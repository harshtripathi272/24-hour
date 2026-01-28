"""
Video Routes

Endpoints:
- GET /dashboard - Get videos for dashboard (2 videos)
- GET /video/<id>/stream - Get secure streaming URL
- POST /video/<id>/track - Track video watch event (bonus)
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

from ..models.video import Video
from ..models.database import get_db
from ..utils.token import generate_playback_token, verify_playback_token
from ..middleware.auth import jwt_required, get_current_user


video_bp = Blueprint('video', __name__)


@video_bp.route('/dashboard', methods=['GET'])
@jwt_required
def get_dashboard():
    """
    Get videos for dashboard.
    
    Returns exactly 2 active videos with playback tokens.
    YouTube URLs are NOT exposed - only signed playback tokens.
    
    Headers:
        Authorization: Bearer <access_token>
        
    Returns:
        200: List of videos with playback tokens
        401: Not authenticated
    """
    # Get 2 active videos
    videos = Video.get_active_videos(limit=2)
    
    # Build response with playback tokens
    video_list = []
    for video in videos:
        video_data = video.to_public_dict()
        # Generate signed playback token for each video
        video_data['playback_token'] = generate_playback_token(video._id)
        video_list.append(video_data)
    
    current_app.logger.debug(f'Dashboard accessed by user: {get_current_user().email}')
    
    return jsonify({
        'videos': video_list,
        'count': len(video_list)
    }), 200


@video_bp.route('/video/<video_id>/stream', methods=['GET'])
@jwt_required
def get_stream(video_id):
    """
    Get secure streaming URL for a video.
    
    Requires a valid playback token that matches the video ID.
    Returns a YouTube embed URL (not direct watch URL).
    
    Headers:
        Authorization: Bearer <access_token>
        
    Query Parameters:
        token: str - The playback token (required)
        
    Returns:
        200: Streaming URL with expiry
        400: Missing or invalid token
        401: Not authenticated
        404: Video not found
    """
    # Get playback token from query params
    playback_token = request.args.get('token')
    
    if not playback_token:
        return jsonify({
            'error': 'Missing token',
            'message': 'Playback token is required'
        }), 400
    
    # Verify playback token
    token_payload = verify_playback_token(playback_token, video_id)
    
    if not token_payload:
        return jsonify({
            'error': 'Invalid token',
            'message': 'Playback token is invalid or expired'
        }), 400
    
    # Get video
    video = Video.find_by_id(video_id)
    
    if not video:
        return jsonify({
            'error': 'Not found',
            'message': 'Video not found'
        }), 404
    
    if not video.is_active:
        return jsonify({
            'error': 'Not available',
            'message': 'Video is not available'
        }), 404
    
    # Generate embed URL (NOT raw YouTube URL)
    # Using standard embed with parameters that enable playback on mobile
    embed_url = f"https://www.youtube.com/embed/{video.youtube_id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
    
    current_app.logger.info(f'Stream accessed: video={video_id}, user={get_current_user().email}')
    
    return jsonify({
        'stream_url': embed_url,
        'video_id': video_id,
        'title': video.title,
        'expires_at': token_payload['exp']
    }), 200


@video_bp.route('/video/<video_id>/track', methods=['POST'])
@jwt_required
def track_watch(video_id):
    """
    Track video watch event (Bonus feature).
    
    Records when a user watches a video for analytics.
    
    Headers:
        Authorization: Bearer <access_token>
        
    Request Body:
        duration: int - Watch duration in seconds (optional)
        completed: bool - Whether video was completed (optional)
        
    Returns:
        200: Watch event recorded
        401: Not authenticated
        404: Video not found
    """
    data = request.get_json() or {}
    
    # Get video
    video = Video.find_by_id(video_id)
    
    if not video:
        return jsonify({
            'error': 'Not found',
            'message': 'Video not found'
        }), 404
    
    user = get_current_user()
    
    # Create watch record
    watch_record = {
        'user_id': str(user._id),
        'video_id': video_id,
        'duration': data.get('duration', 0),
        'completed': data.get('completed', False),
        'watched_at': datetime.utcnow()
    }
    
    # Save to database
    db = get_db()
    db['watch_history'].insert_one(watch_record)
    
    current_app.logger.info(f'Watch tracked: video={video_id}, user={user.email}, duration={data.get("duration", 0)}s')
    
    return jsonify({
        'message': 'Watch event recorded',
        'video_id': video_id
    }), 200
