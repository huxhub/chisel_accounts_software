import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Program extends Model {}

Program.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#6366f1',
    },
  },
  {
    sequelize,
    modelName: 'Program',
  }
);

export default Program;
