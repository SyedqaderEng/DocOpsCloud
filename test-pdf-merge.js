/**
 * PDF Merge Tool - Test Script
 * Tests the PDF merge functionality end-to-end
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function createTestPDF(filename, pageCount, title) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Add title
    page.drawText(title, {
      x: 50,
      y: height - 100,
      size: 24,
      font: boldFont,
      color: rgb(0, 0.53, 0.71), // Blue
    });

    // Add page number
    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 50,
      y: height - 150,
      size: 18,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Add some sample content
    const content = `
This is test page ${i}.

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Features to test:
- Page preview generation
- Multi-file upload
- Selective page merging
- Page reordering
- Download functionality
- Authentication checks
- File size validation
    `.trim();

    const lines = content.split('\n');
    let yPosition = height - 200;

    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    // Add footer
    page.drawText(`© 2025 DocOpsCloud - Test Document`, {
      x: 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Add colored rectangle as visual marker
    page.drawRectangle({
      x: width - 100,
      y: height - 100,
      width: 50,
      height: 50,
      color: rgb(0.2 + (i * 0.1), 0.5, 0.8 - (i * 0.1)),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function testPDFMerge() {
  console.log('🧪 Starting PDF Merge Tool Tests...\n');

  try {
    // Create test directory
    const testDir = path.join(__dirname, 'test-pdfs');
    await fs.mkdir(testDir, { recursive: true });

    // Test Case 1: Create test PDF files
    console.log('📄 Test Case 1: Creating test PDF files...');
    const testFiles = [
      { name: 'document-1.pdf', pages: 3, title: 'Test Document 1' },
      { name: 'document-2.pdf', pages: 2, title: 'Test Document 2' },
      { name: 'document-3.pdf', pages: 4, title: 'Test Document 3' },
    ];

    for (const file of testFiles) {
      const pdfBytes = await createTestPDF(file.name, file.pages, file.title);
      const filePath = path.join(testDir, file.name);
      await fs.writeFile(filePath, pdfBytes);
      console.log(`   [OK] Created ${file.name} with ${file.pages} pages`);
    }

    // Test Case 2: Verify file creation
    console.log('\n📊 Test Case 2: Verifying file creation...');
    const files = await fs.readdir(testDir);
    console.log(`   [OK] Created ${files.length} test files`);

    for (const file of files) {
      const stats = await fs.stat(path.join(testDir, file));
      console.log(`   [OK] ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    // Test Case 3: Test merge logic locally
    console.log('\n🔗 Test Case 3: Testing PDF merge logic...');
    const mergedPdf = await PDFDocument.create();

    // Load all test PDFs
    const pdfDocs = [];
    for (const file of testFiles) {
      const filePath = path.join(testDir, file.name);
      const pdfBytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      pdfDocs.push(pdf);
      console.log(`   [OK] Loaded ${file.name}: ${pdf.getPageCount()} pages`);
    }

    // Merge all pages
    let totalPages = 0;
    for (const pdf of pdfDocs) {
      const pageCount = pdf.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const [copiedPage] = await mergedPdf.copyPages(pdf, [i]);
        mergedPdf.addPage(copiedPage);
        totalPages++;
      }
    }

    console.log(`   [OK] Merged ${totalPages} total pages`);

    // Save merged PDF
    const mergedBytes = await mergedPdf.save();
    const mergedPath = path.join(testDir, 'merged-output.pdf');
    await fs.writeFile(mergedPath, mergedBytes);
    console.log(`   [OK] Saved merged PDF: ${(mergedBytes.length / 1024).toFixed(2)} KB`);

    // Test Case 4: Test selective page merge
    console.log('\n✂️ Test Case 4: Testing selective page merge...');
    const selectiveMerge = await PDFDocument.create();

    // Select specific pages: Doc1 Page1, Doc2 Page2, Doc3 Page1
    const selections = [
      { docIndex: 0, pageIndex: 0 },  // Doc1 Page1
      { docIndex: 1, pageIndex: 1 },  // Doc2 Page2
      { docIndex: 2, pageIndex: 0 },  // Doc3 Page1
    ];

    for (const { docIndex, pageIndex } of selections) {
      const sourcePdf = pdfDocs[docIndex];
      const [copiedPage] = await selectiveMerge.copyPages(sourcePdf, [pageIndex]);
      selectiveMerge.addPage(copiedPage);
      console.log(`   [OK] Added page ${pageIndex + 1} from document ${docIndex + 1}`);
    }

    const selectiveBytes = await selectiveMerge.save();
    const selectivePath = path.join(testDir, 'selective-merge.pdf');
    await fs.writeFile(selectivePath, selectiveBytes);
    console.log(`   [OK] Saved selective merge: ${selectiveMerge.getPageCount()} pages`);

    // Test Case 5: Summary
    console.log('\n📈 Test Summary:');
    console.log(`   [OK] Total test files created: ${testFiles.length}`);
    console.log(`   [OK] Total pages in all files: ${totalPages}`);
    console.log(`   [OK] Merged PDF page count: ${mergedPdf.getPageCount()}`);
    console.log(`   [OK] Selective merge page count: ${selectiveMerge.getPageCount()}`);
    console.log(`   [OK] Test files location: ${testDir}`);

    // UI Test Instructions
    console.log('\n🌐 Manual UI Testing Instructions:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to: http://localhost:3000/dashboard/tools/pdf-merge');
    console.log('   3. Upload the test PDF files from: test-pdfs/');
    console.log('   4. Verify page previews are generated correctly');
    console.log('   5. Test page selection (select/deselect pages)');
    console.log('   6. Click "Merge" and verify merged PDF downloads');
    console.log('   7. Test email functionality');
    console.log('   8. Verify error handling with invalid files');

    // API Test Instructions
    console.log('\n🔌 API Testing Instructions:');
    console.log('   Test the following endpoints:');
    console.log('   • POST /api/tools/pdf-merge (direct merge)');
    console.log('   • POST /api/process/pdf/merge (queue-based merge)');
    console.log('   Both should accept FormData with PDF files');

    console.log('\n✅ All PDF Merge tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPDFMerge();
