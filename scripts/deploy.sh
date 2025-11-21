#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting DocOps Cloud Production Deployment"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

echo "✅ Environment variables loaded"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check database connection
echo "Checking database connection..."
if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER} > /dev/null 2>&1; then
    echo "⚠️  Warning: Database not responding. It will be started during deployment."
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️  Building application..."
npm run build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health check
echo "🏥 Running health check..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "Checking logs..."
        docker-compose -f docker-compose.prod.yml logs app
        exit 1
    fi

    echo "Attempt $attempt/$max_attempts failed. Retrying in 5 seconds..."
    sleep 5
    ((attempt++))
done

# Show running containers
echo "📊 Running containers:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo "📝 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=50 app

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URL: ${NEXTAUTH_URL}"
echo "📊 Monitoring: http://localhost:3001 (Grafana)"
echo "📈 Metrics: http://localhost:9090 (Prometheus)"
echo ""
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f app"
echo "To stop: docker-compose -f docker-compose.prod.yml down"
