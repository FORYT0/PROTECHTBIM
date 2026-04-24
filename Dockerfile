FROM node:20-alpine

WORKDIR /app

# Build tools needed by bcrypt (native addon)
RUN apk add --no-cache dumb-init python3 make g++

# ── 1. Copy package manifests for all workspace members ──────────
COPY package.json package-lock.json* ./
COPY apps/api/package.json            ./apps/api/
COPY libs/shared-utils/package.json   ./libs/shared-utils/
COPY libs/shared-types/package.json   ./libs/shared-types/

# ── 2. Install ALL deps at workspace root (includes devDeps) ─────
# NODE_ENV=development ensures devDependencies (esbuild) are installed
# npm workspaces installs everything into /app/node_modules
RUN NODE_ENV=development npm install --include=dev --workspaces --if-present

# ── 3. Copy full source ───────────────────────────────────────────
COPY apps/api   ./apps/api
COPY libs       ./libs

# ── 4. Bundle: run from repo root so paths resolve correctly ──────
RUN node apps/api/scripts/build-bundle.js

# ── 5. Prune devDeps to slim the image ───────────────────────────
RUN npm prune --omit=dev

# Non-root user for security
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nodejs -u 1001 \
 && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# start-period=60s gives DB time to connect before health checks count
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=8 \
    CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

# Run from /app so node_modules is at the correct relative path
CMD ["node", "apps/api/dist-bundle/main.js"]
