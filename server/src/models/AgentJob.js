import mongoose from 'mongoose';

const agentJobSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  agentType: {
    type: String,
    enum: ['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender'],
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued'
  },
  input: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  output: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in milliseconds
    default: 60000 // 1 minute default
  },
  actualDuration: {
    type: Number // in milliseconds
  },
  error: {
    message: String,
    stack: String,
    timestamp: Date,
    retryable: { type: Boolean, default: true }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  logs: [{
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },
    message: String,
    timestamp: { type: Date, default: Date.now },
    data: Map
  }]
}, {
  timestamps: true
});

// Indexes for performance
agentJobSchema.index({ taskId: 1, agentType: 1 });
agentJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
agentJobSchema.index({ createdAt: -1 });

// Virtual for duration calculation
agentJobSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

// Method to start job
agentJobSchema.methods.start = function() {
  this.status = 'running';
  this.startedAt = new Date();
  return this.save();
};

// Method to complete job
agentJobSchema.methods.complete = function(output, metadata = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.actualDuration = this.duration;
  this.output = new Map(Object.entries(output));
  this.metadata = new Map(Object.entries(metadata));
  return this.save();
};

// Method to fail job
agentJobSchema.methods.fail = function(error, retryable = true) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.actualDuration = this.duration;
  this.error = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
    retryable
  };
  return this.save();
};

// Method to add log entry
agentJobSchema.methods.addLog = function(level, message, data = {}) {
  this.logs.push({
    level,
    message,
    timestamp: new Date(),
    data: new Map(Object.entries(data))
  });
  return this.save();
};

// Method to retry job
agentJobSchema.methods.retry = function() {
  if (this.retryCount < this.maxRetries && this.error?.retryable) {
    this.retryCount += 1;
    this.status = 'queued';
    this.error = undefined;
    this.startedAt = undefined;
    this.completedAt = undefined;
    return this.save();
  }
  return Promise.reject(new Error('Job cannot be retried'));
};

// Method to update status
agentJobSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'running' && !this.startedAt) {
    this.startedAt = new Date();
  } else if (status === 'completed' || status === 'failed') {
    this.completedAt = new Date();
  }
  return this.save();
};

export default mongoose.model('AgentJob', agentJobSchema);
