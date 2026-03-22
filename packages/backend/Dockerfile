# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including devDeps for tsc build)
RUN npm install && npm cache clean --force

COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
