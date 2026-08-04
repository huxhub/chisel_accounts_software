import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import Account from './Account.js';
import Program from './Program.js';

class Transaction extends Model {}

Transaction.init(
  {
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Account,
        key: 'id',
      },
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
    },
    dueDate: {
      type: DataTypes.STRING,
    },
    exchangeType: {
      type: DataTypes.STRING,
    },
    document: {
      type: DataTypes.JSON,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    programId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Program,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
  }
);

Account.hasMany(Transaction, { foreignKey: 'accountId', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'accountId' });

Program.hasMany(Transaction, { foreignKey: 'programId', onDelete: 'SET NULL' });
Transaction.belongsTo(Program, { foreignKey: 'programId' });

export default Transaction;

