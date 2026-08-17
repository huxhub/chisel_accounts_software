import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Account extends Model {}

Account.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('company', 'overdraft', 'bank', 'cash'),
      allowNull: false,
    },
    openingBalance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#1e3a5f',
    },
    bgColor: {
      type: DataTypes.STRING,
      defaultValue: '#e8edf5',
    },
  },
  {
    sequelize,
    modelName: 'Account',
  }
);

export default Account;
