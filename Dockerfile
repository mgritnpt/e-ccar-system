# Stage 1: Build Frontend (Vite)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install client dependencies
RUN cd client && npm ci

# Copy client source code
COPY client/ ./client/

# Build production bundle for client
RUN cd client && npm run build

# Stage 2: Production Server
FROM node:20-alpine

WORKDIR /app

# Copy root and server package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install server production dependencies
RUN cd server && npm ci --omit=dev

# Copy server code and database schema
COPY server/ ./server/
COPY database/ ./database/

# Copy built frontend assets from stage 1
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

# Start server
CMD ["node", "server/index.js"]
