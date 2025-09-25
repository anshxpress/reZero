from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import logging
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.wsgi_app = ProxyFix(app.wsgi_app)

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("re-zero")

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/rezero')
client = MongoClient(MONGODB_URI)
db = client.get_default_database()

# Security headers (Helmet equivalent)
@app.after_request
def set_security_headers(response):
    response.headers['Content-Security-Policy'] = \
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:"
    return response

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'uptime': os.times().elapsed,
        'environment': os.getenv('FLASK_ENV', 'production'),
        'version': '1.0.0'
    })

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Re-Zero AI Framework API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'auth': '/api/v1/auth',
            'ingest': '/api/v1/ingest',
            'tasks': '/api/v1/tasks'
        }
    })

# 404 handler
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Endpoint not found',
        'message': f"Cannot {request.method} {request.path}"
    }), 404

# Global error handler
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    is_development = os.getenv('FLASK_ENV', 'production') == 'development'
    return jsonify({
        'error': str(e) if is_development else 'Internal server error',
        'stack': str(e) if is_development else None
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
