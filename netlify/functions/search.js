const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    // 1. Connect to EXACT database name (productsDB)
    await client.connect();
    const db = client.db("productsDB"); // ← Case-sensitive match
    
    // 2. Query the EXACT collection name (products)
    const products = await db.collection("products").find().toArray();
    if (products.length === 0) throw new Error("Collection is empty");

    // 3. Generate PDF
    const doc = new PDFDocument();
    doc.text('Your Products:', { align: 'center' });
    products.forEach(p => {
      doc.text(`• ${p.name} (${p.country}) - $${p.price}`);
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
        error: "PDF failed",
        details: error.message,
        debugTip: "Confirmed: Using db='productsDB', collection='products'"
      })
    };
  } finally {
    await client.close();
  }
};
