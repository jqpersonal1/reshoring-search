const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const query = event.queryStringParameters?.q || 'test';
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000
  });

  try {
    // Simple connection test
    await client.connect();
    const db = client.db("reshoring_db");
    const testDoc = await db.collection("foreign_products").findOne({});
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: "SUCCESS",
        connection: "Verified",
        testDocument: testDoc 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Connection failed",
        details: error.message,
        suggestion: "1. Check IP whitelist 2. Verify collection exists"
      })
    };
  } finally {
    await client.close();
  }
};
