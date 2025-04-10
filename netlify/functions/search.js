const { MongoClient } = require('mongodb');

exports.handler = async () => {
  // Use environment variable or fallback (for testing)
  const uri = process.env.MONGODB_URI || "mongodb+srv://jqpersonal1:Tyran0saurus@product-search-db.ytzngnu.mongodb.net/productsDB?retryWrites=true&w=majority";
  
  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");
    
    const db = client.db("productsDB");
    const collection = db.collection("suppliers");
    const count = await collection.countDocuments();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        documentCount: count,
        debug: "Connection successful"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Connection failed",
        details: error.message,
        uriUsed: uri.replace(/:\/\/.*@/, '://USERNAME:PASSWORD@') // Masks password in logs
      })
    };
  } finally {
    await client.close();
  }
};
