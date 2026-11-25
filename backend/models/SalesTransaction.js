import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class SalesTransaction extends Model {}

SalesTransaction.init({
  partyName: { type: DataTypes.STRING(255), allowNull: false },
  saleBatchId: { type: DataTypes.STRING(36), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  quantity: { type: DataTypes.STRING(255), allowNull: false },
  unit: { type: DataTypes.ENUM('kg', 'box'), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paidAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  linkedAccountId: { type: DataTypes.INTEGER, allowNull: true },
  paymentStatus: { type: DataTypes.ENUM('paid', 'not_paid', 'partial'), allowNull: false, defaultValue: 'not_paid' },
}, { sequelize, modelName: 'SalesTransaction' });

export default SalesTransaction;
