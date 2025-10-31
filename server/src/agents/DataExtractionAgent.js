import { BaseAgent } from './BaseAgent.js';
import logger from '../utils/logger.js';

export class DataExtractionAgent extends BaseAgent {
  constructor(options = {}) {
    super('data_extraction', options);
  }

  async process(input, parameters = {}) {
    this.validateParameters(parameters, ['extractionType']);

    const { extractionType = 'general', includeMetadata = true } = parameters;

    logger.info('Starting data extraction', {
      extractionType,
      inputLength: input.length
    });

    let extractedData;

    switch (extractionType) {
      case 'tables':
        extractedData = await this.extractTables(input);
        break;
      case 'entities':
        extractedData = await this.extractEntities(input);
        break;
      case 'structured':
        extractedData = await this.extractStructuredData(input);
        break;
      case 'financial':
        extractedData = await this.extractFinancialData(input);
        break;
      default:
        extractedData = await this.extractGeneralData(input);
    }

    const result = {
      extractionType,
      extractedData,
      metadata: includeMetadata ? {
        inputLength: input.length,
        extractionTimestamp: new Date().toISOString(),
        confidence: extractedData.confidence || 0.8
      } : undefined
    };

    return result;
  }

  async extractTables(input) {
    const prompt = `Extract all tables from the following text. Return structured data with table headers, rows, and metadata.

Text: ${input}

Return JSON with this structure:
{
  "tables": [
    {
      "title": "Table title or description",
      "headers": ["col1", "col2", "col3"],
      "rows": [
        ["value1", "value2", "value3"],
        ["value4", "value5", "value6"]
      ],
      "metadata": {
        "rowCount": 2,
        "columnCount": 3,
        "confidence": 0.9
      }
    }
  ],
  "summary": "Brief description of extracted tables"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              headers: { type: 'array', items: { type: 'string' } },
              rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
              metadata: { type: 'object' }
            }
          }
        },
        summary: { type: 'string' }
      }
    });
  }

  async extractEntities(input) {
    const prompt = `Extract named entities from the following text. Identify people, organizations, locations, dates, monetary amounts, and other important entities.

Text: ${input}

Return JSON with this structure:
{
  "entities": {
    "people": ["John Doe", "Jane Smith"],
    "organizations": ["Apple Inc", "Microsoft Corp"],
    "locations": ["New York", "California"],
    "dates": ["2024-01-15", "Q1 2024"],
    "monetary": ["$1,000,000", "€500,000"],
    "other": ["Project Alpha", "Contract #12345"]
  },
  "confidence": 0.85,
  "summary": "Brief summary of extracted entities"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        entities: {
          type: 'object',
          properties: {
            people: { type: 'array', items: { type: 'string' } },
            organizations: { type: 'array', items: { type: 'string' } },
            locations: { type: 'array', items: { type: 'string' } },
            dates: { type: 'array', items: { type: 'string' } },
            monetary: { type: 'array', items: { type: 'string' } },
            other: { type: 'array', items: { type: 'string' } }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' }
      }
    });
  }

  async extractStructuredData(input) {
    const prompt = `Extract structured data from the following text. Identify key-value pairs, lists, and hierarchical information.

Text: ${input}

Return JSON with this structure:
{
  "structuredData": {
    "keyValuePairs": {
      "key1": "value1",
      "key2": "value2"
    },
    "lists": {
      "items": ["item1", "item2", "item3"],
      "categories": ["cat1", "cat2"]
    },
    "hierarchical": {
      "section1": {
        "subsection1": "content1",
        "subsection2": "content2"
      }
    }
  },
  "confidence": 0.8,
  "summary": "Brief description of extracted structured data"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        structuredData: {
          type: 'object',
          properties: {
            keyValuePairs: { type: 'object' },
            lists: { type: 'object' },
            hierarchical: { type: 'object' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' }
      }
    });
  }

  async extractFinancialData(input) {
    const prompt = `Extract financial data from the following text. Identify revenue, expenses, profits, ratios, and other financial metrics.

Text: ${input}

Return JSON with this structure:
{
  "financialData": {
    "revenue": {
      "total": "$1,000,000",
      "breakdown": {
        "product_sales": "$800,000",
        "services": "$200,000"
      }
    },
    "expenses": {
      "total": "$750,000",
      "breakdown": {
        "operating": "$500,000",
        "administrative": "$250,000"
      }
    },
    "metrics": {
      "gross_profit": "$200,000",
      "net_profit": "$150,000",
      "profit_margin": "15%"
    },
    "ratios": {
      "debt_to_equity": "0.5",
      "current_ratio": "2.1"
    }
  },
  "confidence": 0.85,
  "summary": "Financial data extraction summary"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        financialData: {
          type: 'object',
          properties: {
            revenue: { type: 'object' },
            expenses: { type: 'object' },
            metrics: { type: 'object' },
            ratios: { type: 'object' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' }
      }
    });
  }

  async extractGeneralData(input) {
    const prompt = `Extract all relevant data from the following text. Identify key information, facts, figures, and important details.

Text: ${input}

Return JSON with this structure:
{
  "extractedData": {
    "keyFacts": ["fact1", "fact2", "fact3"],
    "numbers": ["100", "25%", "$50,000"],
    "dates": ["2024-01-15", "Q1 2024"],
    "categories": ["category1", "category2"],
    "relationships": [
      {
        "subject": "A",
        "relation": "relates to",
        "object": "B"
      }
    ]
  },
  "confidence": 0.8,
  "summary": "General data extraction summary"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        extractedData: {
          type: 'object',
          properties: {
            keyFacts: { type: 'array', items: { type: 'string' } },
            numbers: { type: 'array', items: { type: 'string' } },
            dates: { type: 'array', items: { type: 'string' } },
            categories: { type: 'array', items: { type: 'string' } },
            relationships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subject: { type: 'string' },
                  relation: { type: 'string' },
                  object: { type: 'string' }
                }
              }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' }
      }
    });
  }

  getCapabilities() {
    return {
      ...super.getCapabilities(),
      extractionTypes: ['tables', 'entities', 'structured', 'financial', 'general'],
      supportedFormats: ['text', 'html', 'markdown', 'csv'],
      maxInputSize: 50000
    };
  }
}
