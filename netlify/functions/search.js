const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async (event, context) => {
  // 1. Set timeout to 10 seconds (Netlify's max is 30)
  context.callbackWaitsForEmptyEventLoop = false;
  
  const uri = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/productsDB?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    // 2. Connect with timeout
    await client.connect();
    const db = client.db("productsDB");
    const suppliers = await db.collection("suppliers")
      .find()
      .limit(5) // Reduced from 10 to 5 items
      .toArray();

    // 3. Stream PDF (faster than buffers)
    const doc = new PDFDocument();
    doc.font('Helvetica')
       .fontSize(12)
       .text('Quick Report:\n\n');
    
    suppliers.forEach(s => doc.text(`• ${s.name}`));

    return new Promise((resolve) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve({
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=quick.pdf'
        },
        body: Buffer.concat(chunks).toString('base64'),
        isBase64Encoded: true
      }));
      doc.end();
    });

  } catch (error) {
    return { 
      statusCode: 500,
      body: JSON.stringify({ error: error.message.replace(/mongodb.*@/, 'mongodb://USER:REDACTED@') })
    };
  } finally {
    await client.close();
  }
};