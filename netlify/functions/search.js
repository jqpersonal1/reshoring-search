const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit-browserified');
const { Buffer } = require('buffer');

exports.handler = async (event) => {
  // 1. Set up MongoDB connection
  const uri = process.env.MONGODB_URI || "mongodb+srv://username:password@cluster.mongodb.net/productsDB?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000
  });

  try {
    // 2. Connect to database
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");
    
    const db = client.db("productsDB");
    const collection = db.collection("suppliers");

    // 3. Get report parameters from query string
    const { limit = "20", report_type = "basic" } = event.queryStringParameters || {};
    
    // 4. Fetch data
    const products = await collection.find()
      .limit(parseInt(limit))
      .toArray();

    if (products.length === 0) {
      throw new Error("No products found in the suppliers collection");
    }

    // 5. Create PDF document
    const doc = new PDFDocument();
    
    // Header
    doc.fontSize(20)
       .text('Supplier Product Report', { align: 'center', underline: true })
       .moveDown();

    // Table Header
    doc.fontSize(12)
       .text('Product Name', 50, doc.y)
       .text('Country', 250, doc.y)
       .text('Price', 350, doc.y)
       .moveDown();

    // Table Rows
    let yPosition = doc.y;
    products.forEach((product) => {
      doc.fontSize(10)
         .text(product.name || 'N/A', 50, yPosition)
         .text(product.country || 'N/A', 250, yPosition)
         .text(`$${product.price?.toFixed(2) || '0.00'}`, 350, yPosition);
      yPosition += 20;
    });

    // Footer
    doc.moveTo(50, yPosition + 20)
       .lineTo(550, yPosition + 20)
       .stroke();
    doc.fontSize(8)
       .text(`Report generated on ${new Date().toLocaleDateString()}`, 50, yPosition + 30);

    // 6. Generate PDF buffer
    const pdfBuffer = await new Promise((resolve) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    // 7. Return response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=supplier_report.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate report",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  } finally {
    await client.close();
  }
};
