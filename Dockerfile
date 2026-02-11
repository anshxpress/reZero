FROM node:18-alpine

WORKDIR /app

# Copy package.json from the server directory
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the server source code
# We copy everything from server/ into /app/
COPY server/ .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 10000

# Start server
# Since we copied server/ contents to /app, src/index.js is at /app/src/index.js
CMD ["node", "src/index.js"]
