# Re-Zero Server

Backend API server for the Re-Zero AI Framework - a multi-modal, multi-agent AI system.

## Features

- **Multi-Agent Architecture**: Modular AI agents for different tasks
- **OpenAI Integration**: GPT-4 powered analysis and processing
- **MongoDB Database**: Scalable data storage with Mongoose ODM
- **JWT Authentication**: Secure user authentication
- **File Upload**: Support for multiple file types
- **Rate Limiting**: API protection and throttling
- **Comprehensive Testing**: Unit, integration, and E2E tests

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:4000`

### Environment Variables

Required environment variables in `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/rezero

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Data Ingestion
- `POST /api/v1/ingest` - Upload and process files

### Task Management
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

### Health Check
- `GET /health` - Server health status

## Architecture

```
src/
├── agents/           # AI Agent implementations
├── controllers/      # Request handlers
├── models/          # Database schemas
├── routes/          # API routes
├── services/        # Business logic
├── tests/           # Test files
└── utils/           # Utility functions
```

## Testing

Run the test suite:

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage
```

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Run `npm start`

## License

MIT
