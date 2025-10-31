import { BaseAgent } from './BaseAgent.js';
import logger from '../utils/logger.js';

export class AnalystSupportAgent extends BaseAgent {
  constructor(options = {}) {
    super('analyst_support', options);
  }

  async process(input, parameters = {}) {
    this.validateParameters(parameters, ['analysisType']);

    const { 
      analysisType = 'comparative',
      includeBenchmarks = true,
      includeRecommendations = true,
      includeRiskAssessment = true
    } = parameters;

    logger.info('Starting analyst support analysis', {
      analysisType,
      inputLength: input.length
    });

    let analysis;

    switch (analysisType) {
      case 'comparative':
        analysis = await this.performComparativeAnalysis(input, {
          includeBenchmarks,
          includeRecommendations
        });
        break;
      case 'pros_cons':
        analysis = await this.performProsConsAnalysis(input);
        break;
      case 'scenario':
        analysis = await this.performScenarioAnalysis(input);
        break;
      case 'sensitivity':
        analysis = await this.performSensitivityAnalysis(input);
        break;
      default:
        analysis = await this.performComprehensiveAnalysis(input, {
          includeBenchmarks,
          includeRecommendations,
          includeRiskAssessment
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

  async performComprehensiveAnalysis(input, options = {}) {
    const prompt = `Perform a comprehensive analyst support analysis of the following data. Include comparative analysis, pros/cons, scenarios, and recommendations.

Data: ${input}

Options: ${JSON.stringify(options)}

Return JSON with this structure:
{
  "executiveSummary": "High-level summary of the analysis...",
  "comparativeAnalysis": {
    "alternatives": [
      {
        "name": "Option A",
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Con 1", "Con 2"],
        "score": 8.5,
        "recommendation": "strong_buy|buy|hold|sell|strong_sell"
      }
    ],
    "benchmarks": {
      "industry_average": 7.0,
      "market_leader": 9.2,
      "competitor_analysis": "Analysis of competitors"
    }
  },
  "scenarioAnalysis": {
    "base_case": {
      "probability": 0.6,
      "outcome": "Expected outcome description",
      "value": 1000000
    },
    "optimistic": {
      "probability": 0.2,
      "outcome": "Best case scenario",
      "value": 1500000
    },
    "pessimistic": {
      "probability": 0.2,
      "outcome": "Worst case scenario",
      "value": 500000
    }
  },
  "riskAssessment": {
    "overall_risk": "medium",
    "key_risks": [
      {
        "risk": "Market volatility",
        "impact": "high",
        "probability": "medium",
        "mitigation": "Diversification strategy"
      }
    ],
    "risk_score": 6.5
  },
  "recommendations": [
    {
      "action": "Implement strategy A",
      "priority": "high",
      "timeline": "Q1 2024",
      "expected_impact": "positive",
      "confidence": 0.8
    }
  ],
  "keyInsights": [
    "Key insight 1",
    "Key insight 2"
  ],
  "confidence": 0.85
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        executiveSummary: { type: 'string' },
        comparativeAnalysis: {
          type: 'object',
          properties: {
            alternatives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  pros: { type: 'array', items: { type: 'string' } },
                  cons: { type: 'array', items: { type: 'string' } },
                  score: { type: 'number', minimum: 0, maximum: 10 },
                  recommendation: { type: 'string' }
                }
              }
            },
            benchmarks: { type: 'object' }
          }
        },
        scenarioAnalysis: {
          type: 'object',
          properties: {
            base_case: { type: 'object' },
            optimistic: { type: 'object' },
            pessimistic: { type: 'object' }
          }
        },
        riskAssessment: {
          type: 'object',
          properties: {
            overall_risk: { type: 'string' },
            key_risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  impact: { type: 'string' },
                  probability: { type: 'string' },
                  mitigation: { type: 'string' }
                }
              }
            },
            risk_score: { type: 'number', minimum: 0, maximum: 10 }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string' },
              timeline: { type: 'string' },
              expected_impact: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async performComparativeAnalysis(input, options = {}) {
    const prompt = `Perform a comparative analysis of the following data. Compare different options, alternatives, or approaches.

Data: ${input}

Options: ${JSON.stringify(options)}

Return JSON with this structure:
{
  "comparison": {
    "criteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
    "alternatives": [
      {
        "name": "Option A",
        "scores": [8, 7, 9],
        "weighted_score": 8.0,
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"]
      }
    ],
    "winner": "Option A",
    "margin": 1.5
  },
  "benchmarks": {
    "industry_standard": 7.0,
    "best_practice": 9.0,
    "performance_gap": 1.0
  },
  "recommendations": [
    "Recommendation based on comparison",
    "Next steps for improvement"
  ],
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        comparison: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            alternatives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  scores: { type: 'array', items: { type: 'number' } },
                  weighted_score: { type: 'number' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            winner: { type: 'string' },
            margin: { type: 'number' }
          }
        },
        benchmarks: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async performProsConsAnalysis(input) {
    const prompt = `Perform a pros and cons analysis of the following data. Identify advantages, disadvantages, and trade-offs.

Data: ${input}

Return JSON with this structure:
{
  "prosCons": {
    "pros": [
      {
        "point": "Advantage 1",
        "impact": "high|medium|low",
        "certainty": "high|medium|low",
        "description": "Detailed description"
      }
    ],
    "cons": [
      {
        "point": "Disadvantage 1",
        "impact": "high|medium|low",
        "certainty": "high|medium|low",
        "description": "Detailed description"
      }
    ],
    "neutral": [
      {
        "point": "Neutral point 1",
        "description": "Description of neutral aspect"
      }
    ]
  },
  "tradeOffs": [
    {
      "trade_off": "Trade-off description",
      "pro_side": "Advantage side",
      "con_side": "Disadvantage side",
      "recommendation": "How to handle this trade-off"
    }
  ],
  "overallAssessment": {
    "net_positive": true,
    "confidence": 0.75,
    "summary": "Overall assessment summary"
  },
  "recommendations": [
    "Recommendation based on pros/cons analysis"
  ],
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        prosCons: {
          type: 'object',
          properties: {
            pros: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  point: { type: 'string' },
                  impact: { type: 'string' },
                  certainty: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            cons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  point: { type: 'string' },
                  impact: { type: 'string' },
                  certainty: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            neutral: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  point: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        tradeOffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trade_off: { type: 'string' },
              pro_side: { type: 'string' },
              con_side: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        overallAssessment: {
          type: 'object',
          properties: {
            net_positive: { type: 'boolean' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            summary: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async performScenarioAnalysis(input) {
    const prompt = `Perform scenario analysis on the following data. Create multiple scenarios with different assumptions and outcomes.

Data: ${input}

Return JSON with this structure:
{
  "scenarios": {
    "base_case": {
      "name": "Most Likely Scenario",
      "probability": 0.6,
      "assumptions": ["Assumption 1", "Assumption 2"],
      "outcome": "Expected outcome description",
      "value": 1000000,
      "confidence": 0.8
    },
    "optimistic": {
      "name": "Best Case Scenario",
      "probability": 0.2,
      "assumptions": ["Optimistic assumption 1", "Optimistic assumption 2"],
      "outcome": "Best case outcome",
      "value": 1500000,
      "confidence": 0.6
    },
    "pessimistic": {
      "name": "Worst Case Scenario",
      "probability": 0.2,
      "assumptions": ["Pessimistic assumption 1", "Pessimistic assumption 2"],
      "outcome": "Worst case outcome",
      "value": 500000,
      "confidence": 0.7
    }
  },
  "sensitivityAnalysis": {
    "key_variables": ["Variable 1", "Variable 2"],
    "impact_analysis": "Analysis of how variables affect outcomes"
  },
  "recommendations": [
    "Recommendation based on scenario analysis"
  ],
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        scenarios: {
          type: 'object',
          properties: {
            base_case: { type: 'object' },
            optimistic: { type: 'object' },
            pessimistic: { type: 'object' }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            key_variables: { type: 'array', items: { type: 'string' } },
            impact_analysis: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  async performSensitivityAnalysis(input) {
    const prompt = `Perform sensitivity analysis on the following data. Identify which variables have the most impact on outcomes.

Data: ${input}

Return JSON with this structure:
{
  "sensitivityAnalysis": {
    "key_variables": [
      {
        "variable": "Variable 1",
        "base_value": 100,
        "sensitivity": "high|medium|low",
        "impact_range": [80, 120],
        "description": "Description of variable impact"
      }
    ],
    "tornado_diagram": {
      "high_impact": ["Variable 1", "Variable 2"],
      "medium_impact": ["Variable 3"],
      "low_impact": ["Variable 4"]
    },
    "break_even_analysis": {
      "break_even_point": 150,
      "current_position": 120,
      "margin_of_safety": 0.2
    }
  },
  "recommendations": [
    "Focus on high-impact variables",
    "Monitor sensitive parameters"
  ],
  "confidence": 0.8
}`;

    return this.generateStructuredOutput(prompt, {
      type: 'object',
      properties: {
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            key_variables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  variable: { type: 'string' },
                  base_value: { type: 'number' },
                  sensitivity: { type: 'string' },
                  impact_range: { type: 'array', items: { type: 'number' } },
                  description: { type: 'string' }
                }
              }
            },
            tornado_diagram: { type: 'object' },
            break_even_analysis: { type: 'object' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    });
  }

  getCapabilities() {
    return {
      ...super.getCapabilities(),
      analysisTypes: ['comprehensive', 'comparative', 'pros_cons', 'scenario', 'sensitivity'],
      supportedDataTypes: ['financial', 'business', 'strategic', 'operational'],
      maxInputSize: 150000
    };
  }
}
