FROM node:18-alpine

WORKDIR /app

# Copy server package files from the server directory
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
