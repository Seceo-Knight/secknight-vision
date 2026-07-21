const mongoose = require('mongoose');

class MongoDB {
    constructor() {
        this.URL = process.env.MONGO_URI;
    }

    async connect() {
        try {
            await mongoose.connect(this.URL);
            console.log('== Mongo connected ==');
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = new MongoDB;