class DayCounter {
    constructor() {
        this._values = {
            P: 0,
            A: 0,
            L: 0,
            H: 0,
            O: 0,
            D: 0,
            EL: 0,
        };
    }

    plus(type) {
        this._values[type] += 1;
    }

    get values() {
        return this._values;
    }
}

module.exports = DayCounter;