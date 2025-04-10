const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');
const { Buffer } = require('buffer');
const standardFonts = require('@pdf-lib/standard-fonts');

exports.handler = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("productsDB");
    const suppliers = await db.collection("suppliers").find().limit(50).toArray();

    // Create PDF with built-in fonts
    const doc = new PDFDocument();
    
    // Force use of standard PDF fonts (no external files needed)
    doc.font('Helvetica');
    
    // Header
    doc.fontSize(20)
       .text('Supplier Report', { align: 'center' })
       .moveDown();

    // Content
    suppliers.forEach(supplier => {
      doc.fontSize(12)
         .text(`• ${supplier.name || 'Unnamed'}`)
         .text(`  Country: ${supplier.country || 'Unknown'}`, { indent: 20 })
         .text(`  Category: ${supplier.category || 'N/A'}`, { indent: 20 })
         .moveDown();
    });

    // Generate PDF
    const pdfBuffer = await new Promise(resolve => {
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=suppliers.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "PDF generation failed",
        message: error.message.replace(/mongodb\+srv:\/\/.*@/, 'mongodb+srv://USERNAME:REDACTED@')
      })
    };
  } finally {
    await client.close();
  }
};
