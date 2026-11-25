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
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Users') AND LOWER(COLUMN_NAME) = LOWER('isAdmin')`,
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
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Transactions') AND LOWER(COLUMN_NAME) = LOWER('isCompleted')`,
        { replacements: [dbName] }
      );
      if (txColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `isCompleted` TINYINT(1) NOT NULL DEFAULT 0'
        );
      }

      const [remColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Transactions') AND LOWER(COLUMN_NAME) = LOWER('isReminder')`,
        { replacements: [dbName] }
      );
      if (remColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `isReminder` TINYINT(1) NOT NULL DEFAULT 0'
        );
      }

      const [progColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Transactions') AND LOWER(COLUMN_NAME) = LOWER('programId')`,
        { replacements: [dbName] }
      );
      if (progColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `programId` INT NULL'
        );
      }

      const [vcColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Transactions') AND LOWER(COLUMN_NAME) = LOWER('vendorOrCustomerName')`,
        { replacements: [dbName] }
      );
      if (vcColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `vendorOrCustomerName` VARCHAR(255) NULL'
        );
      }

      const [riColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('Transactions') AND LOWER(COLUMN_NAME) = LOWER('relatedItemName')`,
        { replacements: [dbName] }
      );
      if (riColumns.length === 0) {
        await sequelize.query(
          'ALTER TABLE `Transactions` ADD COLUMN `relatedItemName` VARCHAR(255) NULL'
        );
      }
    } catch {
      // Transactions table doesn't exist yet on first boot
    }

    try {
      await sequelize.query(
        "ALTER TABLE `Accounts` MODIFY COLUMN `type` ENUM('company', 'overdraft', 'bank', 'cash') NOT NULL"
      );
    } catch {
      // Accounts table doesn't exist yet on first boot
    }

    await sequelize.sync();
    try {
      const [salesLinkedAccountColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('SalesTransactions') AND LOWER(COLUMN_NAME) = LOWER('linkedAccountId')`,
        { replacements: [dbName] }
      );
      if (salesLinkedAccountColumns.length === 0) {
        await sequelize.query('ALTER TABLE `SalesTransactions` ADD COLUMN `linkedAccountId` INT NULL');
      }
    } catch {
      // SalesTransactions table is created by sync on first boot
    }
    try {
      const [inventoryAmountColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('amount')`,
        { replacements: [dbName] }
      );
      if (inventoryAmountColumns.length === 0) {
        await sequelize.query('ALTER TABLE `InventoryTransactions` ADD COLUMN `amount` DECIMAL(14,2) NOT NULL DEFAULT 0');
      }
      const [inventoryPartyNameColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('partyName')`,
        { replacements: [dbName] }
      );
      if (inventoryPartyNameColumns.length === 0) {
        await sequelize.query("ALTER TABLE `InventoryTransactions` ADD COLUMN `partyName` VARCHAR(255) NOT NULL DEFAULT '' AFTER `inventoryItemId`");
      }
      const [inventoryTypeColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('transactionType')`,
        { replacements: [dbName] }
      );
      if (inventoryTypeColumns.length === 0) {
        await sequelize.query("ALTER TABLE `InventoryTransactions` ADD COLUMN `transactionType` ENUM('purchase','sale') NOT NULL DEFAULT 'purchase' AFTER `partyName`");
      }
      const [inventorySaleBatchColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('saleBatchId')`,
        { replacements: [dbName] }
      );
      if (inventorySaleBatchColumns.length === 0) {
        await sequelize.query('ALTER TABLE `InventoryTransactions` ADD COLUMN `saleBatchId` VARCHAR(36) NULL AFTER `transactionType`');
      }
      const [inventoryUnitPriceColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('unitPrice')`,
        { replacements: [dbName] }
      );
      if (inventoryUnitPriceColumns.length === 0) {
        await sequelize.query('ALTER TABLE `InventoryTransactions` ADD COLUMN `unitPrice` DECIMAL(14,2) NULL AFTER `amount`');
      }
      const [inventoryPaidColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('paidAmount')`,
        { replacements: [dbName] }
      );
      if (inventoryPaidColumns.length === 0) {
        await sequelize.query('ALTER TABLE `InventoryTransactions` ADD COLUMN `paidAmount` DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER `amount`');
        await sequelize.query("UPDATE `InventoryTransactions` SET `paidAmount` = `amount` WHERE `paymentStatus` = 'paid'");
      }
      const [inventoryLinkedAccountColumns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE LOWER(TABLE_SCHEMA) = LOWER(?) AND LOWER(TABLE_NAME) = LOWER('InventoryTransactions') AND LOWER(COLUMN_NAME) = LOWER('linkedAccountId')`,
        { replacements: [dbName] }
      );
      if (inventoryLinkedAccountColumns.length === 0) {
        await sequelize.query('ALTER TABLE `InventoryTransactions` ADD COLUMN `linkedAccountId` INT NULL AFTER `paidAmount`');
      }
      await sequelize.query("ALTER TABLE `InventoryTransactions` MODIFY COLUMN `paymentStatus` ENUM('paid','not_paid','partial') NOT NULL DEFAULT 'not_paid'");
      await sequelize.query('ALTER TABLE `InventoryTransactions` MODIFY COLUMN `quantity` VARCHAR(255) NOT NULL');
    } catch {
      // InventoryTransactions table is created by sync on first boot
    }
    const { migrateOldVendorsToLedgers } = await import('./migrateLedgers.js');
    await migrateOldVendorsToLedgers();
    console.log(`MySQL Connected: ${sequelize.config.host}/${sequelize.config.database}`);
  } catch (error) {
    console.error(`[DB Error]: ${error.message}`);
    throw error;
  }
};

export default connectDB;
export { sequelize };
