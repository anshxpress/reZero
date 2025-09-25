from mongoengine import Document, StringField, ReferenceField, DictField, ListField, DateTimeField, IntField, FloatField, BooleanField, EmbeddedDocument, EmbeddedDocumentField
import datetime

class LogEntry(EmbeddedDocument):
    level = StringField(choices=['debug', 'info', 'warn', 'error'], default='info')
    message = StringField()
    timestamp = DateTimeField(default=datetime.datetime.utcnow)
    data = DictField(default={})

class ErrorInfo(EmbeddedDocument):
    message = StringField()
    stack = StringField()
    timestamp = DateTimeField()
    retryable = BooleanField(default=True)

class AgentJob(Document):
    taskId = StringField(required=True)  # ReferenceField('Task') can be used if Task is defined
    agentType = StringField(required=True, choices=['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender'])
    status = StringField(choices=['queued', 'running', 'completed', 'failed', 'cancelled'], default='queued')
    input = DictField(required=True)
    output = DictField(default={})
    parameters = DictField(default={})
    priority = IntField(default=0)
    retryCount = IntField(default=0)
    maxRetries = IntField(default=3)
    startedAt = DateTimeField()
    completedAt = DateTimeField()
    estimatedDuration = IntField(default=60000)  # ms
    actualDuration = IntField()
    error = EmbeddedDocumentField(ErrorInfo)
    metadata = DictField(default={})
    logs = ListField(EmbeddedDocumentField(LogEntry))
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['taskId', 'agentType']},
            {'fields': ['status', '-priority', 'createdAt']},
            {'fields': ['-createdAt']}
        ]
    }

    @property
    def duration(self):
        if self.startedAt and self.completedAt:
            return (self.completedAt - self.startedAt).total_seconds() * 1000
        return None

    def start(self):
        self.status = 'running'
        self.startedAt = datetime.datetime.utcnow()
        self.save()

    def complete(self, output, metadata=None):
        self.status = 'completed'
        self.completedAt = datetime.datetime.utcnow()
        self.actualDuration = self.duration
        self.output = output
        self.metadata = metadata or {}
        self.save()

    def fail(self, error, retryable=True):
        self.status = 'failed'
        self.completedAt = datetime.datetime.utcnow()
        self.actualDuration = self.duration
        self.error = ErrorInfo(
            message=getattr(error, 'message', str(error)),
            stack=getattr(error, 'stack', ''),
            timestamp=datetime.datetime.utcnow(),
            retryable=retryable
        )
        self.save()

    def add_log(self, level, message, data=None):
        entry = LogEntry(level=level, message=message, timestamp=datetime.datetime.utcnow(), data=data or {})
        self.logs.append(entry)
        self.save()

    def retry(self):
        if self.retryCount < self.maxRetries and (self.error is None or self.error.retryable):
            self.retryCount += 1
            self.status = 'queued'
            self.error = None
            self.startedAt = None
            self.completedAt = None
            self.save()
        else:
            raise Exception('Job cannot be retried')

    def update_status(self, status):
        self.status = status
        if status == 'running' and not self.startedAt:
            self.startedAt = datetime.datetime.utcnow()
        elif status in ['completed', 'failed']:
            self.completedAt = datetime.datetime.utcnow()
        self.save()
