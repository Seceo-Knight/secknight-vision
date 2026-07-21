const Fixtures = require('node-mongodb-fixtures');

class MongoFixtures {
    constructor() {
        this.connected = false;
        this.fixtures = new Fixtures({
            dir: `${__dirname.split('src')[0]}src/test/fixtures/mongo`,
            mute: true,
        });
    }

    async load() {
        await this.connect();
        // await this.fixtures.unload();
        return this.fixtures.load();
    }

    async connect() {
        if (this.connected) return Promise.resolve();
        this.connected = true;
        return this.fixtures.connect(
            process.env.MONGO_URI,
            { useNewUrlParser: true, useUnifiedTopology: true },
        );
    }
}

new MongoFixtures();
module.exports = new MongoFixtures();