require('dotenv').config();
const fs = require('fs');

const dbConfig =
    process.env.DB_DIALECT === 'mysql'
        ? {
              development: {
                  host: process.env.DB_HOST,
                  username: process.env.DB_USERNAME,
                  database: process.env.DB_DATABASE,
                  password: process.env.DB_PASSWORD,
                  dialect: 'mysql',
                  logging: process.env.DB_LOGGING === 'true',
              },
              prod: {
                  host: process.env.DB_HOST,
                  username: process.env.DB_USERNAME,
                  database: process.env.DB_DATABASE,
                  password: process.env.DB_PASSWORD,
                  dialect: 'mysql',
                  logging: process.env.DB_LOGGING === 'true',
                  ssl: {
                      ca: fs.readFileSync(__dirname + '/../certs/DigiCertGlobalRootCA.crt.pem'),
                  },
              },
              test: {
                  host: process.env.DB_HOST,
                  username: process.env.DB_USERNAME,
                  database: process.env.DB_DATABASE + '_test',
                  password: process.env.DB_PASSWORD,
                  dialect: 'mysql',
                  logging: process.env.DB_LOGGING === 'true',
              },
          }
        : {
              development: {
                  dialect: 'sqlite',
                  storage: process.env.DB_STORAGE_PATH + '/db_development.sqlite',
                  logging: process.env.DB_LOGGING === 'true',
              },
              prod: {
                  dialect: 'sqlite',
                  storage: process.env.DB_STORAGE_PATH + '/db_prod.sqlite',
                  logging: process.env.DB_LOGGING === 'true',
              },
              test: {
                  dialect: 'sqlite',
                  storage: process.env.DB_STORAGE_PATH + '/db_test.sqlite',
                  logging: process.env.DB_LOGGING === 'true',
              },
          };

module.exports = dbConfig;
