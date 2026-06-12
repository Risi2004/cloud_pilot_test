import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudpilot');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Warning: MongoDB Connection failed: ${error.message}. Running in local in-memory fallback database mode.`);
  }
};

export default connectDB;
