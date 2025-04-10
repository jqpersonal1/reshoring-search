const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  console.log('Starting query for:', event.queryStringParameters.q);
  
  // Configure with TLS/SSL settings
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: false,
    retryWrites: true,
    retryReads: true,
    appName: 'reshoring-search'
  });

  try {
    console.log('Connecting to MongoDB with TLS...');
    await client.connect();
    console.log('Successfully connected!');
    
    const db = client.db("reshoring_db");
    console.log('Database ready');

    // Verify collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);

    if (!collectionNames.includes('foreign_products') || !collectionNames.includes('us_suppliers')) {
      throw new Error('Missing required collections');
    }

    // Execute parallel queries
    const [products, suppliers] = await Promise.all([
      db.collection("foreign_products")
        .find({ $text: { $search: event.queryStringParameters.q } })
        .project({ _id: 0, name: 1, country: 1 })
        .limit(5)
        .toArray(),
        
      db.collection("us_suppliers")
        .find({ product_type: new RegExp(event.queryStringParameters.q, 'i') })
        .project({ _id: 0, name: 1, location: 1 })
        .limit(5)
        .toArray()
    ]);

    console.log(`Found ${products.length} products and ${suppliers.length} suppliers`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        products,
        suppliers,
        debug: {
          mongodb_version: (await db.admin().serverInfo()).version,
          connection: 'success'
        }
      })
    };
    
  } catch (error) {
    console.error('FATAL ERROR:', {
      message: error.message,
      stack: error.stack,
      query: event.queryStringParameters.q,
      time: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Database operation failed",
        details: error.message,
        suggestion: "Check MongoDB Atlas connection settings"
      })
    };
  } finally {
    await client.close().catch(e => console.error('Connection close error:', e));
  }
};
