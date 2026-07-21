const esc = require('escape-html');
const mySql = require('../database/MySqlConnection').getInstance();

class BaseModel {
    static get TABLE_NAME() {
        return '';
    }

    static get TABLE_FIELDS() {
        return [];
    }

    static valuesSlice(values) {
        const result = {};

        Object.keys(values).forEach((key) => {
            if (~this.TABLE_FIELDS.indexOf(key)) {
                result[key] = values[key];
            }
        });
        return result;
    }

    static query(sqlQuery, ...params) {
        return mySql.query(sqlQuery, ...params);
    }

    static create(values) {
        const queryNames = [];
        const queryValues = [];
        const validValues = this.valuesSlice(values);
        Object.keys(validValues).forEach((key) => {
            if (!(key in validValues)) return;
            queryNames.push(key);
            queryValues.push(validValues[key]);
        });
        const query = `INSERT INTO ?? (??) VALUES (?)`;
        return this.query(query, [this.TABLE_NAME, queryNames, queryValues]);
    }

    static update(id, values) {
        const queryValues = [];
        const queryParams = [this.TABLE_NAME];
        const validValues = this.valuesSlice(values);
        Object.keys(validValues).forEach((key) => {
            if (!(key in validValues)) return;
            queryValues.push('?? = ?');
            queryParams.push(key, validValues[key]);
        });
        queryParams.push('id', id);
        const query = `UPDATE ?? SET ${queryValues.join(', ')} WHERE ?? = ?;`;
        return this.query(query, queryParams);
    }

    static get(id) {
        const query = 'SELECT * FROM ?? WHERE ?? = ? LIMIT 1';
        return this.query(query, [this.TABLE_NAME, 'id', id]).then(result => {
            if (result.length === 0) throw new Error('Record Not Found');
            return new this(result[0]);
        });
    }

    static getByOrgId(organization_id) {
        const query = 'SELECT * FROM ?? WHERE ?? = ?';

        return this.query(query, [this.TABLE_NAME, 'organization_id', organization_id]).then(result => {
            if (result.length === 0) throw new Error('Record Not Found');
            return result;
        });
    }

    static delete(id) {
        const query = 'DELETE FROM ?? WHERE ?? = ? LIMIT 1';
        return this.query(query, [this.TABLE_NAME, 'id', id]);
    }

    static deleteMany(conditions) {
        const queryConditions = [];
        const validParams = this.valuesSlice(conditions);
        const queryParams = [this.TABLE_NAME];
        Object.keys(validParams).forEach((key) => {
            if (!(key in validParams)) return;
            queryConditions.push('?? = ?');
            queryParams.push(key, validParams[key]);
        });
        const where = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';
        const query = `DELETE FROM ?? ${where};`;
        return this.query(query, queryParams);
    }

    static findBy(params, cmpTypes = {}) {
        const queryConditions = [];
        const validParams = this.valuesSlice(params);

        let { skip, limit } = params;
        const queryParams = [this.TABLE_NAME];
        Object.keys(validParams).forEach((key) => {
            if (!(key in validParams)) return;
            const cmpType = cmpTypes[key] || 'EQUAL';
            queryParams.push(key);
            switch (cmpType) {
                case 'START_WITH':
                    queryConditions.push('(?? LIKE ?)');
                    queryParams.push(`${validParams[key]}%`);
                    break;
                case 'LIKE':
                    queryConditions.push('(?? LIKE ?)');
                    queryParams.push(`%${validParams[key]}%`);
                    break;
                default:
                    queryConditions.push('(?? IN(?))');
                    queryParams.push(validParams[key]);
            }
        });
        const where = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';
        let query = `SELECT *,(COUNT( * ) OVER()) AS count FROM ?? ${where} `;
        if ('sort_by' in params && ~this.TABLE_FIELDS.indexOf(params.sort_by)) {
            query = `${query} ORDER BY ?? `
            queryParams.push(params.sort_by);
            query = `${query} ${params.sort_order || 'DESC'}`;
        } else {
            query = `${query} ORDER BY ??`
            queryParams.push('id');
            query = `${query} ${params.sort_order || 'ASC'}`;
        }
        limit = limit || 10;
        if (limit != -1) {
            queryParams.push(skip || 0, limit);
            query = `${query} LIMIT ?, ?`;
        }
        return this.query(query, queryParams).then((entities) => {
            return entities.map(entity => (new this(entity)));
        });
    }

    static findAllBy(params = {}, cmpTypes = {}) {
        params.limit = -1;
        return this.findBy(params, cmpTypes);
    }

    static enumDesc(name, items) {
        const descItems = Object.keys(items).map(k => `${esc(k)} - ${esc(items[k])}`);
        return {
            type: 'string',
            enum: Object.keys(items),
            description: `${esc(name)}:\n${descItems.join("\n")}`,
            example: Object.keys(items)[0],
        };
    }

    static zip(keyValues, keyIndex = 0, valueIndex = 1) {
        const result = {};
        for (const keyValue of keyValues) {
            const values = Object.values(keyValue);
            if (valueIndex >= 0) {
                result[values[keyIndex]] = values[valueIndex];
            } else {
                result[values[keyIndex]] = keyValue;
            }
        }
        return result;
    }

    static promiseChain(promises) {
        return promises.reduce((resultPromise, promise) => {
            return resultPromise.then(() => promise);
        }, Promise.resolve());
    }

    constructor(data) {
        for (const key in data) {
            this[key] = data[key];
        }
    }

    update(values) {
        for (const key in values) {
            this[key] = values[key];
        }
        return this.constructor.update(this.id, values);
    }

    delete() {
        return this.constructor.delete(this.id);
    }

    
    static getOrganizationDetails(organization_id) {
        return mySql.query(`
            SELECT o.id, o.user_id
                FROM organizations o
                WHERE o.id = ?
        `, [organization_id]);
    }
}

module.exports.BaseModel = BaseModel;