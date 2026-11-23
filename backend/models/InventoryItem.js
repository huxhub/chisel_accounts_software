import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class InventoryItem extends Model {}
InventoryItem.init({
  name: { type: DataTypes.STRING(255), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false, defaultValue: 0 },
  unit: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pcs' },
}, { sequelize, modelName: 'InventoryItem' });
export default InventoryItem;
