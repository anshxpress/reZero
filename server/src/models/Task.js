import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ingestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingest',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  selectedAgents: [{
    type: String,
    enum: ['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender'],
    required: true
  }],
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in milliseconds
    default: 300000 // 5 minutes default
  },
  actualDuration: {
    type: Number // in milliseconds
  },
  error: {
    message: String,
    stack: String,
    timestamp: Date
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
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for duration calculation
taskSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

// Method to update progress
taskSchema.methods.updateProgress = function(progress) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (progress === 100 && this.status === 'running') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.actualDuration = this.duration;
  }
  return this.save();
};

// Method to start task
taskSchema.methods.start = function() {
  this.status = 'running';
  this.startedAt = new Date();
  return this.save();
};

// Method to fail task
taskSchema.methods.fail = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.actualDuration = this.duration;
  this.error = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  };
  return this.save();
};

export default mongoose.model('Task', taskSchema);
