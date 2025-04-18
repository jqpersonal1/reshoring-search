const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async () => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    directConnection: true, // Bypasses DNS issues
    tls: true
  });

  try {
    // 1. Connect to DB
    await client.connect();
    const db = client.db("productsDB");
    
    // 2. Get products
    const products = await db.collection("products").find().toArray();
    if (products.length === 0) throw new Error("No products found");

    // 3. Generate PDF
    const doc = new PDFDocument({ font: 'Courier' }); // Built-in font only
    doc.text('Product Report', { align: 'center' });
    products.forEach(p => {
      doc.text(`${p.name} - ${p.country} - $${p.price}`);
    });

    // 4. Return PDF
    const pdfBuffer = await new Promise(resolve => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.end();
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=products.pdf'
      },
      body: pdfBuffer.toString('base64'),
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
  } finally {
    await client.close();
  }
};
