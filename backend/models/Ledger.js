import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Ledger extends Model {}

Ledger.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('vendor', 'customer'),
      allowNull: false,
      defaultValue: 'vendor',
    },
    openingBalance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    openingType: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      defaultValue: 'credit',
    },
  },
  {
    sequelize,
    modelName: 'Ledger',
  }
);

export default Ledger;
