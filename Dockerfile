# Codevirus Security — Production Dockerfile
FROM node:20-alpine

# Security & environment setup
ENV NODE_ENV=production
WORKDIR /app

# Copy dependency specifications first for optimal layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Ensure data directory exists
RUN mkdir -p /app/data /app/data/logs

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start production server
CMD ["node", "server.js"]
