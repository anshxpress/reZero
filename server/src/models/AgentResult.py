from mongoengine import Document, StringField, FloatField, BooleanField, DictField, ListField, DateTimeField
import datetime

class AgentResult(Document):
    taskId = StringField(required=True)
    agentJobId = StringField(required=True)
    agentType = StringField(required=True, choices=['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender'])
    resultType = StringField(required=True, choices=['structured_data', 'summary', 'analysis', 'recommendation', 'extraction', 'insight'])
    title = StringField(required=True)
    content = StringField(required=True)
    structuredData = DictField(default={})
    confidence = FloatField(min_value=0, max_value=1, default=0.8)
    quality = StringField(choices=['low', 'medium', 'high'], default='medium')
    tags = ListField(StringField())
    metadata = DictField(default={})
    provenance = DictField(default={})
    isAggregated = BooleanField(default=False)
    parentResultId = StringField()
    childResultIds = ListField(StringField())
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['taskId', 'agentType']},
            {'fields': ['agentJobId']},
            {'fields': ['resultType']},
            {'fields': ['-createdAt']},
            {'fields': ['-confidence']}
        ]
    }

    def add_provenance(self, provenance_data):
        self.provenance.update(provenance_data)
        self.save()

    def add_metadata(self, key, value):
        self.metadata[key] = value
        self.save()

    def add_tag(self, tag):
        if tag not in self.tags:
            self.tags.append(tag)
        self.save()

    def update_quality(self):
        if self.confidence >= 0.9:
            self.quality = 'high'
        elif self.confidence >= 0.7:
            self.quality = 'medium'
        else:
            self.quality = 'low'
        self.save()
