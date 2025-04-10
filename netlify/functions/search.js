const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');
const fontkit = require('@pdf-lib/fontkit');
const { Buffer } = require('buffer');

// Register fontkit for PDFKit
PDFDocument.registerFont = function(name, src) {
  this.fontDescriptors[name] = new this.Font(src);
};

exports.handler = async (event) => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("productsDB");
    const suppliers = await db.collection("suppliers").find().limit(50).toArray();

    // Create PDF document
    const doc = new PDFDocument();
    
    // Use built-in Helvetica font
    doc.font('Helvetica');
    
    // Header
    doc.fontSize(20)
       .text('Supplier Report', { align: 'center' })
       .moveDown();

    // Content
    suppliers.forEach(supplier => {
      doc.fontSize(12)
         .text(`• ${supplier.name || 'Unnamed Supplier'}`)
         .text(`  Country: ${supplier.country || 'Unknown'}`, { indent: 20 })
         .text(`  Category: ${supplier.category || 'N/A'}`, { indent: 20 })
         .moveDown();
    });

    // Generate PDF buffer
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
    console.error('PDF generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate report",
        message: error.message
      })
    };
  } finally {
    await client.close();
  }
};
