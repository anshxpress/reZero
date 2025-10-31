import mongoose from 'mongoose';

const ingestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['url', 'file', 'text', 'multiple_files', 'multiple_sources'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  originalContent: {
    type: String // Store original content before processing
  },
  metadata: {
    filename: String,
    mimeType: String,
    size: Number,
    url: String,
    title: String,
    description: String,
    tags: [String],
    language: String,
    encoding: String
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processedContent: {
    type: String // Cleaned/processed version of content
  },
  extractedData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  error: {
    message: String,
    stack: String,
    timestamp: Date
  },
  processingStats: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    tokensProcessed: Number,
    chunksCreated: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
ingestSchema.index({ userId: 1, createdAt: -1 });
ingestSchema.index({ type: 1 });
ingestSchema.index({ status: 1 });

// Method to mark as completed
ingestSchema.methods.markCompleted = function(processedContent, extractedData = {}) {
  this.status = 'completed';
  this.processedContent = processedContent;
  this.extractedData = new Map(Object.entries(extractedData));
  this.processingStats.endTime = new Date();
  this.processingStats.duration = this.processingStats.endTime - this.processingStats.startTime;
  return this.save();
};

// Method to mark as failed
ingestSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.error = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  };
  this.processingStats.endTime = new Date();
  this.processingStats.duration = this.processingStats.endTime - this.processingStats.startTime;
  return this.save();
};

// Method to start processing
ingestSchema.methods.startProcessing = function() {
  this.status = 'processing';
  this.processingStats.startTime = new Date();
  return this.save();
};

export default mongoose.model('Ingest', ingestSchema);
