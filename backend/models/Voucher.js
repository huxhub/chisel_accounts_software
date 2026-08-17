import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import Ledger from './Ledger.js';
import Account from './Account.js';
import Program from './Program.js';

class Voucher extends Model {}

Voucher.init(
  {
    type: {
      type: DataTypes.ENUM('purchase', 'sale', 'payment', 'receipt'),
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ledgerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Ledger, key: 'id' },
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Account, key: 'id' },
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    programId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Program, key: 'id' },
    },
    document: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Voucher',
  }
);

Ledger.hasMany(Voucher, { foreignKey: 'ledgerId', onDelete: 'CASCADE' });
Voucher.belongsTo(Ledger, { foreignKey: 'ledgerId' });

Account.hasMany(Voucher, { foreignKey: 'accountId', onDelete: 'SET NULL' });
Voucher.belongsTo(Account, { foreignKey: 'accountId' });

Program.hasMany(Voucher, { foreignKey: 'programId', onDelete: 'SET NULL' });
Voucher.belongsTo(Program, { foreignKey: 'programId' });

export default Voucher;
