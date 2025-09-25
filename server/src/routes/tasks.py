from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
import datetime, os
from pymongo import MongoClient
from .auth import authenticate_token

bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/rezero')
client = MongoClient(MONGODB_URI)
db = client.get_default_database()
tasks = db['tasks']
ingests = db['ingests']
agent_jobs = db['agentjobs']
agent_results = db['agentresults']
audit_logs = db['auditlogs']

# Create new task
@bp.route('/', methods=['POST'])
@authenticate_token
def create_task():
    data = request.json
    ingest_id = data.get('ingestId')
    name = data.get('name')
    selected_agents = data.get('selectedAgents')
    description = data.get('description')
    parameters = data.get('parameters', {})
    priority = data.get('priority', 'medium')
    if not ingest_id or not name or not selected_agents:
        return jsonify({'error': 'Missing required fields'}), 400
    ingest = ingests.find_one({'_id': ObjectId(ingest_id), 'userId': request.user['_id'], 'status': 'completed'})
    if not ingest:
        return jsonify({'error': 'Ingest not found or not ready for processing'}), 404
    task = {
        'userId': request.user['_id'],
        'ingestId': ObjectId(ingest_id),
        'name': name,
        'description': description,
        'selectedAgents': selected_agents,
        'parameters': parameters,
        'priority': priority,
        'status': 'pending',
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    task_id = tasks.insert_one(task).inserted_id
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'task_create',
        'resourceType': 'task',
        'resourceId': task_id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'details': {'ingestId': ingest_id, 'selectedAgents': selected_agents, 'priority': priority},
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Task created successfully', 'taskId': str(task_id), 'status': 'pending'})

# Get task by ID
@bp.route('/<id>', methods=['GET'])
@authenticate_token
def get_task(id):
    task = tasks.find_one({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    ingest = ingests.find_one({'_id': task['ingestId']})
    jobs = list(agent_jobs.find({'taskId': ObjectId(id)}))
    results = list(agent_results.find({'taskId': ObjectId(id)}))
    task['id'] = str(task['_id'])
    del task['_id']
    return jsonify({
        'task': task,
        'ingest': ingest,
        'agentJobs': jobs,
        'agentResults': results
    })

# List user's tasks
@bp.route('/', methods=['GET'])
@authenticate_token
def list_tasks():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    status = request.args.get('status')
    priority = request.args.get('priority')
    agent_type = request.args.get('agentType')
    sort_by = request.args.get('sortBy', 'createdAt')
    sort_order = -1 if request.args.get('sortOrder', 'desc') == 'desc' else 1
    filter = {'userId': request.user['_id']}
    if status:
        filter['status'] = status
    if priority:
        filter['priority'] = priority
    if agent_type:
        filter['selectedAgents'] = agent_type
    cursor = tasks.find(filter).sort(sort_by, sort_order).skip(skip).limit(limit)
    total = tasks.count_documents(filter)
    tasks_list = []
    for task in cursor:
        task['id'] = str(task['_id'])
        del task['_id']
        tasks_list.append(task)
    return jsonify({
        'tasks': tasks_list,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'pages': (total + limit - 1) // limit
        }
    })

# Update task
@bp.route('/<id>', methods=['PUT'])
@authenticate_token
def update_task(id):
    data = request.json
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'description' in data:
        updates['description'] = data['description']
    if 'priority' in data:
        updates['priority'] = data['priority']
    task = tasks.find_one({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task['status'] != 'pending':
        return jsonify({'error': 'Can only update pending tasks'}), 400
    tasks.update_one({'_id': ObjectId(id)}, {'$set': updates})
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'task_update',
        'resourceType': 'task',
        'resourceId': id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'details': updates,
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Task updated successfully'})

# Cancel task
@bp.route('/<id>/cancel', methods=['POST'])
@authenticate_token
def cancel_task(id):
    task = tasks.find_one({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task['status'] not in ['pending', 'running']:
        return jsonify({'error': 'Can only cancel pending or running tasks'}), 400
    tasks.update_one({'_id': ObjectId(id)}, {'$set': {'status': 'cancelled', 'completedAt': datetime.datetime.utcnow()}})
    agent_jobs.update_many({'taskId': ObjectId(id), 'status': {'$in': ['queued', 'running']}}, {'$set': {'status': 'cancelled', 'completedAt': datetime.datetime.utcnow()}})
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'task_cancel',
        'resourceType': 'task',
        'resourceId': id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Task cancelled successfully'})

# Delete task
@bp.route('/<id>', methods=['DELETE'])
@authenticate_token
def delete_task(id):
    task = tasks.find_one({'_id': ObjectId(id), 'userId': request.user['_id']})
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    agent_jobs.delete_many({'taskId': ObjectId(id)})
    agent_results.delete_many({'taskId': ObjectId(id)})
    tasks.delete_one({'_id': ObjectId(id)})
    audit_logs.insert_one({
        'userId': request.user['_id'],
        'action': 'task_delete',
        'resourceType': 'task',
        'resourceId': id,
        'ipAddress': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
        'status': 'success',
        'timestamp': datetime.datetime.utcnow()
    })
    return jsonify({'message': 'Task deleted successfully'})

# Get available agents (stub)
@bp.route('/agents/available', methods=['GET'])
@authenticate_token
def available_agents():
    # This should be replaced with real agent discovery logic
    agents = [
        {'type': 'data_extraction', 'capabilities': {'agentType': 'Data Extraction Agent', 'inputTypes': ['text', 'json', 'csv']}},
        {'type': 'financial_analysis', 'capabilities': {'agentType': 'Financial Analysis Agent', 'inputTypes': ['text', 'json', 'csv']}},
        {'type': 'news_summarization', 'capabilities': {'agentType': 'News Summarization Agent', 'inputTypes': ['text', 'json', 'csv']}}
    ]
    return jsonify({'agents': agents})
