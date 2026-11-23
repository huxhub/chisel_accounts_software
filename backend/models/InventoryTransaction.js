import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class InventoryTransaction extends Model {}

InventoryTransaction.init({
  inventoryItemId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  quantity: { type: DataTypes.STRING(255), allowNull: false },
  unit: { type: DataTypes.ENUM('kg', 'box'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paymentStatus: { type: DataTypes.ENUM('paid', 'not_paid'), allowNull: false, defaultValue: 'not_paid' },
}, { sequelize, modelName: 'InventoryTransaction' });

export default InventoryTransaction;
