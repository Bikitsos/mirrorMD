# Node.js Backend Container with Puppeteer support
FROM node:20-alpine

WORKDIR /app

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-emoji

# Tell Puppeteer to use installed Chromium instead of downloading
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files first for better layer caching
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci --omit=dev

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create temp directory for file storage
RUN mkdir -p /app/temp

# Expose the port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/backend

# Start the server
CMD ["node", "index.js"]
