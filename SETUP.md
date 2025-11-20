# DocOpsCloud - Local Development Setup

## 🚀 Quick Start Guide

This guide will help you set up DocOpsCloud locally for development and testing.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed (or Docker)
- Redis installed (or Docker)
- Git

## Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/DocOpsCloud.git
cd DocOpsCloud
npm install
```

## Step 2: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL
docker run --name docops-postgres \
  -e POSTGRES_USER=docops \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=docopscloud \
  -p 5432:5432 \
  -d postgres:15-alpine

# Start Redis
docker run --name docops-redis \
  -p 6379:6379 \
  -d redis:alpine
```

### Option B: Local PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb docopscloud
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb docopscloud
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

## Step 3: Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database - REQUIRED
DATABASE_URL="postgresql://docops:your_password@localhost:5432/docopscloud"

# NextAuth - REQUIRED
NEXTAUTH_SECRET="generate-a-random-secret-key-here-use-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Redis - REQUIRED
REDIS_URL="redis://localhost:6379"

# Storage (S3/R2) - REQUIRED for file uploads
# You can use AWS S3 or Cloudflare R2
S3_BUCKET_NAME="docopscloud-dev"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_ENDPOINT="https://your-bucket.s3.amazonaws.com"

# OAuth (Optional - for Google/GitHub login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_xxx"
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID="price_xxx"

# Email (Optional - for notifications)
EMAIL_FROM="noreply@docopscloud.com"
RESEND_API_KEY="re_your_resend_api_key"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 4: Generate NextAuth Secret

```bash
openssl rand -base64 32
# Copy the output and use it as NEXTAUTH_SECRET
```

## Step 5: Set Up Database Tables

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Step 6: Start Development Server

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start worker process
npm run worker
```

Your application should now be running at http://localhost:3000

## 🗄️ Database Schema Overview

The database includes these main tables:

- **users** - User accounts with subscriptions
- **accounts** - OAuth provider accounts
- **sessions** - User sessions
- **files** - Uploaded file metadata
- **processing_jobs** - Job queue entries
- **subscriptions** - Stripe subscriptions
- **usage_logs** - Usage tracking
- **api_keys** - API access keys

## 🧪 Testing the Application

### 1. Create a Test User

Visit http://localhost:3000/signup and create an account with:
- Email: test@example.com
- Password: Test1234!

### 2. Test File Upload

1. Go to http://localhost:3000/dashboard
2. Click "All Tools" tab
3. Select any tool (e.g., "PDF Merge")
4. Upload a test file
5. Check job status

### 3. View Database

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 to view all database tables.

## 🔧 Common Issues & Solutions

### Issue: "Database connection failed"

**Solution:**
1. Check if PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql postgresql://docops:password@localhost:5432/docopscloud`

### Issue: "Redis connection failed"

**Solution:**
1. Check if Redis is running: `redis-cli ping` (should return "PONG")
2. Verify REDIS_URL in `.env`
3. Start Redis: `redis-server`

### Issue: "Prisma client not found"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Tables don't exist"

**Solution:**
```bash
npx prisma db push
```

### Issue: "S3 upload fails"

**Solution:**
- For development, you can use local file storage by modifying `lib/storage/s3.ts`
- Or set up a free Cloudflare R2 account: https://developers.cloudflare.com/r2/

## 📦 Optional: Seed Database with Test Data

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const password = await hash('Test1234!', 10)

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password_hash: password,
      email_verified: new Date(),
      subscription_tier: 'PRO',
      subscription_status: 'ACTIVE',
    },
  })

  console.log('Created test user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run seeder:
```bash
npx tsx prisma/seed.ts
```

## 🎯 Development Workflow

1. **Start services:**
   ```bash
   # PostgreSQL + Redis (Docker)
   docker-compose up -d

   # Or use local installations
   ```

2. **Run migrations:**
   ```bash
   npx prisma db push
   ```

3. **Start dev servers:**
   ```bash
   npm run dev    # Terminal 1
   npm run worker # Terminal 2
   ```

4. **Make changes and test**

5. **View logs:**
   - Next.js logs in Terminal 1
   - Worker logs in Terminal 2

## 🚀 Production Deployment

See `PRODUCTION.md` for complete deployment guide.

## 📚 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth Docs**: https://next-auth.js.org/
- **Stripe Docs**: https://stripe.com/docs
- **BullMQ Docs**: https://docs.bullmq.io/

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide
2. Review error messages carefully
3. Check database connections
4. Verify environment variables
5. Clear `.next` folder and restart: `rm -rf .next && npm run dev`

## ✅ Verification Checklist

- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] `.env` file created with all required variables
- [ ] Database tables created (`npx prisma db push`)
- [ ] Can access http://localhost:3000
- [ ] Can create a test account
- [ ] Can login successfully
- [ ] Can view dashboard
- [ ] Can access tools pages
- [ ] Worker process runs without errors

You're all set! 🎉
