// One-off CLI to rotate a user's password directly, e.g. on the production
// server: `node setPassword.js admin 'new-strong-password'`
// Needed because there is no other way to change a leaked/default password
// without database access.
import './config/env.js';
import connectDB from './config/db.js';
import User from './models/User.js';

const [, , username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('Usage: node setPassword.js <username> <newPassword>');
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

try {
  await connectDB();
  const user = await User.findOne({ where: { username } });
  if (!user) {
    console.error(`No user found with username "${username}"`);
    process.exit(1);
  }
  user.password = newPassword;
  await user.save();
  console.log(`Password updated for ${username}`);
  process.exit();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
