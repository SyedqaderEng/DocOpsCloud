# DocOpsCloud - Testing Guide

This guide will walk you through testing the complete end-to-end flow of DocOpsCloud.

## Prerequisites

1. **PostgreSQL** running on localhost:5432
2. **Redis** running on localhost:6379
3. **Environment variables** configured in `.env.local`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database (if not already done)
./setup-db.sh
# OR manually:
npx prisma db push

# 3. Start the Next.js application
npm run dev

# 4. Start the workers (in a separate terminal)
npm run worker
```

The application will be available at `http://localhost:3000`

## Test End-to-End Flow

### 1. Sign Up / Login
- Navigate to http://localhost:3000
- Click "Start Free" or "Sign In"
- Create an account or login

### 2. Upload a File
- Go to Dashboard
- Click "+ New Job" or navigate to a specific tool
- Upload a file (PDF, Word, Excel, or Image)

### 3. Process the File

**PDF Tools:**
- **Merge PDFs**: Upload 2+ PDFs, click "Merge", wait for processing
- **Split PDF**: Upload a PDF, specify page ranges or split all pages
- **Compress PDF**: Upload a PDF, select quality (low/medium/high)

**Word Tools:**
- **Word to PDF**: Upload a .docx file, convert to PDF

**Image Tools:**
- **Resize Image**: Upload an image, specify width/height
- **Compress Image**: Upload an image, reduce file size
- **Optimize Image**: Convert to WebP format for best compression

### 4. Download Processed File
- Once processing is complete (status changes to "completed")
- Click the download button
- File will download to your local machine

### 5. Email File (Optional)
- After processing completes
- Click "Email" button
- Enter recipient email address
- File will be sent via email

## API Testing with cURL

### Upload a File
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -F "file=@/path/to/your/file.pdf"
```

### Merge PDFs
```bash
curl -X POST http://localhost:3000/api/tools/pdf-merge \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "fileIds": ["file-id-1", "file-id-2"]
  }'
```

### Check Job Status
```bash
curl http://localhost:3000/api/jobs/JOB_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### Download File
```bash
curl http://localhost:3000/api/files/download/FILE_ID \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Verify Usage Limits

### FREE Tier (Default)
- **10 operations/month**
- **10MB max file size**
- Try to upload an 11MB file → Should fail with "File too large"
- Process 10 operations → 11th should fail with "Usage limit exceeded"

### PRO Tier
- Update user in database: `subscription_tier = 'PRO'`
- **1000 operations/month**
- **500MB max file size**

### BUSINESS Tier
- Update user in database: `subscription_tier = 'BUSINESS'`
- **Unlimited operations**
- **2GB max file size**

## Dashboard Features

1. **Overview Tab**
   - Shows real stats: Total Files, Jobs This Month, Completed, Processing
   - FREE users see usage progress bar
   - Recent activity shows last 5 jobs

2. **My Files Tab**
   - Lists all uploaded files
   - Click to download or process

3. **Jobs Tab**
   - Shows all processing jobs
   - Filter by status (queued/processing/completed/failed)

4. **All Tools Tab**
   - Browse all 120+ tools by category
   - PDF, Word, Excel, Image tools

## Troubleshooting

### Workers not processing jobs
- Make sure Redis is running: `redis-cli ping` → should return "PONG"
- Check worker logs: `npm run worker`
- Verify BullMQ connection in logs

### File upload fails
- Check S3 credentials in `.env.local`
- Verify AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
- Test S3 connection manually

### Database errors
- Run `npx prisma db push` to sync schema
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env.local`

### 401 Unauthorized errors
- Clear browser cookies and login again
- Check NEXTAUTH_SECRET is set
- Verify session is not expired

## Performance Testing

### Upload Multiple Files
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/files/upload \
    -H "Cookie: YOUR_SESSION_COOKIE" \
    -F "file=@test-file.pdf"
done
```

### Process Multiple Jobs
Monitor worker performance by checking:
- Job queue length: `redis-cli LLEN bull:pdf:wait`
- Active jobs: `redis-cli LLEN bull:pdf:active`
- Completed jobs: `redis-cli LLEN bull:pdf:completed`

## Production Readiness Checklist

- [ ] PostgreSQL configured and accessible
- [ ] Redis configured and accessible
- [ ] S3 bucket created with proper permissions
- [ ] Environment variables set for production
- [ ] Workers running in background (PM2, systemd, etc.)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Rate limiting configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy for database
- [ ] CDN configured for static assets

## Support

For issues or questions:
- Check logs: `npm run dev` and `npm run worker`
- Review database: `npx prisma studio`
- Check Redis: `redis-cli monitor`
