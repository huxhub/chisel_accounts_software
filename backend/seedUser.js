import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accounts_management');
    
    // Seed admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminUser = await User.create({
        username: 'admin',
        password: 'password123'
      });
      console.log(`Successfully created admin user: ${adminUser.username} with password: password123`);
    } else {
      console.log('Admin user already exists!');
    }
    
    // Seed owner@demo.test user
    const ownerExists = await User.findOne({ username: 'owner@demo.test' });
    if (!ownerExists) {
      const ownerUser = await User.create({
        username: 'owner@demo.test',
        password: 'password123'
      });
      console.log(`Successfully created owner user: ${ownerUser.username} with password: password123`);
    } else {
      console.log('Owner user already exists!');
    }
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUser();
