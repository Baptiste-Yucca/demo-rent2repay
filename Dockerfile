# Dockerfile for Rent2Repay Demo
FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy all application files
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_R2R_PROXY
ARG NEXT_PUBLIC_CHAIN_ID

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}
ENV NEXT_PUBLIC_R2R_PROXY=${NEXT_PUBLIC_R2R_PROXY}
ENV NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]