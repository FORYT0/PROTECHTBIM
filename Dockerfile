FROM node:20-alpine

WORKDIR /app

# Install build tools needed by native addons (bcrypt uses node-gyp)
RUN apk add --no-cache dumb-init python3 make g++

# ── Layer 1: root workspace package files ──────────────────────────
COPY package.json package-lock.json* ./

# ── Layer 2: workspace member package files ────────────────────────
COPY apps/api/package.json ./apps/api/
COPY libs/shared-utils/package.json ./libs/shared-utils/
COPY libs/shared-types/package.json ./libs/shared-types/

# ── Install ALL deps including devDeps (esbuild is a devDep) ───────
# NODE_ENV must NOT be production here or npm skips devDeps
RUN NODE_ENV=development npm install --include=dev

# ── Layer 3: full source ───────────────────────────────────────────
COPY . .

# ── Build: esbuild bundles everything into one CJS file ───────────
RUN node apps/api/scripts/build-bundle.js

# ── Slim: remove devDeps after build ──────────────────────────────
RUN npm prune --omit=dev

# Non-root for security
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001 \
 && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check — allows 60s for DB to connect on cold start
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=8 \
    CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist-bundle/main.js"]
