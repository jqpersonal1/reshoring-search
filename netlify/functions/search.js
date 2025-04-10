const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const query = event.queryStringParameters.q;
  
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing search query" })
    };
  }

  // Connection settings
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,  // Increased to 10s
    socketTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 1  // Prevents connection pool issues
  });

  try {
    // Verbose connection logging
    console.log(`Connecting to MongoDB...`);
    await client.connect();
    console.log(`Connected successfully. Searching for: ${query}`);
    
    const db = client.db("reshoring_db");
    
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

    console.log(`Found ${products.length} products, ${suppliers.length} suppliers`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, suppliers })
    };
    
  } catch (error) {
    console.error('MongoDB Error:', {
      message: error.message,
      stack: error.stack,
      query: query,
      time: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Database query failed",
        details: process.env.NODE_ENV === 'development' ? error.message : null
      })
    };
  } finally {
    await client.close().catch(e => console.error('Connection close error:', e));
  }
};
