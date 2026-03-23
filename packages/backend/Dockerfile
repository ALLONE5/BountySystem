FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY packages/backend/package*.json ./
RUN npm install && npm cache clean --force

# Copy backend source
COPY packages/backend/ .
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY packages/backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs packages/backend/scripts ./scripts
COPY --chown=nodejs:nodejs packages/database/migrations ./migrations
COPY --chown=nodejs:nodejs packages/database/scripts/init.sql ./migrations/init.sql
COPY --chown=nodejs:nodejs packages/backend/start.sh ./start.sh
RUN chmod +x start.sh

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "start.sh"]
