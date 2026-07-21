const environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

const configs = {
  development: {
    username: 'root',
    password: 'root',
    database: 'emp_local_db',
    host: 'localhost',
    dialect: 'mysql',
  },
  test: {
    username: 'root',
    password: 'root',
    database: 'emp_local_db',
    host: 'localhost',
    dialect: 'mysql',
  },
  production: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
  },
};

module.exports = configs[environment];
