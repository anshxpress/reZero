# Re-Zero AI Framework

A comprehensive multi-modal, multi-agent AI framework designed for intelligent data processing, analysis, and insights generation. Built with modern web technologies, Re-Zero leverages specialized AI agents powered by OpenAI to transform raw data into actionable business intelligence.

## 🎯 What is Re-Zero?

Re-Zero is an enterprise-grade AI platform that processes various types of data through a sophisticated multi-agent system. Whether you're analyzing financial reports, summarizing news articles, extracting structured data from documents, or generating strategic recommendations, Re-Zero provides intelligent automation and insights.

### How It Works

1. **Data Ingestion**: Upload text files, PDFs, URLs, or paste content directly
2. **Agent Selection**: Choose from specialized AI agents based on your analysis needs
3. **Intelligent Processing**: Agents work independently or collaboratively to analyze your data
4. **Results & Insights**: Get structured results, visualizations, and actionable recommendations
5. **Task Management**: Track progress, view results, and manage your analysis pipeline

### Key Use Cases

- **Financial Analysis**: Analyze company financials, calculate ratios, assess risk
- **Document Processing**: Extract structured data from PDFs, reports, and documents
- **News Intelligence**: Summarize articles, analyze sentiment, track trends
- **Strategic Planning**: Generate recommendations, compare options, scenario analysis
- **Data Extraction**: Parse tables, entities, and key-value pairs from unstructured data

## 🚀 Features

### Core Capabilities
- **Multi-Agent Architecture**: 5 specialized AI agents for different analytical tasks
- **Real-time Processing**: Asynchronous task processing with live status updates
- **Multi-format Data Ingestion**: Support for text, URLs, PDFs, and file uploads
- **Intelligent Analysis**: Advanced data extraction, analysis, and insights generation
- **Modern Web Interface**: Responsive React frontend with intuitive user experience
- **Secure Authentication**: JWT-based user management with role-based access
- **Comprehensive Testing**: Unit, integration, and end-to-end test coverage

### Available AI Agents

1. **Data Extraction Agent** 📊
   - Extracts structured data from unstructured text, PDFs, and documents
   - Parses tables, entities, key-value pairs, and financial data
   - Supports multiple extraction types: general, tables, entities, structured, financial
   - Returns JSON-formatted data ready for further analysis

2. **Financial Analysis Agent** 💰
   - Performs comprehensive financial ratio analysis and calculations
   - Conducts trend analysis, forecasting, and risk assessment
   - Provides valuation models and investment recommendations
   - Supports various analysis types: comprehensive, ratios, trends, risk, valuation

3. **News Summarization Agent** 📰
   - Summarizes news articles, reports, and long-form content
   - Performs sentiment analysis and extracts key insights
   - Generates executive summaries and actionable recommendations
   - Supports multiple summary types: comprehensive, brief, detailed, executive

4. **Analyst Support Agent** 🎯
   - Provides comparative analysis and pros/cons evaluation
   - Conducts scenario analysis and sensitivity testing
   - Generates strategic recommendations and decision support
   - Offers multi-perspective analysis for complex business decisions

5. **Recommender Agent** 🔍
   - Creates personalized recommendations based on data patterns
   - Implements content-based and collaborative filtering algorithms
   - Provides hybrid recommendation systems for various use cases
   - Generates actionable suggestions and next steps

## 🔄 Data Processing Workflow

### Step-by-Step Process

1. **Upload & Ingest Data**
   ```
   User uploads file/URL → System validates → Content extracted → Stored in MongoDB
   ```

2. **Create Analysis Task**
   ```
   Select agents → Configure parameters → Task queued → Processing begins
   ```

3. **Agent Processing**
   ```
   Each agent processes data independently → OpenAI API calls → Results generated
   ```

4. **Result Aggregation**
   ```
   Individual results collected → Meta-agent coordination → Final output generated
   ```

5. **Delivery & Visualization**
   ```
   Results stored → Frontend updates → User views insights → Download/export available
   ```

### Agent Collaboration

- **Independent Processing**: Each agent works on the same data independently
- **Meta-Agent Coordination**: Orchestrates multiple agents for complex analysis
- **Result Synthesis**: Combines outputs from multiple agents for comprehensive insights
- **Quality Assurance**: Built-in validation and error handling for reliable results

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB       │
│                 │◄──►│                 │◄──►│                 │
│  - Dashboard    │    │  - REST API     │    │  - Users        │
│  - Upload       │    │  - Auth         │    │  - Tasks        │
│  - Tasks        │    │  - Agents       │    │  - Results      │
│  - Reports      │    │  - Meta-Agent   │    │  - Audit Logs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │                 │
                       │  - GPT Models   │
                       │  - Embeddings   │
                       │  - Retry Logic  │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **OpenAI API** for AI capabilities
- **JWT** for authentication
- **Jest** for testing
- **Winston** for logging

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **React Query** for data fetching
- **Tailwind CSS** for styling
- **React Hook Form** for forms
- **Cypress** for E2E testing

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6.0+
- OpenAI API key
- Git

## 🚀 Quick Start

> **📖 For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md)**
> **🚀 For production deployment (Render/Vercel/Docker), see [DEPLOYMENT.md](DEPLOYMENT.md)**

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB 6.0+** - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **OpenAI API Key** - [Get your key here](https://platform.openai.com/api-keys)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd re-zero
```

### 2. Environment Setup

Create environment files for both client and server:

```bash
# Server environment
cp server/.env.example server/.env

# Client environment  
cp client/.env.example client/.env
```

Configure your environment variables (see [INSTALLATION.md](INSTALLATION.md) for details).

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Start MongoDB

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Or using local installation
mongod
```

### 5. Start the Application

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Start the client
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

### First Steps

1. **Register** a new account at http://localhost:3000/register
2. **Login** to access the dashboard
3. **Upload** a document or paste text content
4. **Select** AI agents for analysis
5. **View** results and insights

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Backend Tests

```bash
cd server
npm test              # Unit tests
npm run test:coverage # With coverage
npm run lint          # Linting
```

### Frontend Tests

```bash
cd client
npm test              # Unit tests
npm run test:coverage # With coverage
npm run lint          # Linting
```

### E2E Tests

```bash
npm run test:e2e      # Run E2E tests
```

## 📚 API Documentation

### Authentication Endpoints

```bash
# Register
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Login
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Get Profile
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

### Data Ingestion

```bash
# Upload Text
POST /api/v1/ingest
{
  "type": "text",
  "content": "Your text content here",
  "metadata": {
    "title": "Document Title"
  }
}

# Upload URL
POST /api/v1/ingest
{
  "type": "url",
  "content": "https://example.com/article"
}

# Upload File
POST /api/v1/ingest/upload
Content-Type: multipart/form-data
file: <file>
```

### Task Management

```bash
# Create Task
POST /api/v1/tasks
{
  "ingestId": "ingest_id",
  "name": "Analysis Task",
  "selectedAgents": ["data_extraction", "financial_analysis"],
  "parameters": {}
}

# Get Task
GET /api/v1/tasks/:id

# List Tasks
GET /api/v1/tasks?status=completed&priority=high

# Get Available Agents
GET /api/v1/tasks/agents/available
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rezero` |
| `PORT` | Server port | `4000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `NODE_ENV` | Environment mode | `development` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Agent Configuration

Each agent can be configured with custom parameters:

```javascript
{
  "data_extraction": {
    "extractionType": "general", // general, tables, entities, structured, financial
    "includeMetadata": true
  },
  "financial_analysis": {
    "analysisType": "comprehensive", // comprehensive, ratios, trends, risk, valuation
    "includeProjections": true,
    "riskAssessment": true
  },
  "news_summarization": {
    "summaryType": "comprehensive", // comprehensive, brief, detailed, executive
    "includeSentiment": true,
    "maxLength": 500
  }
}
```

## 🚀 Deployment

### Production Build

```bash
# Build client
cd client
npm run build

# Start server in production
cd server
NODE_ENV=production npm start
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN cd client && npm run build

EXPOSE 4000
CMD ["npm", "start"]
```

### Environment Setup

1. Set up MongoDB cluster
2. Configure environment variables
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up monitoring and logging

## 🔒 Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- File upload restrictions
- Environment variable protection

## 📊 Monitoring

- Winston logging with multiple transports
- Request/response logging
- Error tracking and reporting
- Performance monitoring
- Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure model is available

3. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing processes
   - Use different ports for dev/prod

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the API documentation
- Check server logs for detailed error messages
- Ensure all dependencies are installed correctly

## 🗺️ Roadmap

- [ ] Redis integration for job queues
- [ ] Additional AI model providers
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom agents
- [ ] Multi-tenant support
- [ ] API rate limiting per user
- [ ] Advanced caching strategies

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- The React and Node.js communities
- MongoDB for the database solution
- All contributors and testers

---

**Re-Zero AI Framework** - Empowering intelligent data processing with multi-agent AI systems.
