# Installation Guide - Re-Zero AI Framework

This guide provides detailed instructions for installing and setting up the Re-Zero AI Framework on your local machine or server.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
  - [Method 1: Local Development Setup](#method-1-local-development-setup)
  - [Method 2: Docker Setup](#method-2-docker-setup)
  - [Method 3: Production Deployment](#method-3-production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing Re-Zero, ensure you have the following installed on your system:

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| **Node.js** | 18.0+ | JavaScript runtime | [Download](https://nodejs.org/) |
| **MongoDB** | 6.0+ | Database | [Download](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |
| **npm** | 9.0+ | Package manager | (Included with Node.js) |

### Required Accounts

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **OpenAI** | AI processing | [Sign Up](https://platform.openai.com/api-keys) |

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 2 GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Recommended Requirements

- **CPU**: 4+ cores, 3.0+ GHz
- **RAM**: 8+ GB
- **Storage**: 10+ GB free space
- **OS**: Latest version of Windows, macOS, or Linux

## Installation Methods

### Method 1: Local Development Setup

This is the recommended method for development and testing.

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd re-zero

# Verify the project structure
ls -la
```

Expected structure:
```
re-zero/
├── client/          # React frontend
├── server/          # Node.js backend
├── test-files/      # Sample files for testing
├── README.md
└── INSTALLATION.md
```

#### Step 2: Install Server Dependencies

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Step 3: Install Client Dependencies

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Step 4: Set Up Environment Variables

Create environment files for both client and server:

```bash
# Create server environment file
cd ../server
cp .env.example .env

# Create client environment file
cd ../client
cp .env.example .env
```

#### Step 5: Configure Environment Variables

**Server Environment (`server/.env`):**

```env
# Server Configuration
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/rezero

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,txt,md,csv,json

# Logging
LOG_LEVEL=info
LOG_FILE=logs/combined.log
ERROR_LOG_FILE=logs/error.log
```

**Client Environment (`client/.env`):**

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Re-Zero AI Framework
VITE_APP_VERSION=1.0.0

# Development
VITE_NODE_ENV=development
```

#### Step 6: Start MongoDB

Choose one of the following options:

**Option A: Using Docker (Recommended)**

```bash
# Start MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:6.0

# Verify MongoDB is running
docker ps | grep mongodb
```

**Option B: Local Installation**

```bash
# Start MongoDB service
# On macOS with Homebrew:
brew services start mongodb-community

# On Ubuntu/Debian:
sudo systemctl start mongod

# On Windows:
net start MongoDB
```

**Option C: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `server/.env`

#### Step 7: Start the Application

**Terminal 1 - Start the Server:**

```bash
cd server
npm run dev
```

Expected output:
```
Server started successfully
MongoDB connected successfully
Server running on http://localhost:4000
```

**Terminal 2 - Start the Client:**

```bash
cd client
npm run dev
```

Expected output:
```
Local:   http://localhost:3000/
Network: http://192.168.x.x:3000/
```

#### Step 8: Verify Installation

1. **Check Server Health:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Check Client:**
   Open http://localhost:3000 in your browser

3. **Test API:**
   ```bash
   curl http://localhost:4000/api/v1/auth/register \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

### Method 2: Docker Setup

For containerized deployment using Docker Compose.

#### Step 1: Create Docker Compose File

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: rezero-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: rezero-server
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/rezero
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
    volumes:
      - ./server/logs:/app/logs

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: rezero-client
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:4000/api/v1
    depends_on:
      - server

volumes:
  mongodb_data:
```

#### Step 2: Create Dockerfiles

**Server Dockerfile (`server/Dockerfile`):**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
```

**Client Dockerfile (`client/Dockerfile`):**

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 3: Start with Docker Compose

```bash
# Create environment file
echo "OPENAI_API_KEY=your_key_here" > .env
echo "JWT_SECRET=your_secret_here" >> .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Method 3: Production Deployment

For production deployment on a server.

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd re-zero

# Install dependencies
cd server && npm ci --only=production
cd ../client && npm ci && npm run build

# Set up environment
cp server/.env.example server/.env
# Edit server/.env with production values
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/rezero`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client
    location / {
        root /path/to/re-zero/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rezero /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Start with PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'rezero-server',
    script: 'src/index.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `4000` | Yes |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/rezero` | Yes |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | Yes |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` | Yes |
| `CLIENT_URL` | Frontend URL | `http://localhost:3000` | Yes |

### Optional Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` | No |
| `JWT_EXPIRES_IN` | Token expiration | `7d` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `MAX_FILE_SIZE` | Max upload size | `10485760` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

## Database Setup

### MongoDB Configuration

#### Local MongoDB

```bash
# Start MongoDB
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

#### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Create database user
4. Whitelist your IP address
5. Get connection string
6. Update `MONGODB_URI` in environment

### Database Initialization

The application will automatically create the necessary collections on first run:

- `users` - User accounts and authentication
- `ingests` - Uploaded data and content
- `tasks` - Analysis tasks and jobs
- `agentresults` - Agent processing results
- `auditlogs` - System audit trail

## Verification

### Health Checks

1. **Server Health:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Database Connection:**
   ```bash
   curl http://localhost:4000/api/v1/auth/register \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","password":"password123"}'
   ```

3. **Client Loading:**
   - Open http://localhost:3000
   - Should see the Re-Zero login page

### Test Data Processing

1. **Register a user** through the web interface
2. **Login** with your credentials
3. **Upload a test file** from the `test-files/` directory
4. **Create an analysis task** with one or more agents
5. **Verify results** are generated and displayed

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `MongoDB connection failed`

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in .env
echo $MONGODB_URI

# Test connection
mongosh "mongodb://localhost:27017/rezero"
```

#### 2. OpenAI API Errors

**Error:** `OpenAI API error: Invalid API key`

**Solutions:**
- Verify API key in `.env` file
- Check API key has sufficient credits
- Ensure API key has proper permissions

#### 3. Port Already in Use

**Error:** `Port 4000 is already in use`

**Solutions:**
```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=4001
```

#### 4. Client Build Failures

**Error:** `Build failed with errors`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
npm run lint

# Verify Node.js version
node --version
```

#### 5. File Upload Issues

**Error:** `File upload failed`

**Solutions:**
- Check file size limits in `.env`
- Verify file type is allowed
- Ensure upload directory has write permissions

### Log Files

Check logs for detailed error information:

```bash
# Server logs
tail -f server/logs/combined.log
tail -f server/logs/error.log

# PM2 logs (if using PM2)
pm2 logs rezero-server

# Docker logs (if using Docker)
docker-compose logs -f server
```

### Getting Help

1. **Check the logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Ensure all services** are running (MongoDB, Node.js)
4. **Check network connectivity** and firewall settings
5. **Review the troubleshooting section** above

### Support

- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: Check README.md and API documentation
- **Community**: Join our Discord server for community support

---

**Need help?** Check our [troubleshooting guide](#troubleshooting) or create an issue on GitHub.
