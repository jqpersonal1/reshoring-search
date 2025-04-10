const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async () => {
  const uri = "mongodb+srv://jqpersonal1:Tyran0saurus@product-search-db.ytzngnu.mongodb.net/productsDB?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("productsDB");
    const products = await db.collection("suppliers").find().toArray(); // ← Critical fix

    const doc = new PDFDocument({ font: 'Courier' });
    doc.text('Supplier Report', { align: 'center' });
    products.forEach(item => {
      doc.text(`• ${item.name} (${item.country}) - ${item.category}`);
    });

    const pdfBuffer = await new Promise(resolve => {
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
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
  } finally {
    await client.close();
  }
};
