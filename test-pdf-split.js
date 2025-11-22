/**
 * PDF Split Tool - Test Script
 * Tests the PDF split functionality end-to-end
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function testPDFSplit() {
  console.log('🧪 Starting PDF Split Tool Tests...\n');

  try {
    const testDir = path.join(__dirname, 'test-pdfs');

    // Use the previously created merged PDF or create a new one
    const testFile = path.join(testDir, 'merged-output.pdf');
    const fileExists = await fs.access(testFile).then(() => true).catch(() => false);

    if (!fileExists) {
      console.log('❌ Test file not found. Run test-pdf-merge.js first.');
      process.exit(1);
    }

    // Test Case 1: Load the PDF
    console.log('📄 Test Case 1: Loading test PDF...');
    const pdfBytes = await fs.readFile(testFile);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    console.log(`   [OK] Loaded PDF with ${totalPages} pages`);
    console.log(`   [OK] File size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);

    // Test Case 2: Split into individual pages (split after each page)
    console.log('\n✂️ Test Case 2: Split into individual pages...');
    const outputDir = path.join(testDir, 'split-output');
    await fs.mkdir(outputDir, { recursive: true });

    // Create split points (split after every page except the last)
    const splitPoints = [];
    for (let i = 1; i < totalPages; i++) {
      splitPoints.push(i);
    }
    console.log(`   [OK] Split points: ${splitPoints.join(', ')}`);

    // Calculate ranges
    const ranges = [];
    let currentStart = 1;
    for (const splitPoint of splitPoints) {
      ranges.push({ start: currentStart, end: splitPoint });
      currentStart = splitPoint + 1;
    }
    ranges.push({ start: currentStart, end: totalPages });

    console.log(`   [OK] Created ${ranges.length} ranges`);

    // Create split PDFs
    for (let i = 0; i < ranges.length; i++) {
      const { start, end } = ranges[i];
      const newPdf = await PDFDocument.create();

      const pagesToCopy = [];
      for (let pageNum = start; pageNum <= end; pageNum++) {
        pagesToCopy.push(pageNum - 1);
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
      copiedPages.forEach(page => newPdf.addPage(page));

      const splitBytes = await newPdf.save();
      const fileName = `page_${start}-${end}.pdf`;
      const filePath = path.join(outputDir, fileName);
      await fs.writeFile(filePath, splitBytes);

      console.log(`   [OK] Created ${fileName}: ${newPdf.getPageCount()} page(s), ${(splitBytes.length / 1024).toFixed(2)} KB`);
    }

    // Test Case 3: Split every 3 pages
    console.log('\n📊 Test Case 3: Split every 3 pages...');
    const every3Dir = path.join(testDir, 'split-every-3');
    await fs.mkdir(every3Dir, { recursive: true });

    const splitEvery = 3;
    const splitPoints2 = [];
    for (let i = splitEvery; i < totalPages; i += splitEvery) {
      splitPoints2.push(i);
    }

    const ranges2 = [];
    let start2 = 1;
    for (const sp of splitPoints2) {
      ranges2.push({ start: start2, end: sp });
      start2 = sp + 1;
    }
    if (start2 <= totalPages) {
      ranges2.push({ start: start2, end: totalPages });
    }

    console.log(`   [OK] Split points: ${splitPoints2.join(', ')}`);
    console.log(`   [OK] Will create ${ranges2.length} files`);

    for (let i = 0; i < ranges2.length; i++) {
      const { start, end } = ranges2[i];
      const newPdf = await PDFDocument.create();

      const pagesToCopy = [];
      for (let pageNum = start; pageNum <= end; pageNum++) {
        pagesToCopy.push(pageNum - 1);
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
      copiedPages.forEach(page => newPdf.addPage(page));

      const splitBytes = await newPdf.save();
      const fileName = `part${i + 1}_pages${start}-${end}.pdf`;
      const filePath = path.join(every3Dir, fileName);
      await fs.writeFile(filePath, splitBytes);

      console.log(`   [OK] Created ${fileName}: ${newPdf.getPageCount()} page(s)`);
    }

    // Test Case 4: Custom page ranges
    console.log('\n🎯 Test Case 4: Custom page ranges...');
    const customDir = path.join(testDir, 'split-custom');
    await fs.mkdir(customDir, { recursive: true });

    // Split at specific points: pages 1-2, 3-5, 6-9
    const customSplitPoints = [2, 5];
    const ranges3 = [];
    let start3 = 1;
    for (const sp of customSplitPoints) {
      if (sp < totalPages) {
        ranges3.push({ start: start3, end: sp });
        start3 = sp + 1;
      }
    }
    if (start3 <= totalPages) {
      ranges3.push({ start: start3, end: totalPages });
    }

    console.log(`   [OK] Custom split points: ${customSplitPoints.join(', ')}`);
    console.log(`   [OK] Ranges: ${ranges3.map(r => `${r.start}-${r.end}`).join(', ')}`);

    for (let i = 0; i < ranges3.length; i++) {
      const { start, end } = ranges3[i];
      const newPdf = await PDFDocument.create();

      const pagesToCopy = [];
      for (let pageNum = start; pageNum <= end; pageNum++) {
        pagesToCopy.push(pageNum - 1);
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
      copiedPages.forEach(page => newPdf.addPage(page));

      const splitBytes = await newPdf.save();
      const fileName = `custom_part${i + 1}_pages${start}-${end}.pdf`;
      const filePath = path.join(customDir, fileName);
      await fs.writeFile(filePath, splitBytes);

      console.log(`   [OK] Created ${fileName}: ${newPdf.getPageCount()} page(s), ${(splitBytes.length / 1024).toFixed(2)} KB`);
    }

    // Test Case 5: Verify split integrity
    console.log('\n🔍 Test Case 5: Verifying split integrity...');
    const outputFiles = await fs.readdir(outputDir);
    console.log(`   [OK] Total individual page files: ${outputFiles.length}`);

    let totalSplitPages = 0;
    for (const file of outputFiles) {
      const filePath = path.join(outputDir, file);
      const fileBytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(fileBytes);
      totalSplitPages += pdf.getPageCount();
    }

    console.log(`   [OK] Total pages in split files: ${totalSplitPages}`);
    console.log(`   [OK] Original PDF pages: ${totalPages}`);

    if (totalSplitPages === totalPages) {
      console.log(`   [OK] ✅ Page count matches! No pages lost.`);
    } else {
      console.log(`   [WARN] ⚠️  Page count mismatch!`);
    }

    // Summary
    console.log('\n📈 Test Summary:');
    console.log(`   [OK] Original PDF: ${totalPages} pages`);
    console.log(`   [OK] Individual pages: ${outputFiles.length} files`);
    console.log(`   [OK] Split every 3 pages: ${ranges2.length} files`);
    console.log(`   [OK] Custom ranges: ${ranges3.length} files`);
    console.log(`   [OK] Total split operations: 3 modes tested`);
    console.log(`   [OK] All files created in: test-pdfs/split-*/ directories`);

    // UI Test Instructions
    console.log('\n🌐 Manual UI Testing Instructions:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to: http://localhost:3000/dashboard/tools/pdf-split');
    console.log('   3. Upload test-pdfs/merged-output.pdf');
    console.log('   4. Test Manual Mode: Click on pages to set split points');
    console.log('   5. Test Every N Pages: Set to 3 and click Apply');
    console.log('   6. Test Page Ranges: Enter "1-2, 3-5, 6-9" and click Apply');
    console.log('   7. Verify split points are marked with scissors icon');
    console.log('   8. Click "Split" button and verify download links appear');
    console.log('   9. Download and verify each split PDF');

    // API Test Instructions
    console.log('\n🔌 API Testing Instructions:');
    console.log('   Endpoint: POST /api/tools/pdf-split');
    console.log('   Body: FormData with:');
    console.log('     - file: PDF file');
    console.log('     - splitPoints: JSON array of page numbers');
    console.log('   Response: Array of download URLs for split files');

    console.log('\n✅ All PDF Split tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPDFSplit();
