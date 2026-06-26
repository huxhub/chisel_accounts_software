import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  dueDate: { type: String },
  exchangeType: { type: String },
  document: {
    name: String,
    dataUrl: String,
    mimeType: String,
    size: Number
  }
}, { timestamps: true });

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['company', 'overdraft'], required: true },
  openingBalance: { type: Number, required: true, default: 0 },
  color: { type: String, default: '#1e3a5f' },
  bgColor: { type: String, default: '#e8edf5' },
  transactions: [transactionSchema]
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

export default Account;
