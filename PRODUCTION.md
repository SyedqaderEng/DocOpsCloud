# DocOpsCloud - Production Documentation

## 🚀 Production-Ready Features

DocOpsCloud is a complete, production-ready SaaS platform for document processing with **120+ tools** across PDF, Word, Excel, and Image processing.

### ✅ What's Been Built

#### **Core Infrastructure**
- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis queue system with BullMQ
- ✅ AWS S3/Cloudflare R2 storage integration
- ✅ NextAuth.js authentication (Email, Google, GitHub OAuth)
- ✅ Stripe subscription & billing system
- ✅ Email notifications (Resend/SendGrid)
- ✅ API key management

#### **User Features**
- ✅ **120+ Document Processing Tools**
  - 35 PDF tools (merge, split, compress, watermark, OCR, etc.)
  - 25 Word tools (conversions, text extraction, formatting)
  - 30 Excel/CSV tools (conversions, data processing)
  - 30 Image tools (resize, compress, filters, background removal)

- ✅ **Authentication & User Management**
  - Email/password registration with verification
  - OAuth (Google, GitHub)
  - Password reset flow
  - Session management

- ✅ **Subscription Plans**
  - Free: 10 operations/month, 50MB files
  - Pro ($79/year): Unlimited ops, 500MB files, API access
  - Business ($299/year): Team features, 2GB files, priority support

- ✅ **User Dashboard**
  - Real-time job status tracking
  - File management
  - Usage statistics
  - Recent activity feed

- ✅ **Settings & Profile**
  - Profile management
  - Password changes
  - Billing & subscription management
  - Notification preferences
  - API key generation

#### **Payment Integration**
- ✅ Stripe Checkout for subscriptions
- ✅ Webhook handlers for:
  - Subscription creation
  - Subscription updates
  - Subscription cancellation
  - Payment success/failure
- ✅ Automatic tier management
- ✅ Usage tracking and limits

#### **Processing System**
- ✅ BullMQ job queue with Redis
- ✅ Worker processes for all tool categories
- ✅ Progress tracking and status updates
- ✅ Error handling and retries
- ✅ File cleanup automation

#### **Admin Features**
- ✅ Admin dashboard with platform statistics
- ✅ User management overview
- ✅ Revenue tracking
- ✅ Job statistics and monitoring
- ✅ Storage usage tracking

## 📁 Project Structure

```
DocOpsCloud/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Beautiful login page with OAuth
│   │   └── signup/page.tsx         # Registration with email verification
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx      # Main user dashboard
│   │   ├── jobs/[jobId]/page.tsx   # Real-time job status
│   │   └── settings/page.tsx       # Settings with 5 tabs
│   ├── (tools)/
│   │   └── tools/[toolId]/page.tsx # Universal template for all 120 tools
│   ├── admin/page.tsx              # Admin dashboard
│   ├── pricing/page.tsx            # Pricing with Stripe integration
│   └── api/
│       ├── auth/                   # NextAuth & custom auth endpoints
│       ├── stripe/                 # Stripe checkout & webhooks
│       ├── process/                # Tool processing endpoints
│       ├── upload/                 # File upload handlers
│       └── jobs/                   # Job management
│
├── lib/
│   ├── auth/                       # NextAuth configuration
│   ├── db/                         # Prisma client
│   ├── queue/                      # BullMQ queue & workers
│   ├── processing/                 # Document processors
│   ├── storage/                    # S3/R2 integration
│   └── tools-data.ts               # All 120 tools definition
│
├── prisma/
│   └── schema.prisma               # Complete database schema
│
├── components/
│   ├── ui/                         # Shadcn UI components
│   └── shared/                     # Reusable components
│
└── scripts/
    └── worker.ts                   # Background worker process
```

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - App Router with React Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Beautiful component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless functions
- **NextAuth.js v5** - Authentication
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Queue & caching
- **BullMQ** - Job processing

### External Services
- **Stripe** - Payments & subscriptions
- **AWS S3 / Cloudflare R2** - File storage
- **Resend / SendGrid** - Email delivery
- **Sharp** - Image processing
- **pdf-lib** - PDF manipulation
- **docx** - Word processing
- **xlsx** - Excel processing

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/docopscloud"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage (S3/R2)
S3_BUCKET_NAME="docopscloud-files"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_ENDPOINT="https://your-bucket.s3.amazonaws.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID="price_..."

# Email
EMAIL_FROM="noreply@docopscloud.com"
RESEND_API_KEY="re_..."

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://docopscloud.com"
```

## 🚀 Deployment Guide

### 1. Database Setup (PostgreSQL)

```bash
# Create database
createdb docopscloud

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Redis Setup

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or use managed Redis (Upstash, Redis Cloud)
```

### 3. Storage Setup (S3/R2)

**AWS S3:**
```bash
# Create S3 bucket
aws s3 mb s3://docopscloud-files

# Set CORS configuration for uploads
aws s3api put-bucket-cors --bucket docopscloud-files --cors-configuration file://cors.json
```

**Cloudflare R2:**
- Create R2 bucket in Cloudflare dashboard
- Generate API tokens
- Set S3_ENDPOINT to R2 endpoint

### 4. Stripe Setup

1. Create Stripe account
2. Create products & prices for Pro and Business plans
3. Set up webhook endpoint: `/api/stripe/webhook`
4. Add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 5. Deploy Application

**Vercel (Recommended):**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Docker:**

```bash
# Build
docker build -t docopscloud .

# Run
docker run -p 3000:3000 --env-file .env docopscloud
```

### 6. Start Background Workers

```bash
# Development
npm run worker

# Production (with PM2)
pm2 start npm --name "docops-worker" -- run worker
pm2 save
pm2 startup
```

## 📊 Database Schema

### Key Models

- **User** - User accounts with subscription info
- **Account** - OAuth provider accounts
- **Session** - User sessions
- **File** - Uploaded files metadata
- **ProcessingJob** - Job queue entries
- **Subscription** - Stripe subscriptions
- **UsageLog** - Operation tracking
- **ApiKey** - API access keys

## 🔄 Job Processing Flow

1. User uploads file → S3/R2
2. Create job in database
3. Queue job in BullMQ
4. Worker picks up job
5. Process file using appropriate processor
6. Upload result to S3/R2
7. Update job status
8. Send notification email
9. Clean up files after retention period

## 🎨 Design System

### Brand Colors
- **Primary**: Purple-600 (#9333EA)
- **Success**: Green-600
- **Warning**: Yellow-500
- **Error**: Red-600

### Typography
- **Headings**: Font-extrabold, large sizes
- **Body**: Font-medium, readable sizes
- **Labels**: Font-semibold, smaller sizes

### Component Patterns
- Clean white backgrounds
- Subtle shadows and borders
- Purple accents for CTAs
- Smooth transitions
- Mobile-first responsive design

## 📈 Monitoring & Analytics

### Key Metrics to Track
- User registrations
- Active subscriptions
- Job success/failure rates
- Processing times
- Storage usage
- Revenue (MRR, ARR)
- Churn rate

### Recommended Tools
- **Vercel Analytics** - Web vitals
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Stripe Dashboard** - Revenue tracking
- **Prisma Studio** - Database inspection

## 🔧 Maintenance Tasks

### Daily
- Monitor error logs
- Check job queue health
- Review failed jobs

### Weekly
- Clean up expired files
- Review user feedback
- Check system performance

### Monthly
- Database optimization
- Security updates
- Cost analysis
- Feature planning

## 📚 API Documentation

### Authentication
All API endpoints require authentication via:
- Session cookie (web)
- API key (programmatic access)

### Rate Limits
- **Free**: 10 operations/month
- **Pro**: Unlimited
- **Business**: Unlimited with priority

### Example API Call

```bash
curl -X POST https://api.docopscloud.com/process/pdf/merge \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileIds": ["file_123", "file_456"]
  }'
```

## 🔒 Security Best Practices

1. **File Security**
   - Virus scanning before processing
   - File type validation
   - Size limits enforcement
   - Automatic deletion after retention

2. **Authentication**
   - Password hashing with bcrypt
   - JWT for stateless auth
   - OAuth for third-party login
   - Email verification required

3. **API Security**
   - Rate limiting
   - API key rotation
   - Request validation
   - CORS configuration

4. **Data Privacy**
   - GDPR compliant
   - Data encryption at rest
   - TLS for data in transit
   - Regular security audits

## 🎯 Production Checklist

- [x] Database schema defined and migrated
- [x] All 120 tools implemented
- [x] Authentication system (email + OAuth)
- [x] Payment integration with Stripe
- [x] File upload/download system
- [x] Job processing queue
- [x] User dashboard
- [x] Settings & profile management
- [x] Admin dashboard
- [x] Email notifications
- [x] API documentation
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] CDN setup (CloudFlare)
- [ ] Backup system configured
- [ ] Monitoring alerts set up
- [ ] Load testing completed
- [ ] Security audit completed

## 📞 Support

- Documentation: https://docs.docopscloud.com
- Email: support@docopscloud.com
- Status: https://status.docopscloud.com

## 📄 License

Proprietary - All rights reserved
