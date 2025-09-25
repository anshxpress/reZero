from mongoengine import Document, StringField, DictField, DateTimeField, MapField, IntField, ListField, EmbeddedDocument, EmbeddedDocumentField, FloatField
import datetime

class ErrorInfo(EmbeddedDocument):
    message = StringField()
    stack = StringField()
    timestamp = DateTimeField()

class ProcessingStats(EmbeddedDocument):
    startTime = DateTimeField()
    endTime = DateTimeField()
    duration = FloatField()
    tokensProcessed = IntField()
    chunksCreated = IntField()

class Ingest(Document):
    userId = StringField(required=True)
    type = StringField(choices=['url', 'file', 'text', 'multiple_files', 'multiple_sources'], required=True)
    content = StringField(required=True)
    originalContent = StringField()
    metadata = DictField()
    status = StringField(choices=['processing', 'completed', 'failed'], default='processing')
    processedContent = StringField()
    extractedData = MapField(field=StringField())
    error = EmbeddedDocumentField(ErrorInfo)
    processingStats = EmbeddedDocumentField(ProcessingStats)
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['userId', '-createdAt']},
            {'fields': ['type']},
            {'fields': ['status']}
        ]
    }

    def mark_completed(self, processed_content, extracted_data=None):
        self.status = 'completed'
        self.processedContent = processed_content
        self.extractedData = extracted_data or {}
        if self.processingStats:
            self.processingStats.endTime = datetime.datetime.utcnow()
            self.processingStats.duration = (self.processingStats.endTime - self.processingStats.startTime).total_seconds() * 1000
        self.save()

    def mark_failed(self, error):
        self.status = 'failed'
        self.error = ErrorInfo(
            message=str(error),
            stack=getattr(error, 'stack', ''),
            timestamp=datetime.datetime.utcnow()
        )
        if self.processingStats:
            self.processingStats.endTime = datetime.datetime.utcnow()
            self.processingStats.duration = (self.processingStats.endTime - self.processingStats.startTime).total_seconds() * 1000
        self.save()

    def start_processing(self):
        self.status = 'processing'
        if not self.processingStats:
            self.processingStats = ProcessingStats()
        self.processingStats.startTime = datetime.datetime.utcnow()
        self.save()
