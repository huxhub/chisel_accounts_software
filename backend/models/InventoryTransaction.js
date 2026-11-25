import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class InventoryTransaction extends Model {}

InventoryTransaction.init({
  inventoryItemId: { type: DataTypes.INTEGER, allowNull: false },
  partyName: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  transactionType: { type: DataTypes.ENUM('purchase', 'sale'), allowNull: false, defaultValue: 'purchase' },
  saleBatchId: { type: DataTypes.STRING(36), allowNull: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  quantity: { type: DataTypes.STRING(255), allowNull: false },
  unit: { type: DataTypes.ENUM('kg', 'box'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paidAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  linkedAccountId: { type: DataTypes.INTEGER, allowNull: true },
  unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  paymentStatus: { type: DataTypes.ENUM('paid', 'not_paid', 'partial'), allowNull: false, defaultValue: 'not_paid' },
}, { sequelize, modelName: 'InventoryTransaction' });

export default InventoryTransaction;
