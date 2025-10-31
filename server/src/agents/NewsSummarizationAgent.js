import { BaseAgent } from './BaseAgent.js';
import logger from '../utils/logger.js';

export class NewsSummarizationAgent extends BaseAgent {
  constructor(options = {}) {
    super('news_summarization', options);
  }

  async process(input, parameters = {}) {
    this.validateParameters(parameters, ['summaryType']);

    const { 
      summaryType = 'comprehensive',
      includeSentiment = true,
      includeKeyPoints = true,
      includeTimeline = false,
      maxLength = 500
    } = parameters;

    logger.info('Starting news summarization', {
      summaryType,
      inputLength: input.length
    });

    let summary;

    switch (summaryType) {
      case 'brief':
        summary = await this.generateBriefSummary(input, { maxLength });
        break;
      case 'detailed':
        summary = await this.generateDetailedSummary(input, { 
          includeSentiment, 
          includeKeyPoints, 
          includeTimeline 
        });
        break;
      case 'executive':
        summary = await this.generateExecutiveSummary(input);
        break;
      default:
        summary = await this.generateComprehensiveSummary(input, {
          includeSentiment,
          includeKeyPoints,
          includeTimeline,
          maxLength
        });
    }

    const result = {
      summaryType,
      summary,
      metadata: {
        inputLength: input.length,
        summaryLength: summary.summary?.length || 0,
        summarizationTimestamp: new Date().toISOString(),
        confidence: summary.confidence || 0.8
      }
    };

    return result;
  }

  async generateComprehensiveSummary(input, options = {}) {
    const prompt = `Create a comprehensive news summary from the following content. Include key points, sentiment analysis, and important details.

Content: ${input}

Options: ${JSON.stringify(options)}

Return JSON with this structure:
{
  "summary": "Comprehensive summary of the news content...",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "sentiment": {
    "overall": "positive",
    "score": 0.7,
    "breakdown": {
      "positive": 0.6,
      "neutral": 0.3,
      "negative": 0.1
    }
  },
  "entities": {
    "people": ["Person A", "Person B"],
    "organizations": ["Company X", "Government Y"],
    "locations": ["City A", "Country B"],
    "topics": ["Topic 1", "Topic 2"]
  },
  "timeline": [
    {
      "date": "2024-01-15",
      "event": "Event description",
      "significance": "high"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "reliability": "high"
    }
  ],
  "confidence": 0.85,
  "wordCount": 250
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        sentiment: {
          type: 'object',
          properties: {
            overall: { type: 'string' },
            score: { type: 'number', minimum: -1, maximum: 1 },
            breakdown: { type: 'object' }
          }
        },
        entities: {
          type: 'object',
          properties: {
            people: { type: 'array', items: { type: 'string' } },
            organizations: { type: 'array', items: { type: 'string' } },
            locations: { type: 'array', items: { type: 'string' } },
            topics: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              event: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        wordCount: { type: 'number' }
      }
    });
  }

  async generateBriefSummary(input, options = {}) {
    const prompt = `Create a brief, concise summary of the following news content. Keep it under ${options.maxLength || 200} words.

Content: ${input}

Return JSON with this structure:
{
  "summary": "Brief summary of the news...",
  "headline": "Main headline or title",
  "keyTakeaway": "Most important takeaway",
  "confidence": 0.8,
  "wordCount": 150
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        headline: { type: 'string' },
        keyTakeaway: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        wordCount: { type: 'number' }
      }
    });
  }

  async generateDetailedSummary(input, options = {}) {
    const prompt = `Create a detailed news summary with analysis from the following content.

Content: ${input}

Options: ${JSON.stringify(options)}

Return JSON with this structure:
{
  "summary": "Detailed summary with analysis...",
  "analysis": {
    "implications": ["Implication 1", "Implication 2"],
    "stakeholders": ["Stakeholder 1", "Stakeholder 2"],
    "impact": "high|medium|low",
    "urgency": "high|medium|low"
  },
  "keyPoints": [
    "Detailed key point 1",
    "Detailed key point 2"
  ],
  "sentiment": {
    "overall": "positive|negative|neutral",
    "score": 0.7,
    "analysis": "Sentiment analysis explanation"
  },
  "context": {
    "background": "Background information",
    "related_events": ["Related event 1", "Related event 2"],
    "historical_precedent": "Historical context"
  },
  "confidence": 0.85,
  "wordCount": 400
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        analysis: {
          type: 'object',
          properties: {
            implications: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } },
            impact: { type: 'string' },
            urgency: { type: 'string' }
          }
        },
        keyPoints: { type: 'array', items: { type: 'string' } },
        sentiment: {
          type: 'object',
          properties: {
            overall: { type: 'string' },
            score: { type: 'number', minimum: -1, maximum: 1 },
            analysis: { type: 'string' }
          }
        },
        context: {
          type: 'object',
          properties: {
            background: { type: 'string' },
            related_events: { type: 'array', items: { type: 'string' } },
            historical_precedent: { type: 'string' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        wordCount: { type: 'number' }
      }
    });
  }

  async generateExecutiveSummary(input) {
    const prompt = `Create an executive summary of the following news content. Focus on strategic implications and decision-making insights.

Content: ${input}

Return JSON with this structure:
{
  "executiveSummary": "High-level executive summary...",
  "strategicImplications": [
    "Strategic implication 1",
    "Strategic implication 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "riskAssessment": {
    "level": "high|medium|low",
    "factors": ["Risk factor 1", "Risk factor 2"],
    "mitigation": ["Mitigation strategy 1"]
  },
  "opportunities": [
    "Opportunity 1",
    "Opportunity 2"
  ],
  "nextSteps": [
    "Next step 1",
    "Next step 2"
  ],
  "confidence": 0.9,
  "wordCount": 300
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        strategicImplications: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        riskAssessment: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            factors: { type: 'array', items: { type: 'string' } },
            mitigation: { type: 'array', items: { type: 'string' } }
          }
        },
        opportunities: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        wordCount: { type: 'number' }
      }
    });
  }

  getCapabilities() {
    return {
      ...super.getCapabilities(),
      summaryTypes: ['comprehensive', 'brief', 'detailed', 'executive'],
      supportedContentTypes: ['news', 'articles', 'reports', 'text'],
      maxInputSize: 200000,
      supportedLanguages: ['en', 'es', 'fr', 'de']
    };
  }
}
