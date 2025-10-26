# Docker Deployment Guide

## 🐳 Docker Setup for Rent2Repay Demo

This guide explains how to deploy the Rent2Repay Demo using Docker.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose installed
- Your environment variables ready

## 🚀 Quick Start

### Method 1: Using Environment Variables (Recommended)

1. Create a `.env` file at the root of the project:

```bash
# .env file
NEXT_PUBLIC_RPC_URL=https://rpc.gnosischain.com
NEXT_PUBLIC_R2R_PROXY=0xYourActualContractAddress
NEXT_PUBLIC_CHAIN_ID=100
HOST_PORT=3000  # Optional, defaults to 3000
```

2. Build and start the containers:

```bash
docker-compose up -d --build
```

3. Access the application at `http://localhost:3000`

### Method 2: Using docker-compose.override.yml

1. Copy the example override file:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

2. Edit `docker-compose.override.yml` with your actual values:

```yaml
services:
  rent2repay-demo:
    build:
      args:
        - NEXT_PUBLIC_RPC_URL=https://your-rpc-url.com
        - NEXT_PUBLIC_R2R_PROXY=0xYourActualContractAddress
        - NEXT_PUBLIC_CHAIN_ID=100
    ports:
      - "3000:3000"
```

3. Build and start:

```bash
docker-compose up -d
```

## 🔧 Docker Commands

### Build the image:

```bash
docker-compose build
```

### Start the container:

```bash
docker-compose up -d
```

### View logs:

```bash
docker-compose logs -f
```

### Stop the container:

```bash
docker-compose down
```

### Rebuild and restart:

```bash
docker-compose up -d --build
```

### View running containers:

```bash
docker-compose ps
```

## 🔒 Security Best Practices

### Keep Secrets Out of Git

1. **Create `.env` file** (already in `.gitignore`):
   ```
   NEXT_PUBLIC_RPC_URL=your-url
   NEXT_PUBLIC_R2R_PROXY=your-address
   ```

2. **Or use `docker-compose.override.yml`** (also in `.gitignore`):
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   # Edit with your values
   ```

### Files that should NEVER be committed:

- ✅ `.env` (already in .gitignore)
- ✅ `docker-compose.override.yml` (add to .gitignore)
- ✅ `.env.local`
- ✅ `.env.production`

### Verify your `.gitignore` includes:

```
.env
.env*.local
docker-compose.override.yml
```

## 🌐 Port Configuration

### Change the external port:

Edit your `.env` file:

```bash
HOST_PORT=8080  # Access via localhost:8080
```

Or edit `docker-compose.yml` directly:

```yaml
ports:
  - "8080:3000"  # External:Internal
```

## 📊 Health Check

The container includes a health check. Monitor it with:

```bash
docker-compose ps
```

Or check logs:

```bash
docker-compose logs rent2repay-demo
```

## 🔄 Updating the Application

1. Pull the latest code:

```bash
git pull
```

2. Rebuild the container:

```bash
docker-compose up -d --build
```

## 🐛 Troubleshooting

### Container won't start:

```bash
# Check logs
docker-compose logs

# Check if port is already in use
lsof -i :3000

# Try a different port
# Set HOST_PORT=3001 in .env
```

### Build fails:

```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker system prune -a
```

### Environment variables not working:

```bash
# Verify .env file exists
cat .env

# Check environment variables in container
docker-compose exec rent2repay-demo env

# Restart container
docker-compose restart
```

## 📝 Production Deployment

For production, consider:

1. **Use a reverse proxy** (Nginx/Traefik) for SSL/TLS
2. **Set up log rotation** for Docker logs
3. **Configure resource limits** in docker-compose
4. **Use secrets management** (Docker Secrets, Vault, etc.)

Example with resource limits:

```yaml
services:
  rent2repay-demo:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

## 🎯 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_RPC_URL` | Gnosis Chain RPC endpoint | `https://rpc.gnosischain.com` |
| `NEXT_PUBLIC_R2R_PROXY` | Rent2Repay contract address | `0x...` |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain network ID | `100` (Gnosis) |
| `HOST_PORT` | External port mapping | `3000` |

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

## ❓ Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/Baptiste-Yucca/demo-rent2repay/issues)
2. Contact [@BaptisteYucca](https://t.me/BaptisteYucca) on Telegram

