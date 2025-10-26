version: '3.8'

services:
  rent2repay-demo:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}
        - NEXT_PUBLIC_R2R_PROXY=${NEXT_PUBLIC_R2R_PROXY}
        - NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
    container_name: rent2repay-demo
    ports:
      - "5002:3000"  # External port 3001 maps to internal port 3000
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}
      - NEXT_PUBLIC_R2R_PROXY=${NEXT_PUBLIC_R2R_PROXY}
      - NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
    restart: unless-stopped