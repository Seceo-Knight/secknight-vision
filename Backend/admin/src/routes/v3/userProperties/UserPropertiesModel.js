const {BaseModel} = require('../../../models/BaseModel');

class UserPropertiesModel extends BaseModel {
    static get TABLE_NAME() {
        return 'user_properties';
    }

    static get TABLE_FIELDS() {
        return ['user_id', 'name', 'value', 'created_at', 'updated_at'];
    }

    static async set(user_id, properties) {
        const params = [this.TABLE_NAME];
        const values = [];
        for(const property of properties) {
            const {name, value} = property;
            values.push('(?)');
            params.push([user_id, name, JSON.stringify(value)]);
        }
        const query = `INSERT INTO ?? (user_id, name, value) VALUES ${values.join(',')}
                            ON DUPLICATE KEY UPDATE value = VALUES(value);`;
        return this.query(query, params);
    }

    static async get(user_id, names) {
        const query = `SELECT name, value FROM ?? WHERE user_id=? AND name IN(?);`;
        const params = [this.TABLE_NAME, user_id, names];
        const result = {};
        for(const property of await this.query(query, params)) {
          result[property.name] = JSON.parse(property.value);
        }
        return result;
    }

    static async delete(user_id, names) {
        const query = `DELETE FROM ?? WHERE user_id=? AND name IN(?);`;
        const params = [this.TABLE_NAME, user_id, names];
        return this.query(query, params);
    }
}

module.exports.UserPropertiesModel = UserPropertiesModel;
