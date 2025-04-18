const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async () => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    tls: true // Keep TLS but remove directConnection
  });

  try {
    await client.connect();
    const db = client.db("productsDB");
    const products = await db.collection("products").find().toArray();

    const doc = new PDFDocument({ font: 'Courier' });
    doc.text('Product Report', { align: 'center' });
    products.forEach(p => {
      doc.text(`${p.name} - ${p.country} - $${p.price}`);
    });

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
        error: "Database connection failed",
        details: error.message,
        solution: "1. Check MongoDB Atlas IP whitelist 2. Verify password"
      })
    };
  } finally {
    await client.close();
  }
};
