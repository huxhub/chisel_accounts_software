import crypto from 'crypto';
import User from '../models/User.js';

// SEED_ADMIN_PASSWORD lets a deploy pin the initial password; otherwise a
// random one is generated so a fresh install never ships a known default
// (the previous hardcoded 'password123' is public in this repo's history).
const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');

const DEFAULT_USERS = [
  { username: adminUsername, password: adminPassword, isAdmin: true },
];

// Creates the default users if they don't already exist. Safe to call on
// every boot — existing users are left untouched.
export const seedDefaultUsers = async () => {
  for (const { username, password, isAdmin } of DEFAULT_USERS) {
    const exists = await User.findOne({ where: { username } });
    if (!exists) {
      await User.create({ username, password, isAdmin });
      console.log(`Seeded default user: ${username}`);
      if (!process.env.SEED_ADMIN_PASSWORD) {
        console.log(`  Generated password (save this now, it will not be shown again): ${password}`);
      }
    }
  }
};
