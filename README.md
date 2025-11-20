# DocOpsCloud

A comprehensive document processing SaaS platform offering 105+ utility tools across PDF, Word, Excel, CSV, and Image manipulation.

## 🚀 Project Status

**Phase 1: Foundation & Core Infrastructure** - In Progress

### Completed
- ✅ Next.js 14+ project initialization with TypeScript
- ✅ Tailwind CSS + shadcn/ui configuration
- ✅ ESLint, Prettier, and Git hooks setup
- ✅ Complete project structure created
- ✅ Environment variables management
- ✅ Prisma schema design (10+ tables)
- ✅ Database client configuration

### In Progress
- 🔄 NextAuth.js v5 implementation
- 🔄 OAuth providers setup

## 📋 Features

### Document Categories
- **PDF Processing** (40 features) - Merge, split, compress, OCR, watermark, etc.
- **Word/DOCX** (20 features) - Edit, convert, track changes, etc.
- **Excel/CSV** (25 features) - Edit, filter, convert, merge, etc.
- **Image Processing** (20 features) - Resize, crop, compress, format conversion, etc.

### Subscription Tiers
- **Free**: 10 operations/month, 5MB file limit
- **Pro**: 500 operations/month, 100MB file limit - $79/year
- **Business**: Unlimited operations, 500MB file limit, API access - $149/year

## 🛠️ Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+
- Tailwind CSS + shadcn/ui

### Backend
- Next.js API Routes
- PostgreSQL (Prisma ORM)
- Redis (BullMQ for job queue)
- AWS S3 / Cloudflare R2

### Services
- NextAuth.js v5 (Authentication)
- Stripe (Payments)
- Resend (Email)

### Processing Libraries
- pdf-lib (PDF manipulation)
- sharp (Image processing)
- xlsx (Spreadsheet processing)
- docx (Word processing)
- tesseract.js (OCR)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance
- S3-compatible storage

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DocOpsCloud
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
DocOpsCloud/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (marketing)/       # Public pages
│   ├── dashboard/         # User dashboard
│   ├── tools/             # Processing tools
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── shared/           # Shared components
│   ├── layout/           # Layout components
│   └── ...
├── lib/                  # Utilities & services
│   ├── db/              # Database utilities
│   ├── storage/         # S3 utilities
│   ├── queue/           # Job queue
│   ├── auth/            # Auth utilities
│   └── config/          # Configuration
├── modules/             # Feature modules
│   ├── pdf/            # PDF processing
│   ├── word/           # Word processing
│   ├── excel/          # Excel processing
│   └── image/          # Image processing
├── prisma/             # Database schema
└── public/             # Static assets
```

## 📚 Documentation

- [Technical Architecture](./TechnicalArchitecture.md)
- [Development Progress](./DOCOPSCLOUD_HANDOFF_TEMPLATE.md)

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## 🤝 Contributing

This project follows a phased development approach. See `DOCOPSCLOUD_HANDOFF_TEMPLATE.md` for the complete roadmap.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for document processing automation**
