# DocOpsCloud 🚀

> A complete, production-ready SaaS platform for document processing with **120+ professional tools**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

## 📸 Screenshots

**Clean Monarch Theme Design** - Professional white backgrounds with purple accents throughout the entire platform.

## ✨ What's Built

### Complete Production Platform

✅ **120+ Document Processing Tools**
- 35 PDF Tools (merge, split, compress, watermark, OCR, sign, etc.)
- 25 Word Tools (convert, extract, format, etc.)
- 30 Excel/CSV Tools (convert, filter, merge, etc.)
- 30 Image Tools (resize, compress, filters, background removal, etc.)

✅ **Full Authentication System**
- Email/password with verification
- OAuth (Google + GitHub)
- Session management with NextAuth v5
- Password reset flow

✅ **Subscription & Billing**
- Free: 10 operations/month, 50MB files
- Pro: $79/year - Unlimited operations, 500MB files
- Business: $299/year - Team features, 2GB files
- Complete Stripe integration with webhooks
- Automatic tier management

✅ **User Dashboard**
- Real-time job status tracking
- Usage statistics and limits
- File management
- Recent activity feed
- Clean Monarch theme design

✅ **Settings & Profile**
- Profile management
- Password changes
- Billing & subscription management
- Notification preferences
- API key generation

✅ **Admin Dashboard**
- Platform statistics
- User management
- Revenue tracking
- Job monitoring
- Storage analytics

✅ **Infrastructure**
- PostgreSQL database with Prisma
- Redis job queue with BullMQ
- AWS S3/Cloudflare R2 storage
- Background workers
- Automated file cleanup

## 🎨 Design System

**Monarch Theme** - Clean, professional design inspired by modern SaaS platforms:

- **Colors**: White backgrounds, purple-600 accents (#9333EA)
- **Typography**: Extrabold headings, medium body text
- **Components**: Shadcn UI with custom styling
- **Layout**: Mobile-first, responsive grids
- **Interactions**: Smooth transitions, hover effects

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/DocOpsCloud.git
cd DocOpsCloud

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# Set up database
npx prisma db push

# Start development
npm run dev    # Terminal 1: Next.js
npm run worker # Terminal 2: Background jobs
```

Visit http://localhost:3000

**📖 For detailed setup instructions, see [SETUP.md](SETUP.md)**

## 📂 Project Structure

```
DocOpsCloud/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/        # Login with OAuth
│   │   └── signup/       # Registration
│   ├── (dashboard)/      # Dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── jobs/         # Job status
│   │   └── settings/     # User settings
│   ├── (tools)/          # Tool pages
│   │   └── tools/[toolId]/ # Universal tool template
│   ├── admin/            # Admin dashboard
│   ├── pricing/          # Pricing page
│   └── api/              # API routes
│       ├── auth/         # Authentication
│       ├── stripe/       # Payments
│       ├── process/      # Document processing
│       └── jobs/         # Job management
│
├── lib/
│   ├── auth/             # NextAuth config
│   ├── db/               # Prisma client
│   ├── queue/            # BullMQ queue & workers
│   ├── processing/       # Document processors
│   ├── storage/          # S3/R2 integration
│   └── tools-data.ts     # 120 tools definition
│
├── components/
│   ├── ui/               # Shadcn components
│   └── shared/           # Reusable components
│
├── prisma/
│   └── schema.prisma     # Database schema
│
└── scripts/
    └── worker.ts         # Background worker
```

## 🛠 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Prisma, PostgreSQL, Redis |
| **Auth** | NextAuth.js v5, OAuth (Google, GitHub) |
| **Payments** | Stripe (Checkout, Webhooks, Subscriptions) |
| **Storage** | AWS S3 / Cloudflare R2 |
| **Queue** | BullMQ with Redis |
| **Email** | Resend / SendGrid |
| **Processing** | Sharp (images), pdf-lib (PDF), docx, xlsx |
| **UI** | Shadcn UI, Lucide Icons |

## 📊 Database Schema

Key models:
- **User** - Accounts with subscription info
- **File** - Uploaded file metadata
- **ProcessingJob** - Queue entries with progress
- **Subscription** - Stripe subscriptions
- **UsageLog** - Operation tracking
- **ApiKey** - API access management

Full schema: [prisma/schema.prisma](prisma/schema.prisma)

## 🔐 Environment Variables

Required variables:

```env
DATABASE_URL=              # PostgreSQL connection
NEXTAUTH_SECRET=           # Auth secret (openssl rand -base64 32)
NEXTAUTH_URL=              # App URL
REDIS_URL=                 # Redis connection
S3_BUCKET_NAME=            # Storage bucket
S3_ACCESS_KEY_ID=          # Storage credentials
S3_SECRET_ACCESS_KEY=      # Storage credentials
```

Optional:
```env
STRIPE_SECRET_KEY=         # For payments
GOOGLE_CLIENT_ID=          # For Google OAuth
GITHUB_CLIENT_ID=          # For GitHub OAuth
RESEND_API_KEY=            # For emails
```

See `.env.local.example` for complete list with descriptions.

## 📈 Features by Page

### Landing Page (`/`)
- Hero with dashboard preview
- All 120 tools displayed by category
- Pricing comparison
- Trust badges
- Clean Monarch theme

### Dashboard (`/dashboard`)
- Overview with stats
- Recent activity
- Quick actions
- All tools browser
- File management

### Tool Pages (`/tools/[toolId]`)
- Universal template for all 120 tools
- File upload with drag & drop
- Real-time processing
- Progress tracking
- Download results

### Settings (`/settings`)
- Profile management
- Billing & usage
- Notifications
- API keys
- Account security

### Admin (`/admin`)
- Platform statistics
- User metrics
- Revenue tracking
- Job analytics
- Activity feed

## 🔄 Processing Flow

1. User uploads file → S3/R2
2. Job created in database
3. Queued in Redis (BullMQ)
4. Worker processes file
5. Result uploaded to S3/R2
6. Job status updated
7. User notified
8. Auto-cleanup after retention period

## 🚢 Deployment

### Option 1: Vercel (Recommended)

```bash
vercel --prod
```

Set environment variables in Vercel dashboard.

### Option 2: Docker

```bash
docker build -t docopscloud .
docker run -p 3000:3000 --env-file .env docopscloud
```

### Background Workers

```bash
# Using PM2 (recommended)
pm2 start npm --name "docops-worker" -- run worker
pm2 save
pm2 startup
```

**📖 Full deployment guide: [PRODUCTION.md](PRODUCTION.md)**

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Local development setup
- **[PRODUCTION.md](PRODUCTION.md)** - Production deployment guide
- **[prisma/schema.prisma](prisma/schema.prisma)** - Database schema

## 🎯 What Makes This Special

### Compared to Competitors

✅ **120+ tools** vs competitors' 20-50 tools
✅ **Universal template system** - One page handles all tools dynamically
✅ **Clean Monarch design** - Modern, professional UI throughout
✅ **Real-time job tracking** - Live progress updates
✅ **Complete admin dashboard** - Full platform oversight
✅ **Production-ready** - Not a demo, fully functional
✅ **Excellent documentation** - Complete setup & deployment guides

### Technical Advantages

- **Type-safe** - Full TypeScript coverage
- **Modern stack** - Latest Next.js, React 18, Prisma
- **Scalable** - Queue system, background workers
- **Secure** - File encryption, auto-deletion, auth best practices
- **Fast** - Optimized queries, caching, CDN-ready
- **Monitored** - Admin dashboard, usage tracking

## 🧪 Testing Locally

```bash
# Start services
docker-compose up -d  # PostgreSQL + Redis

# Run migrations
npx prisma db push

# Start dev servers
npm run dev    # Next.js (http://localhost:3000)
npm run worker # Background jobs

# Create test user
visit http://localhost:3000/signup
```

## 🔒 Security

- Password hashing with bcrypt
- JWT sessions
- CORS configuration
- File type validation
- Size limits enforcement
- Auto file deletion
- GDPR compliant
- SQL injection prevention
- XSS protection

## 📞 Support

- **Documentation**: Complete guides in `/docs`
- **Issues**: GitHub Issues
- **Email**: support@docopscloud.com

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing
- [BullMQ](https://docs.bullmq.io/) - Job queue

---

**Made with ❤️ for document processing**

⭐ Star this repo if you found it helpful!
