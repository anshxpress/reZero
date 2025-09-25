from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Import and register blueprints here (to be added)

@app.route('/api/v1/health', methods=['GET'])
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)
