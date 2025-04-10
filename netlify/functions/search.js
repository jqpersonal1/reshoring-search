const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

exports.handler = async (event) => {
  try {
    // 1. Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("productsdb");

    // 2. Get products (test with 5 first)
    const products = await db.collection("products").find().limit(5).toArray();
    if (products.length === 0) throw new Error("No products found");

    // 3. Create PDF with built-in font
    const doc = new PDFDocument({
      // This forces PDFKit to use its built-in font
      font: 'Courier'
    });
    
    doc.text('Product Report', { align: 'center' });
    products.forEach(p => doc.text(`${p.name} - ${p.country}`));

    // 4. Stream the response
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    await new Promise(resolve => doc.on('end', resolve));
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=report.pdf'
      },
      body: Buffer.concat(chunks).toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "PDF generation failed",
        details: error.message
      })
    };
  }
};
