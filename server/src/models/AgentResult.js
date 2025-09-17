import mongoose from 'mongoose';

const agentResultSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  agentJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentJob',
    required: true
  },
  agentType: {
    type: String,
    enum: ['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender'],
    required: true
  },
  resultType: {
    type: String,
    enum: ['structured_data', 'summary', 'analysis', 'recommendation', 'extraction', 'insight'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  structuredData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [String],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  provenance: {
    sourceAgent: String,
    processingSteps: [String],
    inputTokens: Number,
    outputTokens: Number,
    modelUsed: String,
    processingTime: Number
  },
  isAggregated: {
    type: Boolean,
    default: false
  },
  parentResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentResult'
  },
  childResultIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentResult'
  }]
}, {
  timestamps: true
});

// Indexes for performance
agentResultSchema.index({ taskId: 1, agentType: 1 });
agentResultSchema.index({ agentJobId: 1 });
agentResultSchema.index({ resultType: 1 });
agentResultSchema.index({ createdAt: -1 });
agentResultSchema.index({ confidence: -1 });

// Method to add provenance information
agentResultSchema.methods.addProvenance = function(provenanceData) {
  this.provenance = {
    ...this.provenance,
    ...provenanceData
  };
  return this.save();
};

// Method to add metadata
agentResultSchema.methods.addMetadata = function(key, value) {
  this.metadata.set(key, value);
  return this.save();
};

// Method to add tag
agentResultSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Method to set quality based on confidence and other factors
agentResultSchema.methods.updateQuality = function() {
  if (this.confidence >= 0.9) {
    this.quality = 'high';
  } else if (this.confidence >= 0.7) {
    this.quality = 'medium';
  } else {
    this.quality = 'low';
  }
  return this.save();
};

export default mongoose.model('AgentResult', agentResultSchema);
