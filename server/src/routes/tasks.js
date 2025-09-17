import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Ingest from '../models/Ingest.js';
import AgentJob from '../models/AgentJob.js';
import AgentResult from '../models/AgentResult.js';
import AuditLog from '../models/AuditLog.js';
import { MetaAgent } from '../agents/MetaAgent.js';
import { authenticateToken } from './auth.js';
import logger from '../utils/logger.js';

const router = express.Router();
const metaAgent = new MetaAgent();

// Create new task
router.post('/', authenticateToken, [
  body('ingestId').isMongoId(),
  body('name').trim().isLength({ min: 1 }),
  body('selectedAgents').isArray({ min: 1 }),
  body('description').optional().trim(),
  body('parameters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      ingestId, 
      name, 
      selectedAgents, 
      description, 
      parameters = {},
      priority = 'medium'
    } = req.body;

    // Validate ingest exists and belongs to user
    const ingest = await Ingest.findOne({
      _id: ingestId,
      userId: req.user._id,
      status: 'completed'
    });

    if (!ingest) {
      return res.status(404).json({ 
        error: 'Ingest not found or not ready for processing' 
      });
    }

    // Validate agent selection
    try {
      metaAgent.validateAgentSelection(selectedAgents);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create task
    const task = new Task({
      userId: req.user._id,
      ingestId,
      name,
      description,
      selectedAgents,
      parameters: new Map(Object.entries(parameters)),
      priority
    });

    await task.save();

    // Log task creation
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'task_create',
      resourceType: 'task',
      resourceId: task._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { 
        ingestId, 
        selectedAgents, 
        priority 
      },
      status: 'success'
    });

    logger.info('Task created', { 
      taskId: task._id, 
      userId: req.user._id, 
      selectedAgents 
    });

    // Start task processing asynchronously
    setImmediate(async () => {
      try {
        logger.info('Starting async task processing', { 
          taskId: task._id, 
          selectedAgents,
          inputLength: ingest.processedContent?.length || 0
        });
        
        const result = await metaAgent.orchestrateTask(task, ingest.processedContent, selectedAgents, parameters);
        if (result.status === 'completed') {
          logger.info('Task completed successfully', { 
            taskId: task._id, 
            duration: result.metadata.duration 
          });
        } else {
          logger.error('Task failed', { 
            taskId: task._id, 
            error: result.error 
          });
        }
      } catch (error) {
        logger.error('Task orchestration error', { 
          taskId: task._id, 
          error: error.message,
          stack: error.stack
        });
        try {
          await task.fail(error);
        } catch (failError) {
          logger.error('Failed to update task status to failed', {
            taskId: task._id,
            error: failError.message
          });
        }
      }
    });

    res.status(201).json({
      message: 'Task created successfully',
      taskId: task._id,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Task creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      _id: id,
      userId: req.user._id
    }).populate('ingestId', 'type status metadata');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get agent jobs for this task
    const agentJobs = await AgentJob.find({ taskId: id })
      .sort({ createdAt: 1 });

    // Get agent results for this task
    const agentResults = await AgentResult.find({ taskId: id })
      .sort({ createdAt: 1 });

    res.json({
      task: {
        id: task._id,
        name: task.name,
        description: task.description,
        status: task.status,
        selectedAgents: task.selectedAgents,
        parameters: Object.fromEntries(task.parameters),
        priority: task.priority,
        progress: task.progress,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        error: task.error,
        metadata: Object.fromEntries(task.metadata),
        ingest: task.ingestId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      },
      agentJobs: agentJobs.map(job => ({
        id: job._id,
        agentType: job.agentType,
        status: job.status,
        priority: job.priority,
        retryCount: job.retryCount,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        estimatedDuration: job.estimatedDuration,
        actualDuration: job.actualDuration,
        error: job.error,
        metadata: Object.fromEntries(job.metadata),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      })),
      agentResults: agentResults.map(result => ({
        id: result._id,
        agentType: result.agentType,
        resultType: result.resultType,
        title: result.title,
        content: result.content,
        structuredData: Object.fromEntries(result.structuredData),
        confidence: result.confidence,
        quality: result.quality,
        tags: result.tags,
        metadata: Object.fromEntries(result.metadata),
        provenance: result.provenance,
        isAggregated: result.isAggregated,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }))
    });

  } catch (error) {
    logger.error('Get task failed', { error: error.message });
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// List user's tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      agentType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (agentType) filter.selectedAgents = agentType;

    const tasks = await Task.find(filter)
      .populate('ingestId', 'type status metadata')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      tasks: tasks.map(task => ({
        id: task._id,
        name: task.name,
        description: task.description,
        status: task.status,
        selectedAgents: task.selectedAgents,
        priority: task.priority,
        progress: task.progress,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        actualDuration: task.actualDuration,
        error: task.error,
        ingest: task.ingestId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('List tasks failed', { error: error.message });
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

// Update task
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, priority } = req.body;

    const task = await Task.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only allow updates for pending tasks
    if (task.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Can only update pending tasks' 
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    // Log task update
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'task_update',
      resourceType: 'task',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: updates,
      status: 'success'
    });

    logger.info('Task updated', { taskId: id, userId: req.user._id });

    res.json({
      message: 'Task updated successfully',
      task: {
        id: updatedTask._id,
        name: updatedTask.name,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        updatedAt: updatedTask.updatedAt
      }
    });

  } catch (error) {
    logger.error('Task update failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Cancel task
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only allow cancellation of pending or running tasks
    if (!['pending', 'running'].includes(task.status)) {
      return res.status(400).json({ 
        error: 'Can only cancel pending or running tasks' 
      });
    }

    task.status = 'cancelled';
    task.completedAt = new Date();
    task.actualDuration = task.duration;
    await task.save();

    // Cancel associated agent jobs
    await AgentJob.updateMany(
      { taskId: id, status: { $in: ['queued', 'running'] } },
      { status: 'cancelled', completedAt: new Date() }
    );

    // Log task cancellation
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'task_cancel',
      resourceType: 'task',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('Task cancelled', { taskId: id, userId: req.user._id });

    res.json({
      message: 'Task cancelled successfully'
    });

  } catch (error) {
    logger.error('Task cancellation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete associated agent jobs and results
    await AgentJob.deleteMany({ taskId: id });
    await AgentResult.deleteMany({ taskId: id });
    await Task.findByIdAndDelete(id);

    // Log task deletion
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'task_delete',
      resourceType: 'task',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('Task deleted', { taskId: id, userId: req.user._id });

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    logger.error('Task deletion failed', { error: error.message });
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get available agents
router.get('/agents/available', authenticateToken, async (req, res) => {
  try {
    const agents = metaAgent.getAvailableAgents();

    res.json({
      agents: agents.map(agent => ({
        type: agent.type,
        capabilities: agent.capabilities
      }))
    });

  } catch (error) {
    logger.error('Get available agents failed', { error: error.message });
    res.status(500).json({ error: 'Failed to get available agents' });
  }
});

export default router;
