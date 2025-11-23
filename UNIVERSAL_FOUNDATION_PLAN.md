# 🏗️ UNIVERSAL BACKEND FOUNDATION - Implementation Plan

**Date:** November 23, 2025
**Architecture:** Pipeline Orchestrator + Pluggable Engine Modules
**Target:** Support 300+ utilities with 5 universal endpoints

---

## 🎯 CORE ARCHITECTURE

### Universal API Contract (5 Endpoints Only)

```
POST   /api/upload              → Upload file, get fileId + metadata
GET    /api/preview/{fileId}    → Get thumbnails, pages, frames, metadata
POST   /api/process             → Execute pipeline of operations
GET    /api/status/{requestId}  → Check job status and progress
GET    /api/download/{token}    → Download processed result
```

**ALL 300 tools use these same 5 endpoints. No exceptions.**

---

## 📦 Module Interface (Universal Contract)

Every engine module MUST implement:

```typescript
interface EngineModule {
  // Validate input and options
  validate(options: any, fileMeta: FileMeta): ValidationResult

  // Execute the operation
  execute(inputPath: string, options: any, workDir: string): Promise<ExecutionResult>

  // Clean up temporary files
  cleanup(paths: string[]): Promise<void>

  // Describe module capabilities
  capabilities(): ModuleCapabilities

  // Optional: estimate processing cost
  estimateCost?(options: any): CostEstimate
}

interface ModuleCapabilities {
  module: string // e.g., "pdf.split"
  actions: string[] // e.g., ["keepPages", "removePages", "extractPages"]
  optionSchema: JSONSchema // Validation schema for options
  supportedMimes: string[] // e.g., ["application/pdf"]
}
```

---

## 🔄 Pipeline Processing Flow

### Example Request

```json
POST /api/process
{
  "fileId": "f123",
  "pipeline": [
    {
      "module": "pdf.split",
      "action": "keepPages",
      "options": {"pages": [1, 3, 5]}
    },
    {
      "module": "pdf.compress",
      "action": "compress",
      "options": {"level": "medium"}
    },
    {
      "module": "pdf.watermark",
      "action": "addText",
      "options": {"text": "CONFIDENTIAL", "position": "center"}
    }
  ],
  "preferSync": false,
  "notify": {
    "webhook": "https://example.com/callback"
  }
}
```

### Orchestrator Logic

1. **Validate Pipeline**
   - Check each module exists
   - Validate options using module.validate()
   - Check user quota and permissions

2. **Create Request**
   - Generate requestId
   - Store in database with status "queued"
   - Return requestId to frontend

3. **Execute Pipeline** (in worker)
   - For each step in pipeline:
     - Download input from storage
     - Call module.execute() in sandbox
     - Store intermediate output
     - Pass to next step
     - Log timing and cost

4. **Finalize**
   - Upload final output to storage
   - Generate signed download token
   - Update request status to "completed"
   - Call webhook if provided

---

## 📁 Module Organization

```
lib/
├── orchestrator/
│   ├── pipeline-executor.ts      # Core orchestrator
│   ├── module-loader.ts          # Dynamic module loading
│   ├── sandbox-runner.ts         # Secure execution
│   └── cost-tracker.ts           # Track processing costs
│
├── modules/
│   ├── pdf/
│   │   ├── split.module.ts       # pdf.split
│   │   ├── merge.module.ts       # pdf.merge
│   │   ├── compress.module.ts    # pdf.compress
│   │   ├── rotate.module.ts      # pdf.rotate
│   │   ├── watermark.module.ts   # pdf.watermark
│   │   └── extract-text.module.ts
│   │
│   ├── image/
│   │   ├── resize.module.ts      # image.resize
│   │   ├── crop.module.ts        # image.crop
│   │   ├── compress.module.ts    # image.compress
│   │   ├── convert.module.ts     # image.convert
│   │   └── filters.module.ts     # image.filters
│   │
│   ├── video/
│   │   ├── compress.module.ts    # video.compress
│   │   ├── trim.module.ts        # video.trim
│   │   ├── convert.module.ts     # video.convert
│   │   └── extract-audio.module.ts
│   │
│   ├── audio/
│   │   ├── compress.module.ts    # audio.compress
│   │   ├── trim.module.ts        # audio.trim
│   │   └── convert.module.ts     # audio.convert
│   │
│   ├── text/
│   │   ├── transform.module.ts   # text.transform (case, encode, etc.)
│   │   ├── analyze.module.ts     # text.analyze (word count, etc.)
│   │   └── generate.module.ts    # text.generate (lorem, password)
│   │
│   └── archive/
│       ├── compress.module.ts    # archive.compress
│       ├── extract.module.ts     # archive.extract
│       └── create.module.ts      # archive.create
│
├── storage/
│   ├── file-manager.ts           # Upload/download from S3/MinIO
│   ├── preview-generator.ts      # Generate thumbnails, previews
│   └── ttl-cleanup.ts            # Auto-delete expired files
│
└── queue/
    ├── job-processor.ts          # BullMQ worker
    └── retry-handler.ts          # Retry logic
```

---

## 🗄️ Database Schema

### Minimal Tables

```sql
-- Files (temporary, auto-deleted)
CREATE TABLE files (
  file_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  metadata JSONB,                    -- {pages: 10, duration: 120, etc.}
  uploaded_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,     -- TTL auto-delete
  INDEX(user_id),
  INDEX(expires_at)
);

-- Processing Requests
CREATE TABLE requests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NOT NULL,
  pipeline JSONB NOT NULL,            -- Store pipeline JSON
  status VARCHAR(20) NOT NULL,        -- queued, processing, completed, failed
  progress INT DEFAULT 0,             -- 0-100
  current_step INT DEFAULT 0,
  total_steps INT NOT NULL,
  output_token VARCHAR(128),          -- Signed download token
  error TEXT,
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX(user_id),
  INDEX(status)
);

-- Internal Module Calls (for cost tracking)
CREATE TABLE module_calls (
  id BIGSERIAL PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  options JSONB,
  start_ts TIMESTAMP NOT NULL,
  end_ts TIMESTAMP,
  duration_ms INT,
  status VARCHAR(20),
  cost_units DECIMAL(10,2),           -- Track internal costs
  INDEX(request_id),
  INDEX(module_name)
);

-- API Keys and Quotas
CREATE TABLE api_keys (
  key_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  api_key_hash VARCHAR(128) NOT NULL,
  plan VARCHAR(20) NOT NULL,          -- free, pro, business
  max_concurrent_jobs INT DEFAULT 3,
  max_file_size_mb INT DEFAULT 50,
  max_daily_requests INT DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  UNIQUE(api_key_hash)
);

-- Quotas Usage (reset daily)
CREATE TABLE quota_usage (
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  requests_count INT DEFAULT 0,
  processing_time_sec INT DEFAULT 0,
  PRIMARY KEY(user_id, date)
);
```

---

## 🔧 Implementation Steps

### Phase 1: Core Orchestrator (Week 1)

**Priority 1: Build Foundation**

1. **Create Universal API Routes** (4 hours)

   ```
   app/api/v2/
   ├── upload/route.ts
   ├── preview/[fileId]/route.ts
   ├── process/route.ts
   ├── status/[requestId]/route.ts
   └── download/[token]/route.ts
   ```

2. **Build Pipeline Orchestrator** (8 hours)

   ```typescript
   // lib/orchestrator/pipeline-executor.ts
   class PipelineExecutor {
     async execute(requestId: string, pipeline: PipelineStep[]) {
       // Validate all modules
       // Create work directory
       // Execute steps sequentially
       // Handle errors and retries
       // Return final output
     }
   }
   ```

3. **Create Module Interface** (4 hours)

   ```typescript
   // lib/modules/base-module.ts
   abstract class BaseModule implements EngineModule {
     abstract validate(options, fileMeta): ValidationResult
     abstract execute(inputPath, options, workDir): Promise<ExecutionResult>
     cleanup(paths): Promise<void> {
       /* default cleanup */
     }
     abstract capabilities(): ModuleCapabilities
   }
   ```

4. **Build File Manager** (6 hours)
   - Upload to S3/MinIO
   - Generate preview metadata
   - TTL management
   - Signed download URLs

5. **Setup Queue Worker** (4 hours)
   - BullMQ job processor
   - Retry logic
   - Status updates
   - Webhook notifications

**Total: ~26 hours = 3-4 days**

---

### Phase 2: First 5 Modules (Week 2)

Build first modules following the pattern:

1. **pdf.split** (4 hours)
   - Implement validate(), execute(), capabilities()
   - Actions: keepPages, removePages, extractPages
   - Test with orchestrator

2. **pdf.compress** (3 hours)
   - Actions: compress (low, medium, high)

3. **pdf.merge** (3 hours)
   - Actions: merge (multiple files)

4. **image.resize** (3 hours)
   - Actions: resize, scale, fit

5. **text.transform** (2 hours)
   - Actions: uppercase, lowercase, slugify, encode, decode

**Total: ~15 hours = 2 days**

**Result:** Working foundation + 5 modules

---

### Phase 3: Rapid Module Expansion (Weeks 3-4)

Once foundation is solid, add modules rapidly:

**Week 3: Add 20 modules**

- PDF: 5 more modules (rotate, watermark, extract-text, metadata, page-numbers)
- Image: 5 more modules (crop, filters, watermark, convert, optimize)
- Text: 10 modules (all text utilities - each is 1-2 hours)

**Week 4: Add 30 more modules**

- Video: 10 modules (using ffmpeg)
- Audio: 10 modules (using ffmpeg)
- Archive: 5 modules (zip, unzip, etc.)
- Code: 5 modules (formatters, minifiers)

**By end of Month 1:** 50+ working modules

---

## 📊 Benefits of This Architecture

### ✅ Scalability

- Adding new tool = 1 module file (2-4 hours)
- No API changes ever
- No frontend changes for new tools

### ✅ Composability

- Chain any operations together
- Frontend builds visual pipeline UI
- Power users can script complex workflows

### ✅ Consistency

- Same interface for all tools
- Same error handling
- Same retry logic
- Same logging

### ✅ Maintainability

- Each module is isolated
- Easy to test
- Easy to update
- Easy to debug

### ✅ Cost Tracking

- Track which operations cost the most
- Optimize heavy modules
- Bill accurately by usage

---

## 🚀 Migration Strategy

### What to Keep from Current Code

- ✅ Service layer logic (modules/pdf/services/core.ts becomes pdf.split module)
- ✅ BullMQ queue setup
- ✅ Database schema (adapt to new schema)
- ✅ Authentication/authorization

### What to Replace

- ❌ All 71 individual API routes → 5 universal routes
- ❌ Individual processors → Module-based processors
- ❌ Ad-hoc job handling → Pipeline orchestrator

### Migration Steps

1. Build new v2 API alongside v1
2. Migrate modules one by one
3. Test with frontend
4. Deprecate v1 once v2 stable
5. Remove old code

---

## 🎯 Success Criteria

**Week 1:** ✅ Orchestrator working, 1 module functional
**Week 2:** ✅ 5 modules working, pipeline tested
**Month 1:** ✅ 50 modules implemented
**Month 2:** ✅ 150 modules implemented
**Month 3:** ✅ All 300 modules complete

---

## 🛠️ Technology Stack

**Backend:**

- FastAPI or NestJS for universal API
- BullMQ for queue management
- MinIO or S3 for file storage
- PostgreSQL for metadata
- Redis for caching and queue

**Module Dependencies:**

- pdf-lib, PyMuPDF for PDF
- Sharp, libvips for images
- FFmpeg for video/audio
- LibreOffice for office docs
- Various CLI tools

**Deployment:**

- Docker containers for modules
- Kubernetes for orchestration
- Auto-scaling workers
- CDN for downloads

---

## 📝 Example Module Implementation

```typescript
// lib/modules/pdf/split.module.ts
import { BaseModule } from '../base-module'
import { PDFDocument } from 'pdf-lib'

export class PdfSplitModule extends BaseModule {
  capabilities() {
    return {
      module: 'pdf.split',
      actions: ['keepPages', 'removePages', 'extractPages', 'splitEvery'],
      optionSchema: {
        type: 'object',
        properties: {
          pages: { type: 'array', items: { type: 'number' } },
          splitEvery: { type: 'number' },
        },
      },
      supportedMimes: ['application/pdf'],
    }
  }

  validate(options: any, fileMeta: any) {
    if (fileMeta.mimeType !== 'application/pdf') {
      return { valid: false, error: 'PDF file required' }
    }
    if (!options.pages && !options.splitEvery) {
      return { valid: false, error: 'pages or splitEvery required' }
    }
    return { valid: true }
  }

  async execute(inputPath: string, options: any, workDir: string) {
    const pdfBuffer = await fs.readFile(inputPath)
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    // Execute split logic
    const pages = options.pages || this.generatePageRanges(pdfDoc, options.splitEvery)
    const outputPdf = await PDFDocument.create()

    for (const pageNum of pages) {
      const [page] = await outputPdf.copyPages(pdfDoc, [pageNum - 1])
      outputPdf.addPage(page)
    }

    const outputPath = path.join(workDir, 'output.pdf')
    await fs.writeFile(outputPath, await outputPdf.save())

    return {
      success: true,
      outputFiles: [outputPath],
      metadata: { pageCount: pages.length },
    }
  }
}
```

---

**Ready to start building the Universal Foundation?**

I recommend:

1. **Start with Orchestrator Core** (Week 1)
2. **Build first 3 modules** to prove the pattern works
3. **Then rapidly expand** to 300 modules

Should I start implementing the core orchestrator now?

---

_This architecture will serve you for years. It's the RIGHT way to build 300+ utilities._
