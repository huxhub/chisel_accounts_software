import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import accountRoutes from './routes/accountRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase payload limit for document uploads (e.g. data URLs)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import authRoutes from './routes/authRoutes.js';
import { protect } from './middleware/authMiddleware.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', protect, accountRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Accounts Management API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
