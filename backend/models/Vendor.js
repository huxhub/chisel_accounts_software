import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Vendor extends Model {}

Vendor.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'Vendor',
  }
);

export default Vendor;
