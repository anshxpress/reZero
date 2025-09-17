import OpenAI from 'openai';
import { config } from '../config.js';
import logger from '../utils/logger.js';

class OpenAIClient {
  constructor() {
    if (!config.openai.apiKey) {
      if (process.env.NODE_ENV === 'test') {
        // In test environment, create a mock client
        this.client = {
          chat: {
            completions: {
              create: () => Promise.resolve({
                choices: [{ message: { content: 'Mock response' } }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
              })
            }
          },
          embeddings: {
            create: () => Promise.resolve({
              data: [{ embedding: [0.1, 0.2, 0.3] }],
              usage: { prompt_tokens: 10, total_tokens: 10 }
            })
          },
          models: {
            list: () => Promise.resolve({
              data: [{ id: 'gpt-4o-mini', object: 'model' }]
            })
          }
        };
      } else {
        throw new Error('OPENAI_API_KEY is required but not provided');
      }
    } else {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
        timeout: config.openai.timeout
      });
    }

    this.model = config.openai.model;
    this.maxTokens = config.openai.maxTokens;
    this.temperature = config.openai.temperature;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  async withRetry(operation, maxRetries = config.agents.maxRetries, baseDelay = config.agents.retryDelay) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          logger.error('Max retries exceeded', { 
            error: error.message, 
            attempts: attempt + 1,
            maxRetries 
          });
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: error.message,
          delay
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    return nonRetryableStatuses.includes(error.status) || 
           error.code === 'invalid_api_key' ||
           error.code === 'insufficient_quota';
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate chat completion with retry logic
   */
  async generateChatCompletion(messages, options = {}) {
    const operation = async () => {
      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        ...options
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason
      };
    };

    return this.withRetry(operation);
  }

  /**
   * Generate embeddings with retry logic
   */
  async generateEmbeddings(input, options = {}) {
    const operation = async () => {
      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input: Array.isArray(input) ? input : [input],
        ...options
      });

      return {
        embeddings: response.data.map(item => item.embedding),
        usage: response.usage,
        model: response.model
      };
    };

    return this.withRetry(operation);
  }

  /**
   * Process text with chunking for large inputs
   */
  async processLargeText(text, processor, options = {}) {
    const maxChunkSize = options.maxChunkSize || 8000; // tokens
    const overlap = options.overlap || 200; // tokens
    
    if (this.estimateTokens(text) <= maxChunkSize) {
      return processor(text, options);
    }

    logger.info('Processing large text in chunks', {
      textLength: text.length,
      estimatedTokens: this.estimateTokens(text),
      maxChunkSize
    });

    const chunks = this.chunkText(text, maxChunkSize, overlap);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      logger.debug(`Processing chunk ${i + 1}/${chunks.length}`);
      const result = await processor(chunks[i], { ...options, chunkIndex: i, totalChunks: chunks.length });
      results.push(result);
    }

    return this.mergeChunkResults(results, options);
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough approximation: 4 chars per token
  }

  /**
   * Split text into overlapping chunks
   */
  chunkText(text, maxChunkSize, overlap = 200) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const word of words) {
      const wordSize = this.estimateTokens(word);
      
      if (currentSize + wordSize > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        
        // Start new chunk with overlap
        const overlapWords = Math.floor(overlap / 4); // Rough word count for overlap
        currentChunk = currentChunk.slice(-overlapWords);
        currentSize = this.estimateTokens(currentChunk.join(' '));
      }
      
      currentChunk.push(word);
      currentSize += wordSize;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Merge results from multiple chunks
   */
  mergeChunkResults(results, options = {}) {
    if (options.mergeStrategy === 'concatenate') {
      return {
        content: results.map(r => r.content).join('\n\n'),
        usage: results.reduce((acc, r) => ({
          prompt_tokens: acc.prompt_tokens + (r.usage?.prompt_tokens || 0),
          completion_tokens: acc.completion_tokens + (r.usage?.completion_tokens || 0),
          total_tokens: acc.total_tokens + (r.usage?.total_tokens || 0)
        }), { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 })
      };
    }

    // Default: return structured summary
    return {
      content: results.map((r, i) => `Chunk ${i + 1}:\n${r.content}`).join('\n\n---\n\n'),
      chunks: results,
      totalChunks: results.length,
      usage: results.reduce((acc, r) => ({
        prompt_tokens: acc.prompt_tokens + (r.usage?.prompt_tokens || 0),
        completion_tokens: acc.completion_tokens + (r.usage?.completion_tokens || 0),
        total_tokens: acc.total_tokens + (r.usage?.total_tokens || 0)
      }), { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 })
    };
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    try {
      const models = await this.client.models.list();
      return models.data.map(model => ({
        id: model.id,
        object: model.object,
        created: model.created,
        owned_by: model.owned_by
      }));
    } catch (error) {
      logger.error('Failed to fetch available models', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.generateChatCompletion([
        { role: 'user', content: 'Hello' }
      ], { max_tokens: 5 });
      return { status: 'healthy', model: this.model };
    } catch (error) {
      logger.error('OpenAI health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Create singleton instance
let openaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAIClient();
  }
  return openaiClient;
}

export default getOpenAIClient;
