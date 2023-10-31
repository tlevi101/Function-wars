require('dotenv').config();
const dbConfig = {
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
			ca: fs.readFileSync(__dirname + '../certs/DigiCertGlobalRootCA.crt.pem')
		}
    },
    test: {
        host: process.env.DB_HOST,
        username: process.env.DB_USERNAME,
        database: process.env.DB_DATABASE + '_test',
        password: process.env.DB_PASSWORD,
        dialect: 'mysql',
        logging: process.env.DB_LOGGING === 'true',
    },
};

module.exports = dbConfig;
