import { BaseAgent } from './BaseAgent.js';
import logger from '../utils/logger.js';

export class FinancialAnalysisAgent extends BaseAgent {
  constructor(options = {}) {
    super('financial_analysis', options);
  }

  async process(input, parameters = {}) {
    this.validateParameters(parameters, ['analysisType']);

    const { 
      analysisType = 'comprehensive',
      includeProjections = false,
      riskAssessment = true,
      benchmarkComparison = false
    } = parameters;

    logger.info('Starting financial analysis', {
      analysisType,
      inputLength: input.length
    });

    let analysis;

    switch (analysisType) {
      case 'ratios':
        analysis = await this.analyzeRatios(input);
        break;
      case 'trends':
        analysis = await this.analyzeTrends(input);
        break;
      case 'risk':
        analysis = await this.analyzeRisk(input);
        break;
      case 'valuation':
        analysis = await this.analyzeValuation(input);
        break;
      default:
        analysis = await this.analyzeComprehensive(input, {
          includeProjections,
          riskAssessment,
          benchmarkComparison
        });
    }

    const result = {
      analysisType,
      analysis,
      metadata: {
        inputLength: input.length,
        analysisTimestamp: new Date().toISOString(),
        confidence: analysis.confidence || 0.8
      }
    };

    return result;
  }

  async analyzeComprehensive(input, options = {}) {
    const prompt = `Perform a comprehensive financial analysis of the following data. Include financial ratios, trends, risk assessment, and recommendations.

Data: ${input}

Options: ${JSON.stringify(options)}

Return JSON with this structure:
{
  "financialRatios": {
    "liquidity": {
      "current_ratio": 2.1,
      "quick_ratio": 1.5,
      "cash_ratio": 0.8
    },
    "profitability": {
      "gross_margin": 0.35,
      "operating_margin": 0.20,
      "net_margin": 0.15,
      "roa": 0.12,
      "roe": 0.18
    },
    "leverage": {
      "debt_to_equity": 0.5,
      "debt_to_assets": 0.3,
      "interest_coverage": 4.2
    },
    "efficiency": {
      "asset_turnover": 1.2,
      "inventory_turnover": 6.5,
      "receivables_turnover": 8.1
    }
  },
  "trendAnalysis": {
    "revenue_growth": 0.15,
    "profit_growth": 0.20,
    "trend_direction": "positive",
    "key_trends": ["Revenue growth accelerating", "Margin improvement"]
  },
  "riskAssessment": {
    "overall_risk": "medium",
    "financial_risk": "low",
    "operational_risk": "medium",
    "market_risk": "high",
    "risk_factors": ["Market volatility", "Competition"]
  },
  "projections": {
    "next_year_revenue": 1200000,
    "next_year_profit": 180000,
    "growth_rate": 0.15,
    "confidence": 0.75
  },
  "recommendations": [
    "Improve working capital management",
    "Consider debt restructuring",
    "Focus on margin expansion"
  ],
  "confidence": 0.85,
  "summary": "Comprehensive financial analysis summary"
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        financialRatios: {
          type: 'object',
          properties: {
            liquidity: { type: 'object' },
            profitability: { type: 'object' },
            leverage: { type: 'object' },
            efficiency: { type: 'object' }
          }
        },
        trendAnalysis: { type: 'object' },
        riskAssessment: { type: 'object' },
        projections: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        summary: { type: 'string' }
      }
    });
  }

  async analyzeRatios(input) {
    const prompt = `Calculate and analyze financial ratios from the following data.

Data: ${input}

Return JSON with this structure:
{
  "ratios": {
    "liquidity": {
      "current_ratio": 2.1,
      "quick_ratio": 1.5,
      "cash_ratio": 0.8,
      "interpretation": "Strong liquidity position"
    },
    "profitability": {
      "gross_margin": 0.35,
      "operating_margin": 0.20,
      "net_margin": 0.15,
      "interpretation": "Healthy profit margins"
    },
    "leverage": {
      "debt_to_equity": 0.5,
      "debt_to_assets": 0.3,
      "interest_coverage": 4.2,
      "interpretation": "Conservative leverage"
    },
    "efficiency": {
      "asset_turnover": 1.2,
      "inventory_turnover": 6.5,
      "receivables_turnover": 8.1,
      "interpretation": "Good asset utilization"
    }
  },
  "overall_assessment": "Strong financial position with room for improvement",
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        ratios: {
          type: 'object',
          properties: {
            liquidity: { type: 'object' },
            profitability: { type: 'object' },
            leverage: { type: 'object' },
            efficiency: { type: 'object' }
          }
        },
        overall_assessment: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async analyzeTrends(input) {
    const prompt = `Analyze financial trends and patterns from the following data.

Data: ${input}

Return JSON with this structure:
{
  "trends": {
    "revenue": {
      "direction": "increasing",
      "growth_rate": 0.15,
      "volatility": "low",
      "seasonality": "moderate"
    },
    "profitability": {
      "direction": "improving",
      "margin_trend": "positive",
      "consistency": "high"
    },
    "efficiency": {
      "asset_utilization": "improving",
      "cost_management": "effective",
      "productivity": "increasing"
    }
  },
  "key_insights": [
    "Revenue growth accelerating",
    "Margin expansion trend",
    "Cost control improving"
  ],
  "forecast": {
    "next_quarter": "positive",
    "next_year": "strong_growth",
    "confidence": 0.75
  },
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        trends: {
          type: 'object',
          properties: {
            revenue: { type: 'object' },
            profitability: { type: 'object' },
            efficiency: { type: 'object' }
          }
        },
        key_insights: { type: 'array', items: { type: 'string' } },
        forecast: { type: 'object' },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async analyzeRisk(input) {
    const prompt = `Assess financial risks from the following data.

Data: ${input}

Return JSON with this structure:
{
  "risk_factors": {
    "credit_risk": {
      "level": "low",
      "factors": ["Strong cash position", "Low debt levels"],
      "mitigation": ["Maintain current practices"]
    },
    "liquidity_risk": {
      "level": "low",
      "factors": ["High current ratio", "Strong cash flow"],
      "mitigation": ["Continue monitoring"]
    },
    "market_risk": {
      "level": "medium",
      "factors": ["Market volatility", "Competition"],
      "mitigation": ["Diversification", "Hedging strategies"]
    },
    "operational_risk": {
      "level": "medium",
      "factors": ["Dependency on key customers", "Supply chain"],
      "mitigation": ["Customer diversification", "Supplier backup"]
    }
  },
  "overall_risk_level": "medium",
  "risk_score": 6.5,
  "recommendations": [
    "Implement hedging strategies",
    "Diversify customer base",
    "Strengthen supply chain"
  ],
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        risk_factors: {
          type: 'object',
          properties: {
            credit_risk: { type: 'object' },
            liquidity_risk: { type: 'object' },
            market_risk: { type: 'object' },
            operational_risk: { type: 'object' }
          }
        },
        overall_risk_level: { type: 'string' },
        risk_score: { type: 'number', minimum: 0, maximum: 10 },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async analyzeValuation(input) {
    const prompt = `Perform valuation analysis on the following financial data.

Data: ${input}

Return JSON with this structure:
{
  "valuation_methods": {
    "dcf": {
      "value": 1500000,
      "assumptions": {
        "growth_rate": 0.10,
        "discount_rate": 0.12,
        "terminal_growth": 0.03
      },
      "confidence": 0.7
    },
    "comparable": {
      "value": 1400000,
      "multiples": {
        "pe_ratio": 15,
        "pb_ratio": 2.5,
        "ps_ratio": 3.0
      },
      "confidence": 0.8
    },
    "asset_based": {
      "value": 1200000,
      "book_value": 1000000,
      "adjustments": 200000,
      "confidence": 0.9
    }
  },
  "fair_value_range": {
    "low": 1200000,
    "high": 1500000,
    "mid": 1350000
  },
  "valuation_summary": "Company appears fairly valued with slight upside potential",
  "confidence": 0.75
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        valuation_methods: {
          type: 'object',
          properties: {
            dcf: { type: 'object' },
            comparable: { type: 'object' },
            asset_based: { type: 'object' }
          }
        },
        fair_value_range: { type: 'object' },
        valuation_summary: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  getCapabilities() {
    return {
      ...super.getCapabilities(),
      analysisTypes: ['comprehensive', 'ratios', 'trends', 'risk', 'valuation'],
      supportedDataTypes: ['financial_statements', 'csv', 'json', 'text'],
      maxInputSize: 100000
    };
  }
}
