const mySqlFixtures = require('./MySqlFixtures');
const mongoFixtures = require('./MongoFixtures');

class Fixtures {
    async load() {
        try {
            return Promise.all([
                mySqlFixtures.load(),
                mongoFixtures.load(),
            ]);
        } catch (err) {
            return new Promise.reject(err);
        }
    }
}

module.exports = new Fixtures();