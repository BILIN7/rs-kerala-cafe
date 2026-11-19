const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-ordering-uk';
  
  try {
    // Attempt connection with 3-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Local MongoDB not detected (${error.message}).`);
    console.log(`💡 Note: To persist to MongoDB, ensure MongoDB is running or set MONGODB_URI in .env (e.g., MongoDB Atlas).`);
    console.log(`🚀 Starting in demo/memory fallback mode so API and frontend work out-of-the-box.`);
    isConnected = false;
  }
};

const getDBStatus = () => ({ isConnected });

module.exports = connectDB;
module.exports.getDBStatus = getDBStatus;

