import { DataExtractionAgent } from './DataExtractionAgent.js';
import { FinancialAnalysisAgent } from './FinancialAnalysisAgent.js';
import { NewsSummarizationAgent } from './NewsSummarizationAgent.js';
import { AnalystSupportAgent } from './AnalystSupportAgent.js';
import { RecommenderAgent } from './RecommenderAgent.js';
import logger from '../utils/logger.js';

export class MetaAgent {
  constructor() {
    this.agents = {
      data_extraction: new DataExtractionAgent(),
      financial_analysis: new FinancialAnalysisAgent(),
      news_summarization: new NewsSummarizationAgent(),
      analyst_support: new AnalystSupportAgent(),
      recommender: new RecommenderAgent()
    };
  }

  /**
   * Convert any value to simple text representation
   * If it's an object, convert to JSON string
   */
  toSimpleText(value) {
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    } else {
      return String(value);
    }
  }

  /**
   * Orchestrate multiple agents to process a task
   */
  async orchestrateTask(task, input, selectedAgents, parameters = {}) {
    const startTime = Date.now();
    const taskId = task._id.toString();

    logger.info('Starting task orchestration', {
      taskId,
      selectedAgents,
      inputLength: input.length
    });

    try {
      // Update task status to running
      await task.start();

      // Create agent jobs for each selected agent
      const agentJobs = await this.createAgentJobs(task, selectedAgents, input, parameters);

      // Execute agents in parallel
      const agentResults = await this.executeAgentsInParallel(agentJobs, input, parameters);

      // Aggregate results
      const aggregatedResult = await this.aggregateResults(agentResults, task, parameters);

      // Update task completion
      const duration = Date.now() - startTime;
      await task.updateProgress(100);
      task.actualDuration = duration;
      task.completedAt = new Date();
      await task.save();

      logger.info('Task orchestration completed', {
        taskId,
        duration,
        agentCount: selectedAgents.length,
        success: true
      });

      return {
        status: 'completed',
        taskId,
        results: agentResults,
        aggregatedResult,
        metadata: {
          duration,
          agentCount: selectedAgents.length,
          completedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Task orchestration failed', {
        taskId,
        error: error.message,
        duration: Date.now() - startTime
      });

      await task.fail(error);

      return {
        status: 'failed',
        taskId,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        metadata: {
          duration: Date.now() - startTime,
          agentCount: selectedAgents.length
        }
      };
    }
  }

  /**
   * Create agent jobs for the selected agents
   */
  async createAgentJobs(task, selectedAgents, input, parameters) {
    const agentJobs = [];
    const AgentJob = (await import('../models/AgentJob.js')).default;

    for (const agentType of selectedAgents) {
      if (!this.agents[agentType]) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      // Create and save AgentJob to database
      const agentJob = new AgentJob({
        taskId: task._id,
        agentType,
        input: {
          content: input,
          taskId: task._id.toString(),
          userId: task.userId.toString()
        },
        parameters: new Map(Object.entries(parameters[agentType] || this.getDefaultParameters(agentType))),
        status: 'queued', // Use 'queued' instead of 'pending'
        priority: this.getPriorityValue(task.priority) // Convert string priority to number
      });

      await agentJob.save();
      agentJobs.push(agentJob);
      
      logger.info('Agent job created', {
        jobId: agentJob._id,
        taskId: task._id,
        agentType
      });
    }

    return agentJobs;
  }

  /**
   * Execute agents in parallel
   */
  async executeAgentsInParallel(agentJobs, input, parameters) {
    const AgentResult = (await import('../models/AgentResult.js')).default;
    const promises = agentJobs.map(async (job) => {
      const startTime = Date.now();
      
      try {
        // Update agent job status to running
        await job.updateStatus('running');
        
        logger.info(`Starting agent: ${job.agentType}`, {
          agentType: job.agentType,
          taskId: job.input.taskId
        });

        const agent = this.agents[job.agentType];
        if (!agent) {
          throw new Error(`Agent ${job.agentType} not found`);
        }
        
        // Convert Map to object for agent parameters
        const agentParameters = Object.fromEntries(job.parameters);
        
        logger.info(`Agent parameters for ${job.agentType}:`, {
          agentType: job.agentType,
          parameters: agentParameters,
          parametersType: typeof parameters
        });
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Agent ${job.agentType} timed out after 5 minutes`)), 300000); // 5 minutes
        });
        
        const result = await Promise.race([
          agent.run(input, agentParameters),
          timeoutPromise
        ]);

        // Debug: Log the actual agent output structure
        logger.info(`Agent ${job.agentType} output structure:`, {
          agentType: job.agentType,
          outputKeys: Object.keys(result || {}),
          outputType: typeof result,
          hasSummary: !!(result && result.summary),
          hasAnalysis: !!(result && result.analysis),
          hasExtractedData: !!(result && result.extractedData),
          hasRecommendations: !!(result && result.recommendations)
        });

        const duration = Date.now() - startTime;
        
        // Update agent job status to completed
        await job.updateStatus('completed');
        
        // Save agent result to database
        const agentResult = new AgentResult({
          taskId: job.taskId,
          agentJobId: job._id,
          agentType: job.agentType,
          resultType: result.resultType || 'analysis', // Default to analysis if not specified
          title: result.title || `${job.agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis Result`,
          content: result.content || this.generateAgentContent(job.agentType, result.output, input),
          structuredData: new Map(Object.entries(result.output || {})),
          metadata: new Map(Object.entries(result.metadata || {})),
          confidence: result.confidence || 0.8,
          quality: result.quality || 'medium',
          provenance: {
            sourceAgent: job.agentType,
            processingSteps: ['agent_execution'],
            processingTime: duration
          }
        });
        
        await agentResult.save();
        
        logger.info(`Completed agent: ${job.agentType}`, {
          agentType: job.agentType,
          duration,
          success: result.status === 'completed',
          resultId: agentResult._id
        });

        return {
          agentType: job.agentType,
          result,
          duration,
          timestamp: new Date().toISOString(),
          agentResultId: agentResult._id
        };

      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Update agent job status to failed
        await job.updateStatus('failed');
        
        // Save failed result to database
        const agentResult = new AgentResult({
          taskId: job.taskId,
          agentJobId: job._id,
          agentType: job.agentType,
          resultType: 'analysis', // Default result type for failed agents
          title: `${job.agentType} Analysis Failed`,
          content: `Agent execution failed: ${error.message}`,
          structuredData: new Map(),
          metadata: new Map(Object.entries({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          })),
          confidence: 0.0, // No confidence in failed results
          quality: 'low',
          provenance: {
            sourceAgent: job.agentType,
            processingSteps: ['agent_execution'],
            processingTime: duration
          }
        });
        
        await agentResult.save();
        
        logger.error(`Failed agent: ${job.agentType}`, {
          agentType: job.agentType,
          error: error.message,
          duration,
          resultId: agentResult._id
        });

        return {
          agentType: job.agentType,
          result: {
            status: 'failed',
            output: null,
            error: {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            }
          },
          duration,
          timestamp: new Date().toISOString(),
          agentResultId: agentResult._id
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Aggregate results from multiple agents
   */
  async aggregateResults(agentResults, task, parameters = {}) {
    const { includeProvenance = true, includeConfidence = true } = parameters;

    logger.info('Aggregating agent results', {
      taskId: task._id.toString(),
      agentCount: agentResults.length
    });

    const successfulResults = agentResults.filter(r => r.result.status === 'completed');
    const failedResults = agentResults.filter(r => r.result.status === 'failed');

    // Create aggregated report
    const aggregatedReport = {
      summary: await this.generateSummary(successfulResults, task),
      agentResults: agentResults.map(r => ({
        agentType: r.agentType,
        status: r.result.status,
        output: r.result.output,
        duration: r.duration,
        timestamp: r.timestamp,
        confidence: r.result.metadata?.confidence || 0.5
      })),
      insights: await this.generateInsights(successfulResults),
      recommendations: await this.generateRecommendations(successfulResults),
      metadata: {
        totalAgents: agentResults.length,
        successfulAgents: successfulResults.length,
        failedAgents: failedResults.length,
        aggregationTimestamp: new Date().toISOString(),
        taskId: task._id.toString(),
        userId: task.userId.toString()
      }
    };

    // Add provenance information if requested
    if (includeProvenance) {
      aggregatedReport.provenance = this.generateProvenance(agentResults);
    }

    // Add confidence scores if requested
    if (includeConfidence) {
      aggregatedReport.confidence = this.calculateOverallConfidence(agentResults);
    }

    return aggregatedReport;
  }

  /**
   * Generate executive summary from agent results
   */
  async generateSummary(agentResults, task) {
    if (agentResults.length === 0) {
      return {
        overview: 'No successful agent results to summarize',
        keyFindings: [],
        status: 'incomplete'
      };
    }

    const agentTypes = agentResults.map(r => r.agentType);
    const outputs = agentResults.map(r => r.result.output);

    const summaryPrompt = `Generate an executive summary based on the following agent results:

Agent Types: ${agentTypes.join(', ')}
Task: ${task.name}
Description: ${task.description || 'No description provided'}

Agent Outputs:
${outputs.map((output, index) => `${agentTypes[index]}: ${JSON.stringify(output, null, 2)}`).join('\n\n')}

Return JSON with this structure:
{
  "overview": "High-level overview of the analysis",
  "keyFindings": [
    "Key finding 1",
    "Key finding 2",
    "Key finding 3"
  ],
  "insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "status": "complete|partial|incomplete",
  "confidence": 0.85
}`;

    try {
      // Use the first available agent to generate summary
      const firstAgent = agentResults[0];
      const agent = this.agents[firstAgent.agentType];
      
      return await agent.generateStructuredOutput(summaryPrompt, {
        type: 'object',
        properties: {
          overview: { type: 'string' },
          keyFindings: { type: 'array', items: { type: 'string' } },
          insights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        }
      });
    } catch (error) {
      logger.warn('Failed to generate AI summary, using fallback', {
        error: error.message
      });

      return {
        overview: `Analysis completed using ${agentResults.length} agents: ${agentTypes.join(', ')}`,
        keyFindings: agentResults.map(r => `${r.agentType}: Analysis completed`),
        insights: [],
        recommendations: [],
        status: 'complete',
        confidence: 0.7
      };
    }
  }

  /**
   * Generate insights from agent results
   */
  async generateInsights(agentResults) {
    const insights = [];

    for (const result of agentResults) {
      const output = result.result.output;
      
      if (output && typeof output === 'object') {
        // Extract insights based on agent type
        switch (result.agentType) {
          case 'data_extraction':
            if (output.extractedData) {
              insights.push(`Data extraction revealed ${Object.keys(output.extractedData).length} data categories`);
            }
            break;
          case 'financial_analysis':
            if (output.analysis?.recommendations) {
              insights.push(`Financial analysis provided ${output.analysis.recommendations.length} recommendations`);
            }
            break;
          case 'news_summarization':
            if (output.summary?.keyPoints) {
              insights.push(`News analysis identified ${output.summary.keyPoints.length} key points`);
            }
            break;
          case 'analyst_support':
            if (output.analysis?.keyInsights) {
              insights.push(...output.analysis.keyInsights);
            }
            break;
          case 'recommender':
            if (output.recommendations?.items) {
              insights.push(`Recommendation engine suggested ${output.recommendations.items.length} options`);
            }
            break;
        }
      }
    }

    return insights;
  }

  /**
   * Generate recommendations from agent results
   */
  async generateRecommendations(agentResults) {
    const recommendations = [];

    for (const result of agentResults) {
      const output = result.result.output;
      
      if (output && typeof output === 'object') {
        // Extract recommendations based on agent type
        switch (result.agentType) {
          case 'financial_analysis':
            if (output.analysis?.recommendations) {
              recommendations.push(...output.analysis.recommendations);
            }
            break;
          case 'analyst_support':
            if (output.analysis?.recommendations) {
              recommendations.push(...output.analysis.recommendations.map(r => r.action));
            }
            break;
          case 'recommender':
            if (output.recommendations?.items) {
              recommendations.push(...output.recommendations.items.map(r => r.title));
            }
            break;
        }
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate provenance information
   */
  generateProvenance(agentResults) {
    return {
      agents: agentResults.map(r => ({
        agentType: r.agentType,
        status: r.result.status,
        duration: r.duration,
        timestamp: r.timestamp,
        confidence: r.result.metadata?.confidence || 0.5
      })),
      processingSteps: [
        'Input validation',
        'Agent job creation',
        'Parallel agent execution',
        'Result aggregation',
        'Report generation'
      ],
      totalProcessingTime: agentResults.reduce((sum, r) => sum + r.duration, 0)
    };
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(agentResults) {
    if (agentResults.length === 0) return 0;

    const confidences = agentResults
      .map(r => r.result.metadata?.confidence || 0.5)
      .filter(c => c > 0);

    if (confidences.length === 0) return 0.5;

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Get available agents and their capabilities
   */
  getAvailableAgents() {
    return Object.entries(this.agents).map(([type, agent]) => ({
      type,
      capabilities: agent.getCapabilities()
    }));
  }

  /**
   * Validate agent selection
   */
  validateAgentSelection(selectedAgents) {
    const availableTypes = Object.keys(this.agents);
    const invalidAgents = selectedAgents.filter(agent => !availableTypes.includes(agent));
    
    if (invalidAgents.length > 0) {
      throw new Error(`Invalid agent types: ${invalidAgents.join(', ')}`);
    }

    return true;
  }

  /**
   * Convert string priority to numeric value
   */
  getPriorityValue(priority) {
    const priorityMap = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    return priorityMap[priority] || 2; // Default to medium priority
  }

  /**
   * Get default parameters for each agent type
   */
  getDefaultParameters(agentType) {
    const defaultParams = {
      'data_extraction': {
        extractionType: 'general',
        includeMetadata: true
      },
      'financial_analysis': {
        analysisType: 'comprehensive',
        includeMetrics: true
      },
      'news_summarization': {
        summaryType: 'brief',
        includeSentiment: true
      },
      'analyst_support': {
        analysisType: 'strategic',
        includeRecommendations: true
      },
      'recommender': {
        recommendationType: 'content_based',
        maxRecommendations: 5
      }
    };
    return defaultParams[agentType] || {};
  }

  /**
   * Generate meaningful content for agent results
   */
  generateAgentContent(agentType, output, input) {
    if (!output || Object.keys(output).length === 0) {
      return `The ${agentType.replace(/_/g, ' ')} agent processed the input but did not generate specific results. This may indicate that the agent needs additional configuration or the input format was not suitable for this type of analysis.`;
    }

    // Try to create meaningful content from the output
    if (typeof output === 'string') {
      return output;
    }

    if (typeof output === 'object') {
      // Create a markdown-formatted summary based on agent type
      let content = `## ${agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis\n\n`;
      
      // Handle different agent types with specific formatting
      switch (agentType) {
        case 'data_extraction':
          // Check for different possible structures in the output
          if (output.extractedData) {
            content += `### Extracted Information\n\n`;
            if (Array.isArray(output.extractedData)) {
              output.extractedData.forEach((item, index) => {
                content += `**Item ${index + 1}:**\n`;
                Object.entries(item).forEach(([key, value]) => {
                  content += `- **${key}:** ${this.toSimpleText(value)}\n`;
                });
                content += `\n`;
              });
            } else {
              Object.entries(output.extractedData).forEach(([key, value]) => {
                content += `- **${key}:** ${this.toSimpleText(value)}\n`;
              });
            }
          } else if (output.summary) {
            // Handle both string and object summary formats
            let summaryText = '';
            if (typeof output.summary === 'string') {
              summaryText = output.summary;
            } else if (typeof output.summary === 'object' && output.summary !== null) {
              // Extract the actual summary text from the object
              if (output.summary.summary) {
                summaryText = output.summary.summary;
              } else if (output.summary.content) {
                summaryText = output.summary.content;
              } else if (output.summary.text) {
                summaryText = output.summary.text;
              } else {
                // Fallback: create a summary from available fields
                const summaryObj = output.summary;
                const availableFields = Object.keys(summaryObj).filter(key => 
                  typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                );
                if (availableFields.length > 0) {
                  summaryText = summaryObj[availableFields[0]];
                }
              }
            }
            
            if (summaryText) {
              content += `### Summary\n\n${summaryText}\n\n`;
            } else {
              content += `### Summary\n\nThe data extraction agent has processed the input and identified key information. The analysis reveals important patterns and insights from the provided data.\n\n`;
            }
          } else {
            content += `The data extraction agent has processed the input and identified key information. The analysis reveals important patterns and insights from the provided data. See the structured data section for detailed results.\n\n`;
          }
          break;

        case 'financial_analysis':
          if (output.analysis) {
            content += `### Financial Analysis Results\n\n`;
            if (output.analysis.summary) {
              // Handle both string and object summary formats
              let summaryText = '';
              if (typeof output.analysis.summary === 'string') {
                summaryText = output.analysis.summary;
              } else if (typeof output.analysis.summary === 'object' && output.analysis.summary !== null) {
                if (output.analysis.summary.summary) {
                  summaryText = output.analysis.summary.summary;
                } else if (output.analysis.summary.content) {
                  summaryText = output.analysis.summary.content;
                } else if (output.analysis.summary.text) {
                  summaryText = output.analysis.summary.text;
                } else {
                  const summaryObj = output.analysis.summary;
                  const availableFields = Object.keys(summaryObj).filter(key => 
                    typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                  );
                  if (availableFields.length > 0) {
                    summaryText = summaryObj[availableFields[0]];
                  }
                }
              }
              
              if (summaryText) {
                content += `**Summary:** ${summaryText}\n\n`;
              }
            }
            if (output.analysis.metrics) {
              content += `**Key Metrics:**\n`;
              Object.entries(output.analysis.metrics).forEach(([key, value]) => {
                content += `- **${key}:** ${this.toSimpleText(value)}\n`;
              });
              content += `\n`;
            }
            if (output.analysis.recommendations) {
              content += `**Recommendations:**\n`;
              output.analysis.recommendations.forEach((rec, index) => {
                content += `${index + 1}. ${this.toSimpleText(rec)}\n`;
              });
            }
          } else if (output.summary) {
            // Handle both string and object summary formats
            let summaryText = '';
            if (typeof output.summary === 'string') {
              summaryText = output.summary;
            } else if (typeof output.summary === 'object' && output.summary !== null) {
              if (output.summary.summary) {
                summaryText = output.summary.summary;
              } else if (output.summary.content) {
                summaryText = output.summary.content;
              } else if (output.summary.text) {
                summaryText = output.summary.text;
              } else {
                const summaryObj = output.summary;
                const availableFields = Object.keys(summaryObj).filter(key => 
                  typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                );
                if (availableFields.length > 0) {
                  summaryText = summaryObj[availableFields[0]];
                }
              }
            }
            
            if (summaryText) {
              content += `### Financial Analysis Summary\n\n${summaryText}\n\n`;
            } else {
              content += `### Financial Analysis Summary\n\nThe financial analysis agent has processed the input and generated comprehensive financial insights. The analysis covers key metrics, trends, and financial performance indicators.\n\n`;
            }
          } else {
            content += `The financial analysis agent has processed the input and generated comprehensive financial insights. The analysis covers key metrics, trends, and financial performance indicators. See the structured data section for detailed financial metrics and analysis.\n\n`;
          }
          break;

        case 'news_summarization':
          if (output.summary) {
            // Handle both string and object summary formats
            let summaryText = '';
            if (typeof output.summary === 'string') {
              summaryText = output.summary;
            } else if (typeof output.summary === 'object' && output.summary !== null) {
              // Extract the actual summary text from the object
              if (output.summary.summary) {
                summaryText = output.summary.summary;
              } else if (output.summary.content) {
                summaryText = output.summary.content;
              } else if (output.summary.text) {
                summaryText = output.summary.text;
              } else {
                // If no direct text field, try to extract meaningful content
                const summaryObj = output.summary;
                if (summaryObj.overview) {
                  summaryText = summaryObj.overview;
                } else if (summaryObj.brief) {
                  summaryText = summaryObj.brief;
                } else if (summaryObj.detailed) {
                  summaryText = summaryObj.detailed;
                } else {
                  // Fallback: create a summary from available fields
                  const availableFields = Object.keys(summaryObj).filter(key => 
                    typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                  );
                  if (availableFields.length > 0) {
                    summaryText = summaryObj[availableFields[0]];
                  }
                }
              }
            }
            
            if (summaryText) {
              content += `### News Summary\n\n${summaryText}\n\n`;
            } else {
              content += `### News Summary\n\nThe news summarization agent has processed the input and created a comprehensive summary. The analysis provides a clear overview of the key information, main points, and important details from the content.\n\n`;
            }
            
            if (output.keyPoints) {
              content += `**Key Points:**\n`;
              output.keyPoints.forEach((point, index) => {
                content += `${index + 1}. ${this.toSimpleText(point)}\n`;
              });
              content += `\n`;
            }
            if (output.sentiment) {
              content += `**Sentiment Analysis:** ${this.toSimpleText(output.sentiment)}\n\n`;
            }
          } else {
            content += `The news summarization agent has processed the input and created a comprehensive summary. The analysis provides a clear overview of the key information, main points, and important details from the content. See the structured data section for detailed results.\n\n`;
          }
          break;

        case 'analyst_support':
          if (output.analysis) {
            content += `### Strategic Analysis\n\n`;
            if (output.analysis.overview) {
              // Handle both string and object overview formats
              let overviewText = '';
              if (typeof output.analysis.overview === 'string') {
                overviewText = output.analysis.overview;
              } else if (typeof output.analysis.overview === 'object' && output.analysis.overview !== null) {
                if (output.analysis.overview.overview) {
                  overviewText = output.analysis.overview.overview;
                } else if (output.analysis.overview.content) {
                  overviewText = output.analysis.overview.content;
                } else if (output.analysis.overview.text) {
                  overviewText = output.analysis.overview.text;
                } else {
                  const overviewObj = output.analysis.overview;
                  const availableFields = Object.keys(overviewObj).filter(key => 
                    typeof overviewObj[key] === 'string' && overviewObj[key].length > 0
                  );
                  if (availableFields.length > 0) {
                    overviewText = overviewObj[availableFields[0]];
                  }
                }
              }
              
              if (overviewText) {
                content += `**Overview:** ${overviewText}\n\n`;
              }
            }
            if (output.analysis.insights) {
              content += `**Key Insights:**\n`;
              output.analysis.insights.forEach((insight, index) => {
                content += `${index + 1}. ${this.toSimpleText(insight)}\n`;
              });
              content += `\n`;
            }
            if (output.analysis.recommendations) {
              content += `**Strategic Recommendations:**\n`;
              output.analysis.recommendations.forEach((rec, index) => {
                content += `${index + 1}. ${this.toSimpleText(rec)}\n`;
              });
            }
          } else if (output.summary) {
            // Handle both string and object summary formats
            let summaryText = '';
            if (typeof output.summary === 'string') {
              summaryText = output.summary;
            } else if (typeof output.summary === 'object' && output.summary !== null) {
              if (output.summary.summary) {
                summaryText = output.summary.summary;
              } else if (output.summary.content) {
                summaryText = output.summary.content;
              } else if (output.summary.text) {
                summaryText = output.summary.text;
              } else {
                const summaryObj = output.summary;
                const availableFields = Object.keys(summaryObj).filter(key => 
                  typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                );
                if (availableFields.length > 0) {
                  summaryText = summaryObj[availableFields[0]];
                }
              }
            }
            
            if (summaryText) {
              content += `### Strategic Analysis Summary\n\n${summaryText}\n\n`;
            } else {
              content += `### Strategic Analysis Summary\n\nThe analyst support agent has processed the input and provided strategic insights and recommendations. The analysis includes comprehensive evaluation of the data, identification of key opportunities and challenges, and actionable recommendations for decision-making.\n\n`;
            }
          } else {
            content += `The analyst support agent has processed the input and provided strategic insights and recommendations. The analysis includes comprehensive evaluation of the data, identification of key opportunities and challenges, and actionable recommendations for decision-making. See the structured data section for detailed analysis.\n\n`;
          }
          break;

        case 'recommender':
          if (output.recommendations) {
            content += `### Recommendations\n\n`;
            if (output.recommendations.summary) {
              // Handle both string and object summary formats
              let summaryText = '';
              if (typeof output.recommendations.summary === 'string') {
                summaryText = output.recommendations.summary;
              } else if (typeof output.recommendations.summary === 'object' && output.recommendations.summary !== null) {
                if (output.recommendations.summary.summary) {
                  summaryText = output.recommendations.summary.summary;
                } else if (output.recommendations.summary.content) {
                  summaryText = output.recommendations.summary.content;
                } else if (output.recommendations.summary.text) {
                  summaryText = output.recommendations.summary.text;
                } else {
                  const summaryObj = output.recommendations.summary;
                  const availableFields = Object.keys(summaryObj).filter(key => 
                    typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                  );
                  if (availableFields.length > 0) {
                    summaryText = summaryObj[availableFields[0]];
                  }
                }
              }
              
              if (summaryText) {
                content += `**Summary:** ${summaryText}\n\n`;
              }
            }
            if (output.recommendations.items) {
              content += `**Recommended Items:**\n\n`;
              output.recommendations.items.forEach((item, index) => {
                content += `**${index + 1}. ${this.toSimpleText(item.title)}**\n`;
                content += `- **Description:** ${this.toSimpleText(item.description)}\n`;
                content += `- **Category:** ${this.toSimpleText(item.category)}\n`;
                content += `- **Priority:** ${this.toSimpleText(item.priority)}\n`;
                content += `- **Confidence:** ${Math.round((item.confidence || 0) * 100)}%\n`;
                if (item.reasoning) {
                  content += `- **Reasoning:** ${this.toSimpleText(item.reasoning)}\n`;
                }
                content += `\n`;
              });
            }
            if (output.recommendations.nextSteps) {
              content += `**Next Steps:**\n`;
              output.recommendations.nextSteps.forEach((step, index) => {
                content += `${index + 1}. ${this.toSimpleText(step)}\n`;
              });
            }
          } else if (output.summary) {
            // Handle both string and object summary formats
            let summaryText = '';
            if (typeof output.summary === 'string') {
              summaryText = output.summary;
            } else if (typeof output.summary === 'object' && output.summary !== null) {
              if (output.summary.summary) {
                summaryText = output.summary.summary;
              } else if (output.summary.content) {
                summaryText = output.summary.content;
              } else if (output.summary.text) {
                summaryText = output.summary.text;
              } else {
                const summaryObj = output.summary;
                const availableFields = Object.keys(summaryObj).filter(key => 
                  typeof summaryObj[key] === 'string' && summaryObj[key].length > 0
                );
                if (availableFields.length > 0) {
                  summaryText = summaryObj[availableFields[0]];
                }
              }
            }
            
            if (summaryText) {
              content += `### Recommendation Summary\n\n${summaryText}\n\n`;
            } else {
              content += `### Recommendation Summary\n\nThe recommender agent has processed the input and generated personalized recommendations based on the data analysis. The recommendations are tailored to the specific context and requirements identified in the input.\n\n`;
            }
          } else {
            content += `The recommender agent has processed the input and generated personalized recommendations based on the data analysis. The recommendations are tailored to the specific context and requirements identified in the input. See the structured data section for detailed results.\n\n`;
          }
          break;

        default:
          // Generic formatting for unknown agent types
          content += `The agent has processed the input and generated results. The analysis provides valuable insights and information based on the provided data. See the structured data section for detailed information.\n\n`;
      }

      // Add fallback for any unexpected output structure
      if (content === `## ${agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis\n\n`) {
        // If no specific content was added, create a generic summary
        content += `The ${agentType.replace(/_/g, ' ')} agent has successfully processed the input data and generated comprehensive analysis results. The analysis includes detailed insights, patterns, and recommendations based on the provided information.\n\n`;
        
        // Try to extract any meaningful content from the output
        if (output && typeof output === 'object') {
          const outputKeys = Object.keys(output);
          if (outputKeys.length > 0) {
            content += `**Analysis Components:**\n`;
            outputKeys.forEach(key => {
              if (typeof output[key] === 'string' && output[key].length > 0) {
                content += `- **${key}:** ${output[key]}\n`;
              } else if (Array.isArray(output[key]) && output[key].length > 0) {
                content += `- **${key}:** ${output[key].length} items identified\n`;
              } else if (typeof output[key] === 'object' && output[key] !== null) {
                content += `- **${key}:** Complex data structure with ${Object.keys(output[key]).length} properties\n`;
              }
            });
            content += `\n`;
          }
        }
      }


      return content;
    }

    return `The ${agentType.replace(/_/g, ' ')} agent completed processing.`;
  }
}
