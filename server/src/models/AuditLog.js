import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'user_register',
      'task_create',
      'task_update',
      'task_delete',
      'task_start',
      'task_complete',
      'task_fail',
      'ingest_create',
      'ingest_delete',
      'ingest_process',
      'agent_job_create',
      'agent_job_start',
      'agent_job_complete',
      'agent_job_fail',
      'api_call',
      'file_upload',
      'multiple_files_upload',
      'file_download',
      'error_occurred'
    ]
  },
  resourceType: {
    type: String,
    enum: ['user', 'task', 'ingest', 'agent_job', 'agent_result', 'api', 'file'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  requestId: {
    type: String
  },
  sessionId: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  message: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, status: 1 });

// Static method to log action
auditLogSchema.statics.logAction = function(actionData) {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    details = {},
    ipAddress,
    userAgent,
    requestId,
    sessionId,
    severity = 'low',
    status = 'info',
    message,
    metadata = {}
  } = actionData;

  return this.create({
    userId,
    action,
    resourceType,
    resourceId,
    details: new Map(Object.entries(details)),
    ipAddress,
    userAgent,
    requestId,
    sessionId,
    severity,
    status,
    message,
    metadata: new Map(Object.entries(metadata))
  });
};

// Method to add details
auditLogSchema.methods.addDetails = function(key, value) {
  this.details.set(key, value);
  return this.save();
};

// Method to add metadata
auditLogSchema.methods.addMetadata = function(key, value) {
  this.metadata.set(key, value);
  return this.save();
};

export default mongoose.model('AuditLog', auditLogSchema);
