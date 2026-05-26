# ============================================================================
# BACKEND DOCKERFILE (Express.js + Prisma)
# Production-ready image for Smart POS backend
# ============================================================================

FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    curl \
    tini

WORKDIR /app

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# ============================================================================
# STAGE 2: Production
# ============================================================================
FROM base AS production

# Set environment
ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expressjs -u 1001

# Copy dependencies
COPY --from=dependencies --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=expressjs:nodejs /app/prisma ./prisma

# Copy application code
COPY --chown=expressjs:nodejs ./src ./src
COPY --chown=expressjs:nodejs package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown expressjs:nodejs /app/logs

# Create uploads directory
RUN mkdir -p /app/uploads && chown expressjs:nodejs /app/uploads

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start Express server
CMD ["node", "src/server.js"]
