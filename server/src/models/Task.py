from mongoengine import Document, StringField, ReferenceField, ListField, MapField, DateTimeField, IntField, FloatField, EmbeddedDocument, EmbeddedDocumentField
from mongoengine.fields import EmbeddedDocumentListField
import datetime

class ErrorInfo(EmbeddedDocument):
    message = StringField()
    stack = StringField()
    timestamp = DateTimeField()

class Task(Document):
    userId = StringField(required=True)
    ingestId = StringField(required=True)
    name = StringField(required=True)
    description = StringField()
    status = StringField(choices=['pending', 'running', 'completed', 'failed', 'cancelled'], default='pending')
    selectedAgents = ListField(StringField(choices=['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender']))
    parameters = MapField(field=StringField())
    priority = StringField(choices=['low', 'medium', 'high'], default='medium')
    progress = IntField(min_value=0, max_value=100, default=0)
    startedAt = DateTimeField()
    completedAt = DateTimeField()
    estimatedDuration = IntField(default=300000)  # ms
    actualDuration = IntField()
    error = EmbeddedDocumentField(ErrorInfo)
    metadata = MapField(field=StringField())
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['userId', '-createdAt']},
            {'fields': ['status']},
            {'fields': ['-createdAt']}
        ]
    }

    @property
    def duration(self):
        if self.startedAt and self.completedAt:
            return (self.completedAt - self.startedAt).total_seconds() * 1000
        return None

    def update_progress(self, progress):
        self.progress = min(100, max(0, progress))
        if progress == 100 and self.status == 'running':
            self.status = 'completed'
            self.completedAt = datetime.datetime.utcnow()
            self.actualDuration = self.duration
        self.save()

    def start(self):
        self.status = 'running'
        self.startedAt = datetime.datetime.utcnow()
        self.save()

    def fail(self, error):
        self.status = 'failed'
        self.completedAt = datetime.datetime.utcnow()
        self.actualDuration = self.duration
        self.error = ErrorInfo(
            message=str(error),
            stack=getattr(error, 'stack', ''),
            timestamp=datetime.datetime.utcnow()
        )
        self.save()
