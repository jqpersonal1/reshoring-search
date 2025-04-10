const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    // Connect to DB
    await client.connect();
    const db = client.db("productsDB");
    
    // Get products
    const products = await db.collection("products").find().toArray();
    if (products.length === 0) throw new Error("No products found");

    // Create PDF with built-in font
    const doc = new PDFDocument({
      font: 'Courier' // Using built-in font only
    });
    
    // Simple PDF content
    doc.text('Product Report', { align: 'center' });
    products.forEach(p => {
      doc.text(`${p.name} - ${p.country} - $${p.price}`);
    });

    // Return PDF
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
