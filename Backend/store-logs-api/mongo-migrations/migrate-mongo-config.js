const path = require('path');
const urlWithDbName =
  process.env.NODE_ENV === 'production'
    ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}`
    : 'mongodb://localhost:27017/emp_test';
const urlArr = urlWithDbName.split('/');
const databaseName = urlArr.pop();
const url = urlArr.join('/');

const config = {
  mongodb: {
    url,
    databaseName,
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: path.resolve(__dirname, 'migrations'),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'changelog',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.js',
};

module.exports = config;
