import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Ingest from '../models/Ingest.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
};

// Apply auth and admin check to all routes
router.use(authenticateToken, isAdmin);

// Get system stats
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalTasks,
            activeTasks,
            totalIngests,
            recentErrors
        ] = await Promise.all([
            User.countDocuments(),
            Task.countDocuments(),
            Task.countDocuments({ status: { $in: ['pending', 'running'] } }),
            Ingest.countDocuments(),
            AuditLog.find({ status: 'error' }).sort({ createdAt: -1 }).limit(5)
        ]);

        res.json({
            users: { total: totalUsers },
            tasks: { total: totalTasks, active: activeTasks },
            ingests: { total: totalIngests },
            recentErrors
        });
    } catch (error) {
        logger.error('Failed to get admin stats', { error: error.message });
        res.status(500).json({ error: 'Failed to retrieve stats' });
    }
});

// Get all users (paginated)
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to get users list', { error: error.message });
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Get audit logs (paginated)
router.get('/logs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AuditLog.countDocuments();

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to get audit logs', { error: error.message });
        res.status(500).json({ error: 'Failed to retrieve logs' });
    }
});

export default router;
