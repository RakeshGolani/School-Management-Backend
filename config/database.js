const { Sequelize } = require('sequelize');

/**
 * Sequelize database configuration and initialization.
 * Loads variables from process.env (loaded via dotenv in app.js).
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
