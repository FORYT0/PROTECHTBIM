# Development Dockerfile for PROTECHT BIM API
FROM node:20-alpine

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY libs/shared-types/package*.json ./libs/shared-types/
COPY libs/shared-utils/package*.json ./libs/shared-utils/
COPY tsconfig.base.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Start the API with hot-reload using tsx watch
CMD ["npm", "run", "dev", "--workspace=@protecht-bim/api"]
