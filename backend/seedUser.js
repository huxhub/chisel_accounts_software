import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accounts_management');
    
    // Check if admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit();
    }
    
    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'password123'
    });
    
    console.log(`Successfully created admin user: ${adminUser.username} with password: password123`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUser();
