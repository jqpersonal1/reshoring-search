const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');
const standardFonts = require('@pdf-lib/standard-fonts');
const { Buffer } = require('buffer');

// Force PDFKit to use built-in fonts
PDFDocument.prototype.font = function() {
  return this.font('Helvetica');
};

exports.handler = async () => {
  const uri = process.env.MONGODB_URI || "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/productsDB?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("productsDB");
    const suppliers = await db.collection("suppliers").find().limit(10).toArray();

    const doc = new PDFDocument();
    doc.font('Helvetica')
       .fontSize(20)
       .text('Supplier Report', { align: 'center' });

    suppliers.forEach(item => {
      doc.fontSize(12)
         .text(`• ${item.name} - ${item.country}`);
    });

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
        'Content-Disposition': 'attachment; filename=report.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Report failed",
        message: error.message
      })
    };
  } finally {
    await client.close();
  }
};
