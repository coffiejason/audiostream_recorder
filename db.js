const MongoClient = require('mongodb').MongoClient;

// Connection URL and database name
const url = 'mongodb+srv://radio-recorder:qHByMRSUuYPtHRZR@rest.woruh.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'monitoring';

// JSON object to be inserted
// const jsonObject = {
//   name: 'John Doe',
//   age: 25,
//   email: 'johndoe@example.com'
// };

// Function to write JSON object to MongoDB
async function writeToDB(jsonObject) {
  const client = new MongoClient(url);

  try {
    // Connect to MongoDB
    await client.connect(jsonObject);

    // Select the database
    const db = client.db(dbName);

    // Select the collection
    const collection = db.collection('radio');

    // Insert the JSON object
    const result = await collection.insertOne(jsonObject);
    console.log('Document inserted:', result.insertedId);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the client
    await client.close();
  }
}

module.exports = writeToDB
