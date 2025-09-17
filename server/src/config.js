import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rezero',
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 4000,
    temperature: 0.7,
    timeout: 30000
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // File Upload Configuration
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'text/plain,application/json,text/csv,application/pdf').split(',')
  },
  
  // Agent Configuration
  agents: {
    timeout: parseInt(process.env.AGENT_TIMEOUT_MS) || 5 * 60 * 1000, // 5 minutes
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY_MS) || 1000
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Some features may not work properly.`);
  }
}
