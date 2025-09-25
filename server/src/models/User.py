from mongoengine import Document, StringField, BooleanField, DateTimeField, DictField, ListField
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(Document):
    email = StringField(required=True, unique=True)
    password = StringField(required=True, min_length=6)
    name = StringField(required=True)
    role = StringField(choices=['user', 'admin'], default='user')
    isActive = BooleanField(default=True)
    lastLogin = DateTimeField()
    preferences = DictField(default={
        'defaultAgents': [],
        'notificationSettings': {
            'email': True,
            'taskUpdates': True
        }
    })
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['-createdAt']}
        ]
    }

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    def to_json(self):
        data = self.to_mongo().to_dict()
        data.pop('password', None)
        return data
