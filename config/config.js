require('dotenv').config();

const mysqlConfig = {
  host: process.env.MYSQL_DB_HOST,
  user: process.env.MYSQL_DB_USERNAME,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB_DATABASE,
  port: process.env.MYSQL_DB_PORT,
  dialect: 'mysql',
};

module.exports = { mysqlConfig };