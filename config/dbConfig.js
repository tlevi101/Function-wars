require("dotenv").config();
const dbConfig = {
  development: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    dialect: "mysql",
  },
};

module.exports = dbConfig;
