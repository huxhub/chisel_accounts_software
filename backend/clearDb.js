import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Account from './models/Account.js';

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accounts_management');
    console.log('Connected to MongoDB');
    
    await Account.deleteMany({});
    console.log('All accounts and transactions have been successfully removed from the database!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

clearDB();
