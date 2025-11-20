# Testing Guide - DocOpsCloud Phase 3

This guide shows you what you can test right now and how to run different types of tests.

---

## 🎯 Quick Start - What Can You Test Now?

### ✅ Ready to Test (No setup required)
1. **PDF Service Unit Tests** - Test PDF operations in isolation
2. **Type System** - Verify TypeScript types compile correctly
3. **Code Quality** - Linting and formatting

### ⚙️ Requires Setup
1. **API Integration Tests** - Need database + Redis
2. **Worker Tests** - Need Redis + database
3. **E2E Tests** - Full stack running

---

## 1. Unit Tests (PDF Services) - Ready Now! ✅

### Install Jest (if not already installed)
```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
```

### Run Unit Tests
```bash
# Run all tests
npx jest

# Run with coverage
npx jest --coverage

# Run specific test file
npx jest __tests__/pdf-services.test.ts

# Watch mode
npx jest --watch
```

### What Gets Tested
- ✅ PDF merge (2+ PDFs → 1 PDF)
- ✅ PDF split (by page ranges)
- ✅ Page extraction
- ✅ Page rotation (90°, 180°, 270°)
- ✅ Page reordering
- ✅ Metadata get/set
- ✅ Watermark addition
- ✅ Page numbering
- ✅ Headers and footers
- ✅ Compression
- ✅ Image to PDF conversion

**Expected Results:**
- All tests should pass ✅
- Each operation returns valid PDF buffers
- Page counts are correct
- Metadata is properly set/retrieved

---

## 2. TypeScript Type Checking - Ready Now! ✅

### Check Types
```bash
npm run type-check
```

This verifies:
- All TypeScript interfaces compile
- No type errors in services, API routes, workers
- Proper type inference throughout codebase

**Expected Result:** No TypeScript errors

---

## 3. Code Quality - Ready Now! ✅

### Linting
```bash
npm run lint
```

### Format Check
```bash
npm run format:check
```

### Auto-format
```bash
npm run format
```

---

## 4. Manual Service Testing - Ready Now! ✅

I've created a quick test script you can run:

### Create Test Script
```bash
# Run the test script
npx tsx scripts/test-pdf-services.ts
```

This will:
1. Create sample PDFs
2. Test merge operation
3. Test split operation
4. Test compression
5. Test watermark
6. Save results to `test-output/` directory
7. Print file sizes and stats

**Expected Output:**
```
PDF Services Manual Test
========================

✅ Created sample PDF 1 (X KB)
✅ Created sample PDF 2 (X KB)
✅ Merged PDFs (X KB, 2 pages)
✅ Split PDF (2 files)
✅ Compressed PDF (X% reduction)
✅ Added watermark
✅ Added page numbers

All tests completed successfully!
Results saved to: test-output/
```

---

## 5. API Route Testing - Requires Setup ⚙️

### Prerequisites
1. PostgreSQL running
2. Redis running
3. Environment variables configured
4. Database migrated

### Setup
```bash
# 1. Start PostgreSQL (Docker example)
docker run -d \
  --name docops-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=docopscloud \
  -p 5432:5432 \
  postgres:16

# 2. Start Redis
docker run -d \
  --name docops-redis \
  -p 6379:6379 \
  redis:7-alpine

# 3. Run migrations
npx prisma migrate dev

# 4. Start Next.js dev server
npm run dev
```

### Test API Endpoints

#### Test 1: PDF Merge
```bash
# 1. Get auth token (sign up/sign in first via UI at http://localhost:3000)

# 2. Upload 2 PDFs and get their fileIds
curl -X POST http://localhost:3000/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"fileName":"test1.pdf","fileSize":50000,"fileType":"application/pdf"}'

# 3. Create merge job
curl -X POST http://localhost:3000/api/process/pdf/merge \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"fileIds":["file_id_1","file_id_2"]}'

# Expected response:
{
  "jobId": "job_abc123",
  "status": "PENDING",
  "message": "PDF merge job created successfully"
}
```

#### Test 2: PDF Compress
```bash
curl -X POST http://localhost:3000/api/process/pdf/compress \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "fileId": "file_xyz789",
    "quality": "medium"
  }'

# Expected response:
{
  "jobId": "job_def456",
  "status": "PENDING",
  "message": "PDF compression job created with medium quality"
}
```

#### Test 3: PDF Watermark
```bash
curl -X POST http://localhost:3000/api/process/pdf/watermark \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "fileId": "file_xyz789",
    "text": "CONFIDENTIAL",
    "opacity": 0.3,
    "fontSize": 48,
    "rotation": 45,
    "position": "diagonal"
  }'
```

#### Check Job Status
```bash
curl http://localhost:3000/api/jobs/job_abc123 \
  -H "Cookie: your-session-cookie"

# Expected response:
{
  "id": "job_abc123",
  "status": "COMPLETED",
  "progress": 100,
  "output_file_id": "file_result_123",
  "download_url": "https://..."
}
```

---

## 6. Worker Testing - Requires Setup ⚙️

### Prerequisites
Same as API testing + worker process running

### Start Worker
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Worker process
npm run worker
```

### Test Worker Processing
```bash
# Create a job via API (see API testing above)
# Worker should automatically pick it up and process it

# Monitor worker logs:
# You should see:
# - "Processing PDF job: pdf_merge"
# - Progress updates (10%, 30%, 90%, 100%)
# - "PDF merge complete"
```

### Check Redis Queue
```bash
# Install Redis CLI
redis-cli

# Check queue status
> LLEN bullmq:pdf-processing:wait
> LLEN bullmq:pdf-processing:active
> LLEN bullmq:pdf-processing:completed

# View job data
> HGETALL bullmq:pdf-processing:job_abc123
```

---

## 7. End-to-End Testing - Full Stack ⚙️

### Prerequisites
- PostgreSQL running
- Redis running
- S3/R2 configured
- Next.js dev server running
- Worker process running

### Test Full Flow

#### Option A: Via UI (Easiest)
1. Go to http://localhost:3000
2. Sign up / Sign in
3. Navigate to Tools → PDF → Merge
4. Upload 2 PDF files
5. Click "Merge PDFs"
6. You'll be redirected to job status page
7. Wait for processing (worker picks up job)
8. Download result

**Expected Flow:**
```
1. User uploads files → S3 pre-signed URL
2. User clicks merge → API creates job
3. Worker picks up job → Downloads from S3
4. Worker processes → Calls PdfProcessor.mergePdfs()
5. Worker uploads result → S3
6. Worker updates job status → COMPLETED
7. User sees download button
```

#### Option B: Via API + Manual Upload
```bash
# 1. Sign in and get session cookie
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Get presigned upload URL
curl -X POST http://localhost:3000/api/upload/presigned-url \
  -H "Cookie: your-session" \
  -d '{"fileName":"test.pdf","fileSize":50000,"fileType":"application/pdf"}'

# Response: { "uploadUrl": "https://...", "key": "...", "fileId": "..." }

# 3. Upload PDF to S3
curl -X PUT "PRESIGNED_URL" \
  --upload-file test.pdf \
  -H "Content-Type: application/pdf"

# 4. Mark upload complete
curl -X POST http://localhost:3000/api/upload/complete \
  -H "Cookie: your-session" \
  -d '{"fileId":"file_abc","key":"uploads/user/test.pdf","size":50000}'

# 5. Create processing job
curl -X POST http://localhost:3000/api/process/pdf/merge \
  -H "Cookie: your-session" \
  -d '{"fileIds":["file1","file2"]}'

# 6. Poll job status
curl http://localhost:3000/api/jobs/JOB_ID \
  -H "Cookie: your-session"

# 7. When status=COMPLETED, download result
curl -o merged.pdf "DOWNLOAD_URL"
```

---

## 8. Performance Testing

### Test Job Queue Priority
```bash
# Create jobs with different subscription tiers
# Business tier jobs should process first (priority 1)
# Pro tier jobs second (priority 5)
# Free tier jobs last (priority 10)

# Monitor worker logs to verify priority order
```

### Test Concurrent Processing
```bash
# Create 10 jobs simultaneously
# Worker should process 3 at a time (concurrency setting)
# Monitor Redis to see active jobs count

redis-cli LLEN bullmq:pdf-processing:active
# Should max out at 3
```

### Test Large Files
```bash
# Upload a large PDF (10MB+)
# Verify:
# - Upload completes successfully
# - Processing doesn't timeout
# - Memory usage is reasonable
# - Result downloads correctly
```

---

## 9. Error Handling Tests

### Test Invalid Input
```bash
# Try to merge with only 1 file (should fail validation)
curl -X POST http://localhost:3000/api/process/pdf/merge \
  -H "Cookie: session" \
  -d '{"fileIds":["file1"]}'

# Expected: 400 Bad Request, "At least 2 files required"
```

### Test Non-existent File
```bash
curl -X POST http://localhost:3000/api/process/pdf/compress \
  -d '{"fileId":"fake_file_id","quality":"medium"}'

# Expected: 404 Not Found, "File not found or not ready"
```

### Test Unauthorized Access
```bash
# Try to access without authentication
curl -X POST http://localhost:3000/api/process/pdf/merge \
  -d '{"fileIds":["file1","file2"]}'

# Expected: 401 Unauthorized
```

### Test Worker Failure Recovery
```bash
# 1. Start a job
# 2. Kill worker mid-processing (Ctrl+C)
# 3. Restart worker
# 4. Job should retry (up to 3 attempts)
```

---

## 10. Test Coverage Goals

### Current Coverage (Unit Tests)
```bash
npx jest --coverage

# Goal: >80% coverage for:
# - modules/pdf/services/*
# - lib/processing/pdf-processor.ts
```

### Integration Test Coverage (Future)
```bash
# Goal: Test all 7 API routes
# - POST /api/process/pdf/merge
# - POST /api/process/pdf/split
# - POST /api/process/pdf/compress
# - POST /api/process/pdf/watermark
# - POST /api/process/pdf/rotate
# - POST /api/process/pdf/extract-pages
# - POST /api/process/pdf/page-numbers
```

---

## Expected Test Results Summary

### Unit Tests (Services)
```
 PASS  __tests__/pdf-services.test.ts
  PDF Core Service
    ✓ should merge two PDFs (45ms)
    ✓ should split PDF into ranges (32ms)
    ✓ should extract specific pages (18ms)
    ✓ should rotate pages (22ms)
    ✓ should get PDF metadata (12ms)
    ✓ should set PDF metadata (25ms)
    ✓ should reorder pages (28ms)
  PDF Security Service
    ✓ should add watermark to PDF (35ms)
    ✓ should add page numbers (20ms)
    ✓ should add header (18ms)
    ✓ should add footer (18ms)
  PDF Compression Service
    ✓ should compress PDF (30ms)
    ✓ should remove metadata (15ms)
    ✓ should get file size (5ms)
    ✓ should estimate compression savings (3ms)
  PDF Conversion Service
    ✓ should convert images to PDF (25ms)
    ✓ should detect PNG image type (2ms)
    ✓ should detect JPEG image type (2ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Time:        2.5s
```

### TypeScript Checks
```bash
$ npm run type-check
> tsc --noEmit

# No output = success ✅
```

### Linting
```bash
$ npm run lint
✔ No ESLint warnings or errors
```

---

## Troubleshooting

### Tests Fail: "Cannot find module @/..."
```bash
# Make sure tsconfig.json has paths configured
# Run: npm install
```

### Tests Fail: "pdf-lib import error"
```bash
npm install pdf-lib@^1.17.1
```

### API Tests Fail: "ECONNREFUSED"
```bash
# Make sure dev server is running
npm run dev
```

### Worker Not Processing Jobs
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check worker logs for errors
npm run worker

# Check queue has jobs
redis-cli LLEN bullmq:pdf-processing:wait
```

### Database Errors
```bash
# Run migrations
npx prisma migrate dev

# Check connection
npx prisma db push
```

---

## Quick Test Checklist

Use this checklist to quickly verify everything works:

- [ ] Unit tests pass (`npx jest`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual test script runs (`npx tsx scripts/test-pdf-services.ts`)
- [ ] Can sign up/sign in via UI
- [ ] Can upload a PDF file
- [ ] Can create a merge job via API
- [ ] Worker picks up and processes job
- [ ] Job status updates correctly
- [ ] Can download result file
- [ ] Result PDF is valid and correct

---

## Next Steps

Once basic testing is complete:

1. Add integration tests for all API routes
2. Add E2E tests with Playwright
3. Set up CI/CD pipeline (GitHub Actions)
4. Add performance benchmarks
5. Set up error tracking (Sentry)
6. Add monitoring (Datadog, New Relic)

---

**Last Updated:** November 20, 2025
**Phase:** 3 - PDF Module Testing
