# Node.js Backend Container
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci --only=production

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose the port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/backend

# Start the server
CMD ["node", "index.js"]
