FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init python3 make g++

# Copy package files first for layer caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY libs/shared-utils/package*.json ./libs/shared-utils/
COPY libs/shared-types/package*.json ./libs/shared-types/

# Install ALL dependencies including devDeps (need esbuild)
RUN npm install --include=dev

# Copy source
COPY . .

# Build the bundle
RUN node apps/api/scripts/build-bundle.js

# Remove devDependencies to slim image
RUN npm prune --omit=dev

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist-bundle/main.js"]
