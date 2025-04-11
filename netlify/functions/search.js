const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

// 1. REPLACE THESE VALUES WITH YOUR ACTUAL CREDENTIALS
const MONGODB_USERNAME = 'jqpersonal1'; // Your MongoDB username
const MONGODB_PASSWORD = 'Tyran0saurus'; // Your MongoDB password
const MONGODB_CLUSTER = 'product-search-db.ytzngnu.mongodb.net'; // From Atlas
const DB_NAME = 'productsDB'; // Your database name
const COLLECTION_NAME = 'suppliers'; // Your collection name

// 2. Construct connection string
const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

exports.handler = async () => {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // 3. Connect to DB
    await client.connect();
    const db = client.db(DB_NAME);
    const suppliers = await db.collection(COLLECTION_NAME).find().limit(10).toArray();

    // 4. Generate PDF
    const doc = new PDFDocument();
    doc.font('Helvetica') // Built-in font
       .fontSize(20)
       .text('Supplier Report', { align: 'center' });
    
    suppliers.forEach(supplier => {
      doc.fontSize(12)
         .text(`• ${supplier.name} - ${supplier.country}`);
    });

    // 5. Return PDF
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
        error: "Report generation failed",
        message: error.message
      })
    };
  } finally {
    await client.close();
  }
};
