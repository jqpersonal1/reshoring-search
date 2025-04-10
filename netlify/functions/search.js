const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async () => {
  // 1. Hardcode the URI for testing (replace with your actual URI)
  const uri = "mongodb+srv://jqpersonal1:pXkvxaFA43FExUqo@product-search-db.ytzngnu.mongodb.net/productsDB?retryWrites=true&w=majority";
  
  // 2. Validate URI format
  if (!uri.startsWith('mongodb')) {
    throw new Error('Invalid URI - must start with mongodb:// or mongodb+srv://');
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    // 3. Connect with error handling
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");

    // 4. Debug: List databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log("Databases:", dbs.databases.map(db => db.name));

    // 5. Access productsDB
    const db = client.db("productsDB");
    const products = await db.collection("products").find().toArray();
    console.log("Found products:", products.length);

    // 6. Generate PDF
    const doc = new PDFDocument({ font: 'Courier' });
    doc.text('Product Report', { align: 'center' });
    products.forEach(p => doc.text(`${p.name} - ${p.country}`));

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
        'Content-Disposition': 'attachment; filename=report.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error("FULL ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed",
        details: error.message,
        uri: uri // For debugging
      })
    };
  } finally {
    await client.close();
  }
};
