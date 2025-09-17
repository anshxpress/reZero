import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import Ingest from '../models/Ingest.js';
import AuditLog from '../models/AuditLog.js';
import { config } from '../config.js';
import { authenticateToken } from './auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.fileUpload.maxSize
  },
  fileFilter: (req, file, cb) => {
    if (config.fileUpload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Extract text from file buffer based on file type
const extractTextFromFile = async (fileBuffer, mimeType, filename) => {
  try {
    if (mimeType === 'application/pdf') {
      // Dynamic import for pdf-parse to avoid test file issue
      const pdf = await import('pdf-parse');
      const pdfData = await pdf.default(fileBuffer);
      return {
        text: pdfData.text,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info,
          version: pdfData.version
        }
      };
    } else if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      return {
        text: fileBuffer.toString('utf8'),
        metadata: {}
      };
    } else if (mimeType === 'application/json') {
      const jsonContent = fileBuffer.toString('utf8');
      const parsed = JSON.parse(jsonContent);
      return {
        text: JSON.stringify(parsed, null, 2),
        metadata: {
          originalJson: parsed
        }
      };
    } else {
      // For other file types, try to read as text
      return {
        text: fileBuffer.toString('utf8'),
        metadata: {}
      };
    }
  } catch (error) {
    logger.error('Error extracting text from file', { 
      mimeType, 
      filename, 
      error: error.message 
    });
    return {
      text: `[Error extracting text from ${filename}: ${error.message}]`,
      metadata: { error: error.message }
    };
  }
};

// Process uploaded content
const processContent = async (content, type, metadata = {}) => {
  // Basic content processing
  let processedContent = content;
  const extractedData = {};

  switch (type) {
    case 'text':
      // Clean and normalize text
      processedContent = content.trim();
      extractedData.wordCount = processedContent.split(/\s+/).length;
      extractedData.characterCount = processedContent.length;
      break;
    
    case 'url':
      // Extract basic info from URL
      try {
        const url = new URL(content);
        extractedData.domain = url.hostname;
        extractedData.protocol = url.protocol;
        extractedData.path = url.pathname;
      } catch (error) {
        logger.warn('Invalid URL provided', { url: content, error: error.message });
      }
      break;
    
    case 'file':
      // File-specific processing
      extractedData.fileType = metadata.mimeType;
      extractedData.fileSize = metadata.size;
      break;
    
    case 'multiple_files':
      // Multiple files processing
      extractedData.fileCount = metadata.fileCount;
      extractedData.totalSize = metadata.totalSize;
      extractedData.fileNames = metadata.fileNames;
      extractedData.files = metadata.files;
      break;
    
    case 'multiple_sources':
      // Multiple data sources processing (text, URLs, files)
      extractedData.sourceCount = metadata.sourceCount;
      extractedData.textCount = metadata.textCount;
      extractedData.urlCount = metadata.urlCount;
      extractedData.fileCount = metadata.fileCount;
      extractedData.sources = metadata.sources;
      extractedData.hasText = metadata.hasText;
      extractedData.hasUrls = metadata.hasUrls;
      extractedData.hasFiles = metadata.hasFiles;
      break;
  }

  return { processedContent, extractedData };
};

// Create new ingest
router.post('/', authenticateToken, [
  body('type').isIn(['url', 'file', 'text', 'multiple_files', 'multiple_sources']),
  body('content').isLength({ min: 1 }),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, content, metadata = {} } = req.body;

    // Validate content based on type
    if (type === 'url') {
      try {
        new URL(content);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }

    // Create ingest record
    const ingest = new Ingest({
      userId: req.user._id,
      type,
      content,
      originalContent: content,
      metadata: new Map(Object.entries(metadata))
    });

    await ingest.startProcessing();
    await ingest.save();

    // Process content asynchronously
    processContent(content, type, metadata)
      .then(async ({ processedContent, extractedData }) => {
        await ingest.markCompleted(processedContent, extractedData);
        logger.info('Content processed successfully', { 
          ingestId: ingest._id, 
          type, 
          contentLength: content.length 
        });
      })
      .catch(async (error) => {
        await ingest.markFailed(error);
        logger.error('Content processing failed', { 
          ingestId: ingest._id, 
          error: error.message 
        });
      });

    // Log ingest creation
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'ingest_create',
      resourceType: 'ingest',
      resourceId: ingest._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { type, contentLength: content.length },
      status: 'success'
    });

    logger.info('Ingest created', { 
      ingestId: ingest._id, 
      userId: req.user._id, 
      type 
    });

    res.status(201).json({
      message: 'Content ingested successfully',
      ingestId: ingest._id,
      status: 'processing'
    });

  } catch (error) {
    logger.error('Ingest creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to ingest content' });
  }
});

// Upload file(s) - handles both single and multiple files
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.array('file')(req, res, (err) => {
    if (err) {
      logger.error('Multer error', { error: err.message });
      return res.status(400).json({ error: 'File upload failed: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const files = req.files || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check if this is a multiple files upload
    const isMultipleFiles = files.length > 1 || req.body.metadata;
    let metadata = {};
    
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        logger.warn('Invalid metadata JSON', { error: error.message });
      }
    }

    // Extract text from all files
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const extracted = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
        return {
          filename: file.originalname,
          content: extracted.text,
          metadata: extracted.metadata,
          mimeType: file.mimetype,
          size: file.size
        };
      })
    );

    // Combine all file contents
    const combinedContent = fileContents.map(file => {
      return `=== FILE: ${file.filename} (${file.mimeType}) ===\n${file.content}\n`;
    }).join('\n');

    // Create combined metadata
    const combinedMetadata = {
      ...metadata,
      fileCount: files.length,
      fileNames: files.map(f => f.originalname),
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      files: fileContents.map(file => ({
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        extractedMetadata: file.metadata
      })),
      extractedTexts: fileContents.map(file => ({
        filename: file.filename,
        textLength: file.content.length,
        hasContent: file.content.length > 0
      }))
    };

    // Create ingest record
    const ingest = new Ingest({
      userId: req.user._id,
      type: isMultipleFiles ? 'multiple_files' : 'file',
      content: combinedContent,
      originalContent: combinedContent,
      metadata: new Map(Object.entries(combinedMetadata))
    });

    await ingest.startProcessing();
    await ingest.save();

    // Process combined content asynchronously
    processContent(combinedContent, isMultipleFiles ? 'multiple_files' : 'file', combinedMetadata)
      .then(async ({ processedContent, extractedData }) => {
        await ingest.markCompleted(processedContent, extractedData);
        logger.info('Files processed successfully', { 
          ingestId: ingest._id, 
          fileCount: files.length,
          totalSize: combinedMetadata.totalSize
        });
      })
      .catch(async (error) => {
        await ingest.markFailed(error);
        logger.error('File processing failed', { 
          ingestId: ingest._id, 
          error: error.message 
        });
      });

    // Log file upload
    await AuditLog.logAction({
      userId: req.user._id,
      action: isMultipleFiles ? 'multiple_files_upload' : 'file_upload',
      resourceType: 'ingest',
      resourceId: ingest._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { 
        fileCount: files.length,
        fileNames: files.map(f => f.originalname),
        totalSize: combinedMetadata.totalSize
      },
      status: 'success'
    });

    logger.info('Files uploaded', { 
      ingestId: ingest._id, 
      userId: req.user._id, 
      fileCount: files.length
    });

    res.status(201).json({
      message: isMultipleFiles 
        ? `Files uploaded successfully (${files.length} files)`
        : 'File uploaded successfully',
      ingestId: ingest._id,
      status: 'processing',
      metadata: combinedMetadata
    });

  } catch (error) {
    logger.error('File upload failed', { error: error.message });
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get ingest by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ingest = await Ingest.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!ingest) {
      return res.status(404).json({ error: 'Ingest not found' });
    }

    res.json({
      ingest: {
        id: ingest._id,
        type: ingest.type,
        status: ingest.status,
        metadata: Object.fromEntries(ingest.metadata),
        processedContent: ingest.processedContent,
        extractedData: Object.fromEntries(ingest.extractedData),
        processingStats: ingest.processingStats,
        error: ingest.error,
        createdAt: ingest.createdAt,
        updatedAt: ingest.updatedAt
      }
    });

  } catch (error) {
    logger.error('Get ingest failed', { error: error.message });
    res.status(500).json({ error: 'Failed to get ingest' });
  }
});

// List user's ingests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const ingests = await Ingest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content -processedContent'); // Exclude large content fields

    const total = await Ingest.countDocuments(filter);

    res.json({
      ingests: ingests.map(ingest => ({
        id: ingest._id,
        type: ingest.type,
        status: ingest.status,
        metadata: Object.fromEntries(ingest.metadata),
        processingStats: ingest.processingStats,
        error: ingest.error,
        createdAt: ingest.createdAt,
        updatedAt: ingest.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('List ingests failed', { error: error.message });
    res.status(500).json({ error: 'Failed to list ingests' });
  }
});

// Delete ingest
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ingest = await Ingest.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!ingest) {
      return res.status(404).json({ error: 'Ingest not found' });
    }

    // Log deletion
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'ingest_delete',
      resourceType: 'ingest',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    logger.info('Ingest deleted', { ingestId: id, userId: req.user._id });

    res.json({
      message: 'Ingest deleted successfully'
    });

  } catch (error) {
    logger.error('Delete ingest failed', { error: error.message });
    res.status(500).json({ error: 'Failed to delete ingest' });
  }
});

export default router;
