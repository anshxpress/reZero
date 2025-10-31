import { getOpenAIClient } from '../services/openaiClient.js';
import logger from '../utils/logger.js';

export class BaseAgent {
  constructor(agentType, options = {}) {
    this.agentType = agentType;
    this.options = {
      timeout: 300000, // 5 minutes default
      maxRetries: 3,
      ...options
    };
    this.openai = getOpenAIClient();
  }

  /**
   * Main run method that all agents must implement
   */
  async run(input, parameters = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting ${this.agentType} agent`, {
        agentType: this.agentType,
        inputType: typeof input,
        parameters
      });

      const result = await this.process(input, parameters);
      
      const duration = Date.now() - startTime;
      logger.info(`Completed ${this.agentType} agent`, {
        agentType: this.agentType,
        duration,
        success: true
      });

      return {
        status: 'completed',
        output: result,
        metadata: {
          agentType: this.agentType,
          duration,
          timestamp: new Date().toISOString(),
          parameters
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed ${this.agentType} agent`, {
        agentType: this.agentType,
        error: error.message,
        duration
      });

      return {
        status: 'failed',
        output: null,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        metadata: {
          agentType: this.agentType,
          duration,
          parameters
        }
      };
    }
  }

  /**
   * Process method that each agent must implement
   */
  async process(input, parameters) {
    throw new Error(`process method must be implemented by ${this.agentType} agent`);
  }

  /**
   * Generate structured output using OpenAI
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    const systemPrompt = `You are a specialized AI agent that generates structured output. 
    Return your response as valid JSON that matches the provided schema.
    Be precise and accurate in your analysis.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${prompt}\n\nSchema: ${JSON.stringify(schema, null, 2)}` }
    ];

    const response = await this.openai.generateChatCompletion(messages, {
      ...options,
      response_format: { type: 'json_object' }
    });

    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      logger.warn('Failed to parse JSON response, attempting to extract JSON', {
        agentType: this.agentType,
        content: response.content
      });
      
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse structured output as JSON');
    }
  }


  /**
   * Generate text output using OpenAI
   */
  async generateTextOutput(prompt, options = {}) {
    const messages = [
      { role: 'user', content: prompt }
    ];

    const response = await this.openai.generateChatCompletion(messages, options);
    return response.content;
  }

  /**
   * Validate input parameters
   */
  validateParameters(parameters, requiredFields = []) {
    const missing = requiredFields.filter(field => !parameters[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      agentType: this.agentType,
      inputTypes: ['text', 'json', 'url'],
      outputTypes: ['text', 'json', 'structured_data'],
      maxInputSize: 100000, // characters
      estimatedProcessingTime: 60000, // 1 minute
      supportedLanguages: ['en'],
      version: '1.0.0'
    };
  }
}
