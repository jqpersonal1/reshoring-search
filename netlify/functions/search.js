const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');

exports.handler = async (event) => {
  // 1. Connect to MongoDB (your existing code)
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("productsdb");

  // 2. Fetch products (limit 5 for testing)
  const products = await db.collection("products").find().limit(5).toArray();

  // 3. Create PDF
  const doc = new PDFDocument();
  doc.text('Your Product Report', { align: 'center', underline: true });
  products.forEach((p) => doc.text(`${p.name} - ${p.country}`));

  // 4. Return PDF
  const pdfBuffer = await new Promise((resolve) => {
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.end(); // Finalize PDF
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfBuffer.toString('base64'),
    isBase64Encoded: true,
  };
};
