from mongoengine import Document, StringField, DictField, DateTimeField, MapField
import datetime

class AuditLog(Document):
    userId = StringField(required=True)
    action = StringField(required=True, choices=[
        'user_login', 'user_logout', 'user_register', 'task_create', 'task_update', 'task_delete', 'task_start', 'task_complete', 'task_fail',
        'ingest_create', 'ingest_delete', 'ingest_process', 'agent_job_create', 'agent_job_start', 'agent_job_complete', 'agent_job_fail',
        'api_call', 'file_upload', 'multiple_files_upload', 'file_download', 'error_occurred'
    ])
    resourceType = StringField(required=True, choices=['user', 'task', 'ingest', 'agent_job', 'agent_result', 'api', 'file'])
    resourceId = StringField()
    details = DictField(default={})
    ipAddress = StringField()
    userAgent = StringField()
    requestId = StringField()
    sessionId = StringField()
    severity = StringField(choices=['low', 'medium', 'high', 'critical'], default='low')
    status = StringField(choices=['success', 'warning', 'error', 'info'], default='info')
    message = StringField()
    metadata = DictField(default={})
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['userId', '-createdAt']},
            {'fields': ['action', '-createdAt']},
            {'fields': ['resourceType', 'resourceId']},
            {'fields': ['-createdAt']},
            {'fields': ['severity', 'status']}
        ]
    }

    @classmethod
    def log_action(cls, action_data):
        return cls(**action_data).save()

    def add_details(self, key, value):
        self.details[key] = value
        self.save()

    def add_metadata(self, key, value):
        self.metadata[key] = value
        self.save()
