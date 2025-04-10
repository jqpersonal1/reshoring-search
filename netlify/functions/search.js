const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const query = event.queryStringParameters.q;
  
  // Fast timeout for connection (5s)
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    // Quick connection test
    await client.connect();
    const db = client.db("reshoring_db");
    
    // Fast parallel queries with limits
    const [products, suppliers] = await Promise.all([
      db.collection("foreign_products")
        .find({ $text: { $search: query } })
        .project({ _id: 0, name: 1, country: 1 })
        .limit(5)
        .toArray(),
        
      db.collection("us_suppliers")
        .find({ product_type: new RegExp(query, 'i') })
        .project({ _id: 0, name: 1, location: 1 })
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
      body: JSON.stringify({ error: "Query failed" })
    };
  } finally {
    await client.close();
  }
};
