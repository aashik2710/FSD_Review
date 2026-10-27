const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mining_maintenance';
    
    // Attempt standard connection with 3s timeout
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Standard MongoDB connection failed (${error.message}).`);
    console.log(`[Database] Initializing dynamic in-memory MongoDB engine for zero-config operation...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB Engine running at: ${memoryUri}`);
    } catch (memErr) {
      console.error(`[Database] Critical DB Error: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
