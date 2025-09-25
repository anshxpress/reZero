from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps
from pymongo import MongoClient
from bson.objectid import ObjectId

# Setup
bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/rezero')
client = MongoClient(MONGODB_URI)
db = client.get_default_database()
users = db['users']
audit_logs = db['auditlogs']
JWT_SECRET = os.getenv('JWT_SECRET', 'secret')
JWT_EXPIRES_IN = int(os.getenv('JWT_EXPIRES_IN', 86400))

# JWT Auth Decorator
def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Access token required'}), 401
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = users.find_one({'_id': ObjectId(decoded['userId']), 'isActive': True})
            if not user:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            request.user = user
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 403
        return f(*args, **kwargs)
    return decorated

# Register
@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    if not email or not password or not name:
        return jsonify({'error': 'Missing fields'}), 400
    if users.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 400
    hashed_pw = generate_password_hash(password)
    user = {
        'email': email,
        'password': hashed_pw,
        'name': name,
        'isActive': True,
        'createdAt': datetime.datetime.utcnow(),
        'preferences': {},
        'lastLogin': None
    }
    user_id = users.insert_one(user).inserted_id
    audit_logs.insert_one({
        'userId': user_id,
        'action': 'user_register',
        'resourceType': 'user',
        'resourceId': user_id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    token = jwt.encode({
        'userId': str(user_id),
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRES_IN)
    }, JWT_SECRET, algorithm="HS256")
    user['_id'] = str(user_id)
    del user['password']
    return jsonify({'message': 'User registered successfully', 'user': user, 'token': token}), 201

# Login
@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = users.find_one({'email': email, 'isActive': True})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    users.update_one({'_id': user['_id']}, {'$set': {'lastLogin': datetime.datetime.utcnow()}})
    token = jwt.encode({
        'userId': str(user['_id']),
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRES_IN)
    }, JWT_SECRET, algorithm="HS256")
    audit_logs.insert_one({
        'userId': user['_id'],
        'action': 'user_login',
        'resourceType': 'user',
        'resourceId': user['_id'],
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    user['_id'] = str(user['_id'])
    del user['password']
    return jsonify({'message': 'Login successful', 'token': token, 'user': user})

# Profile
@bp.route('/profile', methods=['GET'])
@authenticate_token
def profile():
    user = request.user
    user['_id'] = str(user['_id'])
    del user['password']
    return jsonify({'user': user})

# Update Profile
@bp.route('/profile', methods=['PUT'])
@authenticate_token
def update_profile():
    data = request.json
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'preferences' in data:
        updates['preferences'] = {**request.user.get('preferences', {}), **data['preferences']}
    users.update_one({'_id': request.user['_id']}, {'$set': updates})
    user = users.find_one({'_id': request.user['_id']})
    user['_id'] = str(user['_id'])
    del user['password']
    audit_logs.insert_one({
        'userId': user['_id'],
        'action': 'user_update',
        'resourceType': 'user',
        'resourceId': user['_id'],
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Profile updated successfully', 'user': user})

# Logout
@bp.route('/logout', methods=['POST'])
@authenticate_token
def logout():
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'user_logout',
        'resourceType': 'user',
        'resourceId': request.user['_id'],
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Logout successful'})
