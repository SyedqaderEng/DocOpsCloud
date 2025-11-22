# Background Worker Setup Guide

## Overview

The DocOpsCloud platform uses background workers to handle heavy PDF processing tasks. This prevents timeouts and improves user experience by processing files asynchronously.

## Architecture

```
User Upload → API Endpoint → Queue → Worker → Database → Download
```

1. **Upload API** (`/api/process/upload`): Validates, saves files, creates job
2. **Queue** (Redis + BullMQ): Manages job queue with retry logic
3. **Worker** (`lib/workers/pdf-processor.ts`): Processes PDFs in background
4. **Download API** (`/api/download/[jobId]`): Serves processed files

## Features

✅ **Plan Enforcement**: Checks limits before queuing
✅ **Retry Logic**: Auto-retry failed jobs (3 attempts, exponential backoff)
✅ **Progress Tracking**: Real-time job status updates
✅ **Graceful Shutdown**: Clean worker termination
✅ **Concurrency Control**: Process multiple jobs simultaneously
✅ **Rate Limiting**: 10 jobs per second max
✅ **Auto Cleanup**: Temp files deleted after 1 minute

## Prerequisites

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Configure Environment

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

## Running the Worker

### Development

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start worker
npm run worker
```

### Production

```bash
# Using PM2 (recommended)
pm2 start npm --name "docops-worker" -- run worker
pm2 start npm --name "docops-app" -- start

# View logs
pm2 logs docops-worker
```

## Worker Scripts

Added to `package.json`:
```json
{
  "scripts": {
    "worker": "ts-node scripts/start-worker.ts",
    "worker:dev": "nodemon scripts/start-worker.ts"
  }
}
```

## Job Flow

### 1. User Uploads File

```typescript
// Dashboard tool page
const response = await fetch('/api/process/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
})

const { jobId } = await response.json()
```

### 2. Check Job Status

```typescript
// Poll for status
const statusRes = await fetch(`/api/process/status/${jobId}`, {
  headers: { 'Authorization': `Bearer ${token}` },
})

const { status, progress, downloadUrl } = await statusRes.json()
```

### 3. Download Result

```typescript
// When status === 'complete'
window.location.href = downloadUrl
```

## Supported Tools

Current implementation supports:
- **pdf-merge**: Combine multiple PDFs into one
- **pdf-split**: Extract pages from PDF
- **pdf-compress**: Reduce PDF file size

### Adding New Tools

1. Add case to `pdf-processor.ts`:
```typescript
case 'your-tool-id':
  ({ outputPath, outputFilename } = await yourToolFunction(files, uploadDir))
  break
```

2. Implement processing function:
```typescript
async function yourToolFunction(
  files: ProcessingJobData['files'],
  uploadDir: string
): Promise<{ outputPath: string; outputFilename: string }> {
  // Your processing logic here
  return { outputPath, outputFilename }
}
```

## Monitoring

### Check Worker Status
```bash
# View worker logs
pm2 logs docops-worker

# Check Redis queue
redis-cli LLEN bull:pdf-processing:wait
```

### Job Statistics
```bash
# In Redis CLI
redis-cli
> KEYS bull:pdf-processing:*
> LLEN bull:pdf-processing:completed
> LLEN bull:pdf-processing:failed
```

## Error Handling

### Retry Logic

Jobs automatically retry with exponential backoff:
- **Attempt 1**: Immediate
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 4 seconds delay
- **After 3 failures**: Marked as FAILED

### Common Issues

**Worker won't start:**
- Check Redis is running: `redis-cli ping` (should return "PONG")
- Verify REDIS_URL in .env
- Check port 6379 is available

**Jobs stuck in QUEUED:**
- Worker not running - start with `npm run worker`
- Check worker logs for errors
- Verify database connection

**Download fails:**
- Files auto-delete after 24 hours
- Check temp directory exists
- Verify file permissions

## Performance Tips

1. **Adjust Concurrency**: Change in `pdf-processor.ts`
```typescript
concurrency: 10, // Process 10 jobs at once
```

2. **Tune Rate Limiting**:
```typescript
limiter: {
  max: 20, // Max jobs
  duration: 1000, // Per second
}
```

3. **Scale Workers**: Run multiple worker processes
```bash
pm2 start npm --name "worker-1" -- run worker
pm2 start npm --name "worker-2" -- run worker
```

## Production Deployment

### Recommended Setup

1. **Separate Worker Server**: Run workers on dedicated instances
2. **Redis Cluster**: Use Redis Cluster for high availability
3. **Monitoring**: Set up alerts for failed jobs
4. **Auto-restart**: Use PM2 or systemd for auto-restart
5. **Log Rotation**: Configure log rotation to prevent disk fill

### Example PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'docops-app',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
    },
    {
      name: 'docops-worker',
      script: 'npm',
      args: 'run worker',
      instances: 4,
      exec_mode: 'fork',
    },
  ],
}
```

Deploy:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Testing

### Manual Testing

1. Start worker: `npm run worker`
2. Upload file via dashboard
3. Check job status in database
4. Verify processed file downloads

### Load Testing

```bash
# Generate 100 concurrent upload requests
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
   -p upload.json \
   http://localhost:3000/api/process/upload
```

## Troubleshooting

See worker logs:
```bash
pm2 logs docops-worker --lines 100
```

Clear stuck jobs:
```bash
# In redis-cli
FLUSHDB # ⚠️ WARNING: Clears all jobs!
```

Restart worker:
```bash
pm2 restart docops-worker
```

## Next Steps

- [ ] Implement S3/GCS upload for output files
- [ ] Add email notifications on job completion
- [ ] Implement job priority based on user tier
- [ ] Add webhook support for job status updates
- [ ] Implement progress streaming via WebSockets

---

For questions or issues, check logs and database job records first.
