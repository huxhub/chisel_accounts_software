import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const BrandSettings = sequelize.define('BrandSettings', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  companyName: { type: DataTypes.STRING(100), allowNull: false },
  companySubtitle: { type: DataTypes.STRING(100), allowNull: false },
  logoUrl: { type: DataTypes.STRING(2048), allowNull: false, defaultValue: '' },
  themeColor: { type: DataTypes.STRING(7), allowNull: false },
});
export default BrandSettings;
