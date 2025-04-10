const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const query = event.queryStringParameters?.q || 'test';
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000
  });

  try {
    await client.connect();
    const db = client.db("productsdb");
    
    const [products, suppliers] = await Promise.all([
      db.collection("products")  // ← Updated name
        .find({ $text: { $search: query } })
        .limit(5)
        .toArray(),
        
      db.collection("suppliers")  // ← Updated name
        .find({})
        .limit(5)
        .toArray()
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ products, suppliers })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        note: "Verify 'products' and 'suppliers' collections exist"
      })
    };
  } finally {
    await client.close();
  }
};
