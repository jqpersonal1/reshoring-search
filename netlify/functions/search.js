const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

// ====================== YOUR SETTINGS ======================
const MONGODB_USERNAME = 'jqpersonal1'; // Your MongoDB Atlas username
const MONGODB_PASSWORD = 'Tyran0saurus'; // <-- ONLY CHANGE THIS
const MONGODB_CLUSTER = 'product-search-db.ytzngnu.mongodb.net'; // From MongoDB Atlas
const DB_NAME = 'productsDB'; // Your database name in Atlas
const COLLECTION_NAME = 'suppliers'; // Your collection name in Atlas
// ===========================================================

// Build connection URL (DO NOT EDIT THIS LINE)
const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

exports.handler = async () => {
  console.log("Starting report generation...");
  const client = new MongoClient(MONGODB_URI);

  try {
    // 1. Connect to database
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to database!");

    // 2. Access your data
    const db = client.db(DB_NAME);
    console.log(`Using collection: ${COLLECTION_NAME}`);
    const suppliers = await db.collection(COLLECTION_NAME).find().limit(10).toArray();

    // 3. Generate PDF
    const doc = new PDFDocument();
    doc.font('Helvetica')
       .fontSize(20)
       .text('Supplier Report', { align: 'center' })
       .moveDown();

    suppliers.forEach(item => {
      doc.fontSize(12)
         .text(`• ${item.name || 'Unnamed Supplier'}`)
         .text(`  Country: ${item.country || 'Not specified'}`, { indent: 20 })
         .moveDown();
    });

    // 4. Create PDF file
    const pdfBuffer = await new Promise(resolve => {
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    // 5. Return the PDF
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=suppliers_report.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error("ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Report generation failed",
        message: error.message.replace(MONGODB_PASSWORD, 'REDACTED') // Hides your password
      })
    };
  } finally {
    await client.close();
  }
};
