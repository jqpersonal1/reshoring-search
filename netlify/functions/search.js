const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const query = event.queryStringParameters.q;
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("reshoring_db");
    
    const products = await db.collection("foreign_products")
      .find({ $text: { $search: query } })
      .toArray();

    const suppliers = await db.collection("us_suppliers")
      .find({ product_type: { $regex: query, $options: 'i' } })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ products, suppliers })
    };
  } finally {
    await client.close();
  }
};
