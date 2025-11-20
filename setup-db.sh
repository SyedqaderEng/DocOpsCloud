#!/bin/bash

echo "🚀 DocOpsCloud Database Setup"
echo "=============================="
echo ""

# Check if PostgreSQL is running
echo "1️⃣  Checking PostgreSQL connection..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo ""
    echo "Please start PostgreSQL first:"
    echo "  Mac:    brew services start postgresql"
    echo "  Ubuntu: sudo systemctl start postgresql"
    echo "  Docker: docker run --name docops-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres"
    echo ""
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "2️⃣  Creating database 'docops'..."
createdb -U postgres docops 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database created"
else
    echo "⚠️  Database 'docops' already exists (this is fine)"
fi

# Run Prisma migrations
echo ""
echo "3️⃣  Creating database tables with Prisma..."
npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo "✅ Database tables created successfully!"
    echo ""
    echo "📊 Database Schema Created:"
    echo "   - users (with subscription info)"
    echo "   - files (uploaded file metadata)"
    echo "   - processing_jobs (job queue)"
    echo "   - subscriptions (Stripe subscriptions)"
    echo "   - usage_logs (operation tracking)"
    echo "   - api_keys (API access)"
    echo "   + authentication tables"
    echo ""
    echo "✅ Setup complete! You can now:"
    echo "   1. Run 'npm run dev' to start the app"
    echo "   2. Run 'npx prisma studio' to view your database"
    echo "   3. Visit http://localhost:3000"
else
    echo "❌ Failed to create database tables"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi
