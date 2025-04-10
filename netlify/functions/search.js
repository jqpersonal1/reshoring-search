const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async (event) => {
  console.log("Function started"); // Debug log

  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    // 1. Test connection
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");

    // 2. List databases (debug)
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    console.log("Databases:", dbList.databases.map(d => d.name));

    // 3. Access productsdb
    const db = client.db("productsdb");
    console.log("Using database:", db.databaseName);

    // 4. List collections (debug)
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // 5. Query products
    const products = await db.collection("products").find().toArray();
    console.log("Found products:", products.length);

    if (products.length === 0) {
      throw new Error("No products found in collection");
    }

    // 6. Generate PDF
    const doc = new PDFDocument();
    doc.text("Debug Report - Products Found: " + products.length);
    products.forEach(p => doc.text(`${p.name} (${p.country}) - $${p.price}`));

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
        error: "PDF generation failed",
        details: error.message,
        debug: "Check Netlify Function Logs"
      })
    };
  } finally {
    await client.close();
  }
};
