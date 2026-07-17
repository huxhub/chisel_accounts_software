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
    // Connect to MySQL server without a database first to ensure the database exists
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

    // Authenticate and sync the configured database
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`MySQL Connected: ${sequelize.config.host}/${sequelize.config.database}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };

