FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# ── Copy only API-relevant package files ──────────────────────────
# We install the API workspace in isolation to avoid pulling in
# the entire monorepo (web, NX, Three.js, etc.)
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY libs/shared-utils/package.json ./libs/shared-utils/
COPY libs/shared-types/package.json ./libs/shared-types/

# Install ONLY the api workspace deps (not web, not nx tooling)
# --ignore-scripts prevents bcrypt from recompiling (we use prebuilt)
RUN cd apps/api && NODE_ENV=development npm install --include=dev

# ── Copy source ───────────────────────────────────────────────────
COPY apps/api ./apps/api
COPY libs ./libs

# ── Build bundle from apps/api context ───────────────────────────
# node_modules is inside apps/api so esbuild is found
WORKDIR /app/apps/api
RUN node scripts/build-bundle.js

# ── Back to app root ──────────────────────────────────────────────
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001 \
 && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=8 \
    CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist-bundle/main.js"]
