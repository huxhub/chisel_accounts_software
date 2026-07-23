import { Sequelize } from 'sequelize';

const dbName = process.env.DB_NAME || 'chisel_accounts_management';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
  }
);

const connectDB = async () => {
  try {
    // Try creating database if user has CREATE DATABASE privileges; ignore if already exists or restricted
    try {
      const tempSequelize = new Sequelize(
        '',
        dbUser,
        dbPassword,
        {
          host: dbHost,
          port: dbPort,
          dialect: 'mysql',
          logging: false,
        }
      );
      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await tempSequelize.close();
    } catch {
      // Database already exists or restricted DB user
    }

    // Authenticate and sync the configured database
    await sequelize.authenticate();

    // sequelize.sync() creates missing tables but won't add columns to ones
    // that already exist, so upgrade existing Users tables by hand.
    try {
      const [existingColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'isAdmin'`,
        { replacements: [dbName] }
      );
      if (existingColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Users` ADD COLUMN `isAdmin` TINYINT(1) NOT NULL DEFAULT 0'
        );
        const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
        await sequelize.query(
          'UPDATE `Users` SET `isAdmin` = 1 WHERE `username` = ?',
          { replacements: [adminUsername] }
        );
      }
    } catch {
      // Users table doesn't exist yet on first boot
    }

    try {
      const [txColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Transactions' AND COLUMN_NAME = 'isCompleted'`,
        { replacements: [dbName] }
      );
      if (txColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `isCompleted` TINYINT(1) NOT NULL DEFAULT 0'
        );
      }

      const [remColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Transactions' AND COLUMN_NAME = 'isReminder'`,
        { replacements: [dbName] }
      );
      if (remColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `isReminder` TINYINT(1) NOT NULL DEFAULT 0'
        );
      }
    } catch {
      // Transactions table doesn't exist yet on first boot
    }

    await sequelize.sync();
    console.log(`MySQL Connected: ${sequelize.config.host}/${sequelize.config.database}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };

