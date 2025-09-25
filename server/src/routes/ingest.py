from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import os, io, json, datetime
from pymongo import MongoClient
from .auth import authenticate_token

bp = Blueprint('ingest', __name__, url_prefix='/api/v1/ingest')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/rezero')
client = MongoClient(MONGODB_URI)
db = client.get_default_database()
ingests = db['ingests']
audit_logs = db['auditlogs']

ALLOWED_TYPES = ['text/plain', 'application/json', 'text/csv', 'application/pdf']
MAX_SIZE = int(os.getenv('MAX_FILE_SIZE', 10 * 1024 * 1024))

def extract_text_from_file(file, mimetype, filename):
    try:
        if mimetype == 'application/pdf':
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file.read())) as pdf:
                text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
            return {'text': text, 'metadata': {'pages': len(pdf.pages)}}
        elif mimetype in ['text/plain', 'text/csv']:
            return {'text': file.read().decode('utf-8'), 'metadata': {}}
        elif mimetype == 'application/json':
            content = file.read().decode('utf-8')
            parsed = json.loads(content)
            return {'text': json.dumps(parsed, indent=2), 'metadata': {'originalJson': parsed}}
        else:
            return {'text': file.read().decode('utf-8'), 'metadata': {}}
    except Exception as e:
        return {'text': f'[Error extracting text from {filename}: {str(e)}]', 'metadata': {'error': str(e)}}

def process_content(content, type, metadata=None):
    processed_content = content
    extracted_data = {}
    if type == 'text':
        processed_content = content.strip()
        extracted_data['wordCount'] = len(processed_content.split())
        extracted_data['characterCount'] = len(processed_content)
    elif type == 'url':
        from urllib.parse import urlparse
        try:
            url = urlparse(content)
            extracted_data['domain'] = url.hostname
            extracted_data['protocol'] = url.scheme
            extracted_data['path'] = url.path
        except Exception:
            pass
    elif type == 'file':
        extracted_data['fileType'] = metadata.get('mimeType')
        extracted_data['fileSize'] = metadata.get('size')
    elif type == 'multiple_files':
        extracted_data['fileCount'] = metadata.get('fileCount')
        extracted_data['totalSize'] = metadata.get('totalSize')
        extracted_data['fileNames'] = metadata.get('fileNames')
        extracted_data['files'] = metadata.get('files')
    elif type == 'multiple_sources':
        extracted_data['sourceCount'] = metadata.get('sourceCount')
        extracted_data['textCount'] = metadata.get('textCount')
        extracted_data['urlCount'] = metadata.get('urlCount')
        extracted_data['fileCount'] = metadata.get('fileCount')
        extracted_data['sources'] = metadata.get('sources')
        extracted_data['hasText'] = metadata.get('hasText')
        extracted_data['hasUrls'] = metadata.get('hasUrls')
        extracted_data['hasFiles'] = metadata.get('hasFiles')
    return processed_content, extracted_data

@bp.route('/', methods=['POST'])
@authenticate_token
def create_ingest():
    data = request.json
    type = data.get('type')
    content = data.get('content')
    metadata = data.get('metadata', {})
    if not type or not content:
        return jsonify({'error': 'Missing type or content'}), 400
    ingest = {
        'userId': request.user['_id'],
        'type': type,
        'content': content,
        'originalContent': content,
        'metadata': metadata,
        'status': 'processing',
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    ingest_id = ingests.insert_one(ingest).inserted_id
    processed_content, extracted_data = process_content(content, type, metadata)
    ingests.update_one({'_id': ingest_id}, {'$set': {
        'processedContent': processed_content,
        'extractedData': extracted_data,
        'status': 'completed',
        'updatedAt': datetime.datetime.utcnow()
    }})
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'ingest_create',
        'resourceType': 'ingest',
        'resourceId': ingest_id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Content ingested successfully', 'ingestId': str(ingest_id), 'status': 'processing'})

@bp.route('/upload', methods=['POST'])
@authenticate_token
def upload_file():
    files = request.files.getlist('file')
    if not files:
        return jsonify({'error': 'No files uploaded'}), 400
    file_contents = []
    for file in files:
        if file.mimetype not in ALLOWED_TYPES or file.content_length > MAX_SIZE:
            return jsonify({'error': f'File type {file.mimetype} not allowed or file too large'}), 400
        extracted = extract_text_from_file(file, file.mimetype, file.filename)
        file_contents.append({
            'filename': file.filename,
            'content': extracted['text'],
            'metadata': extracted['metadata'],
            'mimeType': file.mimetype,
            'size': file.content_length
        })
    combined_content = '\n'.join([f"=== FILE: {f['filename']} ({f['mimeType']}) ===\n{f['content']}\n" for f in file_contents])
    combined_metadata = {
        'fileCount': len(files),
        'fileNames': [f.filename for f in files],
        'totalSize': sum(f.content_length for f in files),
        'files': [{
            'filename': f['filename'],
            'mimeType': f['mimeType'],
            'size': f['size'],
            'extractedMetadata': f['metadata']
        } for f in file_contents],
        'extractedTexts': [{
            'filename': f['filename'],
            'textLength': len(f['content']),
            'hasContent': len(f['content']) > 0
        } for f in file_contents]
    }
    ingest = {
        'userId': request.user['_id'],
        'type': 'multiple_files' if len(files) > 1 else 'file',
        'content': combined_content,
        'originalContent': combined_content,
        'metadata': combined_metadata,
        'status': 'processing',
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    ingest_id = ingests.insert_one(ingest).inserted_id
    processed_content, extracted_data = process_content(combined_content, ingest['type'], combined_metadata)
    ingests.update_one({'_id': ingest_id}, {'$set': {
        'processedContent': processed_content,
        'extractedData': extracted_data,
        'status': 'completed',
        'updatedAt': datetime.datetime.utcnow()
    }})
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'multiple_files_upload' if len(files) > 1 else 'file_upload',
        'resourceType': 'ingest',
        'resourceId': ingest_id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Files uploaded successfully', 'ingestId': str(ingest_id), 'status': 'processing', 'metadata': combined_metadata})

@bp.route('/<id>', methods=['GET'])
@authenticate_token
def get_ingest(id):
    ingest = ingests.find_one({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not ingest:
        return jsonify({'error': 'Ingest not found'}), 404
    ingest['id'] = str(ingest['_id'])
    del ingest['_id']
    return jsonify({'ingest': ingest})

@bp.route('/', methods=['GET'])
@authenticate_token
def list_ingests():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    filter = {'userId': request.user['_id']}
    status = request.args.get('status')
    type = request.args.get('type')
    if status:
        filter['status'] = status
    if type:
        filter['type'] = type
    cursor = ingests.find(filter).sort('createdAt', -1).skip(skip).limit(limit)
    total = ingests.count_documents(filter)
    ingests_list = []
    for ingest in cursor:
        ingest['id'] = str(ingest['_id'])
        del ingest['_id']
        ingests_list.append(ingest)
    return jsonify({
        'ingests': ingests_list,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': (total + limit - 1) // limit
        }
    })

@bp.route('/<id>', methods=['DELETE'])
@authenticate_token
def delete_ingest(id):
    ingest = ingests.find_one_and_delete({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not ingest:
        return jsonify({'error': 'Ingest not found'}), 404
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'ingest_delete',
        'resourceType': 'ingest',
        'resourceId': id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Ingest deleted successfully'})
