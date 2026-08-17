import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import Vendor from './Vendor.js';

class VendorEntry extends Model { }

VendorEntry.init(
  {
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Vendor, key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('purchase', 'sale'),
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    // "from whom" for purchase, "to whom" for sale
    party: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'VendorEntry',
  }
);

Vendor.hasMany(VendorEntry, { foreignKey: 'vendorId', onDelete: 'CASCADE' });
VendorEntry.belongsTo(Vendor, { foreignKey: 'vendorId' });

export default VendorEntry;
