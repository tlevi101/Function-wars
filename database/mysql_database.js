const { Sequelize } = require('sequelize');
const mysqlConfig = require('../config/config');

const DB = new Sequelize(mysqlConfig.database, mysqlConfig.user, mysqlConfig.password, {
  host: mysqlConfig.host,
  dialect: 'mysql',
  port: mysqlConfig.port,
});

module.exports = { DB };