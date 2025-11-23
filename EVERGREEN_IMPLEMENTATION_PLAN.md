# 🎯 TOP 20 EVERGREEN UTILITY CATEGORIES - Implementation Plan

**Date:** November 23, 2025
**Strategy:** No AI dependencies, High search volume, Works forever
**Total Tools:** ~300 evergreen utilities

---

## 📊 Implementation Status by Category

### ✅ CATEGORY 1: PDF & Document Utilities (20 tools)

**Status: 8/20 Implemented (40%)**

| #   | Tool                 | Status               | Priority | Effort |
| --- | -------------------- | -------------------- | -------- | ------ |
| 1   | PDF Split            | ✅ Working           | -        | -      |
| 2   | PDF Merge            | ✅ Working           | -        | -      |
| 3   | PDF Compress         | ✅ Working           | -        | -      |
| 4   | PDF Unlock           | ⚠️ API exists        | High     | 2h     |
| 5   | PDF Lock             | ⚠️ API exists        | High     | 2h     |
| 6   | PDF Rotate           | ✅ Working           | -        | -      |
| 7   | PDF Reorder          | ❌ Need              | High     | 3h     |
| 8   | PDF Crop             | ⚠️ API exists        | Medium   | 4h     |
| 9   | PDF to DOCX          | ❌ Need              | High     | 8h     |
| 10  | DOCX to PDF          | ⚠️ API exists        | High     | 6h     |
| 11  | PDF to PPT           | ❌ Need              | Medium   | 8h     |
| 12  | PPT to PDF           | ❌ Need              | Medium   | 6h     |
| 13  | PDF to Images        | ❌ Need              | High     | 4h     |
| 14  | Images to PDF        | ❌ Need              | High     | 3h     |
| 15  | PDF Extract Text     | ✅ Working           | -        | -      |
| 16  | PDF Extract Images   | ❌ Need              | High     | 4h     |
| 17  | PDF Reduce Pages     | ✅ Working (extract) | -        | -      |
| 18  | PDF Add Watermark    | ⚠️ API exists        | High     | 3h     |
| 19  | PDF Remove Watermark | ❌ Need              | Low      | 8h     |
| 20  | PDF Optimize         | ⚠️ Basic             | Medium   | 4h     |

**Quick Wins (Next 5 tools, ~20 hours):**

1. PDF Unlock/Lock (password security)
2. PDF to Images (pdfjs rendering)
3. Images to PDF (pdf-lib)
4. PDF Extract Images
5. PDF Reorder

---

### ✅ CATEGORY 2: Image Utilities (20 tools)

**Status: 7/20 Implemented (35%)**

| #   | Tool                         | Status        | Priority | Effort |
| --- | ---------------------------- | ------------- | -------- | ------ |
| 1   | Image Resize                 | ✅ Working    | -        | -      |
| 2   | Image Crop                   | ✅ Working    | -        | -      |
| 3   | Convert JPG ⇄ PNG            | ✅ Working    | -        | -      |
| 4   | Convert PNG ⇄ WebP           | ✅ Working    | -        | -      |
| 5   | Convert JPG ⇄ WebP           | ✅ Working    | -        | -      |
| 6   | Convert HEIC to JPG          | ❌ Need       | High     | 3h     |
| 7   | Image Rotate                 | ⚠️ API exists | High     | 1h     |
| 8   | Image Flip                   | ⚠️ API exists | High     | 1h     |
| 9   | Image Compress               | ✅ Working    | -        | -      |
| 10  | Image Metadata Viewer        | ⚠️ API exists | Medium   | 2h     |
| 11  | Image Metadata Remover       | ⚠️ API exists | Medium   | 1h     |
| 12  | Image Format Batch Converter | ❌ Need       | Medium   | 4h     |
| 13  | GIF to MP4                   | ❌ Need       | High     | 6h     |
| 14  | MP4 to GIF                   | ❌ Need       | High     | 6h     |
| 15  | GIF Compressor               | ❌ Need       | Medium   | 3h     |
| 16  | Image Blur                   | ✅ Working    | -        | -      |
| 17  | Image Sharpen                | ⚠️ API exists | High     | 1h     |
| 18  | Background Color Add         | ❌ Need       | Medium   | 2h     |
| 19  | Watermark Add                | ❌ Need       | High     | 3h     |
| 20  | Watermark Remove (basic)     | ❌ Need       | Low      | 6h     |

**Quick Wins (Next 5 tools, ~8 hours):**

1. Image Rotate (Sharp rotate)
2. Image Flip (Sharp flip)
3. Image Sharpen (Sharp sharpen)
4. Image Metadata Viewer (Sharp metadata)
5. Image Metadata Remover (Sharp withMetadata)

---

### ❌ CATEGORY 3: Video Tools (20 tools)

**Status: 0/20 Implemented (0%)**

**Dependencies Needed:** `ffmpeg` (install via system)

| Priority | Tool                   | Effort    | Notes                                  |
| -------- | ---------------------- | --------- | -------------------------------------- |
| High     | Video Compressor       | 4h        | ffmpeg -i input.mp4 -crf 28 output.mp4 |
| High     | Video Trim             | 3h        | ffmpeg -ss 00:00:10 -to 00:00:20       |
| High     | Video Format Converter | 3h        | ffmpeg -i input.mov output.mp4         |
| High     | Video to GIF           | 4h        | ffmpeg with palette generation         |
| High     | Extract Audio          | 2h        | ffmpeg -i video.mp4 audio.mp3          |
| Medium   | Video Rotate           | 2h        | ffmpeg transpose filter                |
| Medium   | Video Crop             | 3h        | ffmpeg crop filter                     |
| Medium   | Video Merge            | 4h        | ffmpeg concat                          |
| Medium   | Mute Video             | 1h        | ffmpeg -an                             |
| Medium   | Video Speed            | 2h        | ffmpeg setpts filter                   |
| Low      | All others             | 2-4h each | Various ffmpeg filters                 |

**Strategy:** Install ffmpeg, create video-processor.ts service

---

### ❌ CATEGORY 4: Audio Tools (20 tools)

**Status: 0/20 Implemented (0%)**

**Dependencies Needed:** `ffmpeg` (same as video)

| Priority | Tool                     | Effort    | Notes                    |
| -------- | ------------------------ | --------- | ------------------------ |
| High     | Audio Compressor         | 2h        | ffmpeg -b:a 128k         |
| High     | Audio Trimmer            | 2h        | ffmpeg -ss -to           |
| High     | Audio Joiner             | 3h        | ffmpeg concat            |
| High     | WAV to MP3               | 2h        | ffmpeg format conversion |
| High     | MP3 to WAV               | 2h        | ffmpeg format conversion |
| High     | Extract Audio from Video | 2h        | ffmpeg -vn               |
| Medium   | Audio Speed Changer      | 2h        | ffmpeg atempo filter     |
| Medium   | Audio Volume Booster     | 2h        | ffmpeg volume filter     |
| Medium   | Audio Format Converter   | 2h        | ffmpeg multi-format      |
| Low      | All others               | 2-3h each | Various ffmpeg filters   |

**Strategy:** Reuse ffmpeg, create audio-processor.ts service

---

### ⚠️ CATEGORY 5: File Conversion Tools (20 tools)

**Status: 3/20 Implemented (15%)**

| #   | Tool                   | Status        | Priority | Effort |
| --- | ---------------------- | ------------- | -------- | ------ |
| 1   | CSV → JSON             | ⚠️ Basic      | High     | 2h     |
| 2   | JSON → CSV             | ⚠️ Basic      | High     | 2h     |
| 3   | Excel → CSV            | ⚠️ API exists | High     | 2h     |
| 4   | CSV → Excel            | ❌ Need       | High     | 2h     |
| 5   | XML → JSON             | ❌ Need       | Medium   | 3h     |
| 6   | JSON → XML             | ❌ Need       | Medium   | 3h     |
| 7   | PPT → PDF              | ❌ Need       | High     | 6h     |
| 8   | PDF → PPT              | ❌ Need       | Medium   | 8h     |
| 9   | TXT → PDF              | ❌ Need       | High     | 2h     |
| 10  | HTML → PDF             | ❌ Need       | High     | 4h     |
| 11  | Markdown → PDF         | ❌ Need       | High     | 3h     |
| 12  | ZIP Extract            | ❌ Need       | High     | 2h     |
| 13  | RAR Extract            | ❌ Need       | Medium   | 3h     |
| 14  | 7Z Extract             | ❌ Need       | Medium   | 3h     |
| 15  | Convert Folders to ZIP | ❌ Need       | High     | 2h     |
| 16  | Docx → Txt             | ⚠️ API exists | High     | 2h     |
| 17  | Txt → Docx             | ❌ Need       | Medium   | 3h     |
| 18  | XLSX → PDF             | ❌ Need       | High     | 4h     |
| 19  | EPUB → PDF             | ❌ Need       | Low      | 6h     |
| 20  | MOBI → PDF             | ❌ Need       | Low      | 6h     |

**Quick Wins (Next 5 tools, ~10 hours):**

1. TXT → PDF (simple text to PDF)
2. ZIP Extract (archiver library)
3. Folders → ZIP (archiver library)
4. Markdown → PDF (markdown-it + PDF)
5. HTML → PDF (puppeteer or similar)

---

### ✅ CATEGORY 6: Text Utility Tools (20 tools)

**Status: 0/20 but EASY! (0%)**

**ALL tools are 30min - 1 hour each! Pure JavaScript logic.**

| Tool               | Effort   | Implementation                   |
| ------------------ | -------- | -------------------------------- |
| Word Counter       | 30min    | text.split(/\s+/).length         |
| Character Counter  | 30min    | text.length                      |
| Case Converter     | 30min    | toUpperCase/toLowerCase          |
| Remove Line Breaks | 30min    | text.replace(/\n/g, '')          |
| Remove Duplicates  | 1h       | Set + join                       |
| Sort Lines         | 30min    | split + sort + join              |
| Reverse Text       | 30min    | split('').reverse().join('')     |
| URL Encoder        | 30min    | encodeURIComponent()             |
| URL Decoder        | 30min    | decodeURIComponent()             |
| Base64 Encode      | 30min    | Buffer.from().toString('base64') |
| Base64 Decode      | 30min    | Buffer.from(str, 'base64')       |
| Password Generator | 1h       | crypto.randomBytes()             |
| Lorem Ipsum        | 30min    | Predefined text templates        |
| Slug Generator     | 30min    | toLowerCase + replace spaces     |
| Text Encrypt       | 2h       | crypto module                    |
| Text Decrypt       | 2h       | crypto module                    |
| All others         | 30min-1h | Simple string operations         |

**Quick Wins: ALL 20 tools in ~1 day (15 hours total)**

---

### ✅ CATEGORY 7: Web / URL Tools (20 tools)

**Status: 1/20 Implemented (5%)**

| #   | Tool                 | Status  | Priority | Effort    |
| --- | -------------------- | ------- | -------- | --------- |
| 1   | URL Shortener        | ❌ Need | High     | 4h        |
| 2   | QR Code Generator    | ❌ Need | High     | 2h        |
| 3   | Barcode Generator    | ❌ Need | High     | 2h        |
| 4   | URL UTM Builder      | ❌ Need | High     | 1h        |
| 5   | SSL Checker          | ❌ Need | Medium   | 3h        |
| 6   | DNS Lookup           | ❌ Need | Medium   | 2h        |
| 7   | IP Lookup            | ❌ Need | Medium   | 2h        |
| 8   | HTTP Header Viewer   | ❌ Need | Medium   | 2h        |
| 9   | Open Graph Preview   | ❌ Need | Medium   | 3h        |
| 10  | Meta Tag Extractor   | ❌ Need | Medium   | 2h        |
| 11  | Website Screenshot   | ❌ Need | High     | 4h        |
| 12  | URL Redirect Checker | ❌ Need | Medium   | 2h        |
| 13  | Email Validator      | ❌ Need | High     | 1h        |
| 14  | All others           | ❌ Need | Low-Med  | 2-3h each |

**Dependencies:** qrcode library, puppeteer (screenshots), dns module

**Quick Wins (Next 5 tools, ~10 hours):**

1. QR Code Generator (qrcode library)
2. Barcode Generator (jsbarcode library)
3. URL UTM Builder (pure JS)
4. Email Validator (regex + DNS check)
5. DNS Lookup (Node dns module)

---

### ⚠️ CATEGORY 8: Development / Code Tools (20 tools)

**Status: 0/20 but EASY! (0%)**

**ALL tools are simple formatters/validators - 1-2 hours each**

| Tool                | Effort | Library                |
| ------------------- | ------ | ---------------------- |
| JSON Formatter      | 1h     | JSON.stringify(indent) |
| JSON Validator      | 1h     | try/catch JSON.parse   |
| XML Formatter       | 2h     | xml-formatter library  |
| XML Validator       | 2h     | xml2js library         |
| YAML ⇄ JSON         | 2h     | js-yaml library        |
| Code Minifier (JS)  | 2h     | terser library         |
| Code Minifier (CSS) | 2h     | csso library           |
| Code Beautifier     | 2h     | prettier library       |
| SQL Formatter       | 2h     | sql-formatter library  |
| Regex Tester        | 2h     | Pure JS + exec()       |
| UUID Generator      | 30min  | uuid library           |
| JWT Decoder         | 1h     | jwt-decode library     |
| Base64 Converter    | 1h     | Buffer operations      |
| Diff Checker        | 2h     | diff library           |
| Markdown Preview    | 2h     | marked library         |
| All others          | 1-2h   | Various npm libraries  |

**Quick Wins: ALL 20 tools in ~2 days (30 hours total)**

---

### ⚠️ CATEGORY 9: Security Tools (15 tools)

**Status: 1/15 Implemented (7%)**

| #   | Tool                      | Status        | Priority | Effort    |
| --- | ------------------------- | ------------- | -------- | --------- |
| 1   | SHA256 Hash               | ⚠️ API exists | High     | 1h        |
| 2   | MD5 Hash                  | ⚠️ API exists | High     | 1h        |
| 3   | SHA512 Hash               | ❌ Need       | High     | 1h        |
| 4   | Password Strength Checker | ❌ Need       | High     | 2h        |
| 5   | URL Safe Encoder          | ❌ Need       | Medium   | 1h        |
| 6   | File Hash Checker         | ❌ Need       | High     | 2h        |
| 7   | HMAC Generator            | ❌ Need       | Medium   | 2h        |
| 8   | Salt Generator            | ❌ Need       | Medium   | 1h        |
| 9   | PDF Encryption            | ⚠️ API exists | High     | 3h        |
| 10  | File Encryption           | ❌ Need       | Medium   | 4h        |
| 11  | All others                | ❌ Need       | Low-Med  | 2-4h each |

**All use Node crypto module - EASY implementations**

**Quick Wins (Next 5 tools, ~7 hours):**

1. SHA256/MD5/SHA512 Hash (crypto.createHash)
2. Password Strength (regex patterns)
3. Salt Generator (crypto.randomBytes)
4. HMAC Generator (crypto.createHmac)
5. File Hash Checker (crypto hash stream)

---

### ❌ CATEGORY 10-15: Remaining Categories

**Categories 10-15 Status:** 0% implemented

- **Category 10:** Productivity Tools (20 tools) - Calculators, templates
- **Category 11:** System Utilities (20 tools) - File operations
- **Category 12:** Data Tools (20 tools) - CSV/Excel operations
- **Category 13:** Business & Finance (18 tools) - Calculators
- **Category 14:** Writing & Editing (20 tools) - Text operations
- **Category 15:** Misc Tools (17 tools) - Various utilities

**Most are 1-3 hour implementations each**

---

## 🎯 MASTER IMPLEMENTATION PRIORITY

### 🔥 PHASE 1: Complete PDF Category (Next 5 tools, ~20 hours)

**Target: 13/20 PDF tools working**

1. **PDF Unlock/Lock** (4h total)
   - Use pdf-lib encryption features
   - High demand tool

2. **PDF to Images** (4h)
   - Use pdfjs-dist rendering
   - Convert each page to PNG/JPEG

3. **Images to PDF** (3h)
   - Use pdf-lib to embed images
   - Popular tool

4. **PDF Extract Images** (4h)
   - Parse PDF structure
   - Extract embedded images

5. **PDF Reorder** (3h)
   - Drag-and-drop page reordering
   - Use existing split/merge

---

### ⚡ PHASE 2: Quick Wins - Text Utilities (ALL 20 tools, ~15 hours)

**Target: 20/20 Text tools working**

**Why:** Fastest ROI - all tools are 30min-1h each!

- Word Counter
- Character Counter
- Case Converter
- Line operations
- Encoders/Decoders
- Password Generator
- Lorem Ipsum
- All string operations

**Impact:** +20 working tools in 1 day!

---

### 🚀 PHASE 3: Image Tools Completion (Next 5 tools, ~8 hours)

**Target: 12/20 Image tools working**

1. Image Rotate (1h)
2. Image Flip (1h)
3. Image Sharpen (1h)
4. Image Metadata Viewer (2h)
5. Image Watermark Add (3h)

---

### 📦 PHASE 4: File Conversions (Next 5 tools, ~10 hours)

**Target: 8/20 Conversion tools working**

1. TXT → PDF (2h)
2. ZIP Extract (2h)
3. Folders → ZIP (2h)
4. Markdown → PDF (3h)
5. CSV → Excel (1h)

---

### 💻 PHASE 5: Code/Dev Tools (ALL 20 tools, ~30 hours)

**Target: 20/20 Code tools working**

All formatters, validators, generators

- JSON, XML, YAML tools
- Code minifiers/beautifiers
- UUID, JWT, Base64 tools

**Impact:** +20 developer tools, high search volume

---

### 🔐 PHASE 6: Security Tools (Next 5 tools, ~7 hours)

**Target: 6/15 Security tools working**

1. SHA256/MD5/SHA512 (3h total)
2. Password Strength (2h)
3. Salt Generator (1h)
4. HMAC Generator (1h)

---

### 🎬 PHASE 7: Video & Audio Tools (Requires ffmpeg setup)

**Target: Install ffmpeg first, then implement tools**

---

## 📈 SUCCESS METRICS

**Current Status:**

- ✅ Working Tools: 15/300 (5%)
- ⚠️ API Ready: 50/300 (17%)
- ❌ Not Started: 235/300 (78%)

**After Phase 1-6 (Target: 2 weeks):**

- ✅ Working Tools: 100+/300 (33%+)
- High-value categories completed:
  - PDF: 13/20 (65%)
  - Images: 12/20 (60%)
  - Text: 20/20 (100%)
  - Code: 20/20 (100%)
  - Security: 6/15 (40%)
  - Conversions: 8/20 (40%)

**Month 1 Goal:** 150+ working tools (50%)
**Month 2 Goal:** 250+ working tools (83%)
**Month 3 Goal:** ALL 300 tools working (100%)

---

## 🛠️ TECHNICAL STACK REQUIRED

### Already Installed ✅

- pdf-lib, pdfjs-dist (PDF)
- sharp (Images)
- docx, mammoth (Word)
- xlsx, papaparse (Excel/CSV)
- tesseract.js (OCR)

### Need to Install 📦

```bash
# Video/Audio processing
npm install fluent-ffmpeg

# Archive operations
npm install archiver unzipper

# Code formatting
npm install prettier terser csso sql-formatter

# Parsers
npm install xml2js js-yaml marked

# QR/Barcode
npm install qrcode jsbarcode

# Security
npm install bcrypt (already have)

# Utils
npm install uuid jwt-decode diff
```

---

## 🚀 LET'S START!

**Recommendation:** Start with **PHASE 2 (Text Utilities)**

**Why:**

- ✅ Fastest ROI (20 tools in 15 hours)
- ✅ No complex dependencies
- ✅ High search volume
- ✅ Pure JavaScript logic
- ✅ Confidence builder

Then move to Phase 1 (complete PDF category).

**Want me to start implementing Text Utilities now?** We can bang out 5-10 tools in the next hour!

---

_Last Updated: November 23, 2025_
_Focus: Evergreen utilities, no AI, maximum search volume_
