# syntax=docker/dockerfile:1
# MediKiosk Production Multi-Stage Dockerfile

# Stage 1: Build & Dependencies
FROM node:22-alpine AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./

# Copy Application Source & Static Assets
COPY backend ./backend
COPY frontend ./frontend
COPY models ./models
COPY architecture ./architecture

# Expose Kiosk Web & API Port
EXPOSE 3000

# Health Check Endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/patients', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));"

# Launch MediKiosk Clinical Server
CMD ["node", "backend/server.js"]
