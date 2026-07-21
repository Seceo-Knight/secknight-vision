const NodeCache = require('node-cache');
const EventEmitter = require('events');
class ReducerEmitter extends EventEmitter {};
const _ = require('lodash');

const FTPUtils = require(`${utilsFolder}/helpers/FTPUtils`);
const ftpCashe = new NodeCache({ stdTTL: 1200, useClones: false });
const { 
	FTP_MAX_REQ_COUNT_IN_ONE_REDUCER,
	FTP_MIN_ONE_TIME_CONECTIONS,
	FTP_MAX_ONE_TIME_CONECTIONS,
} = process.env;

class FtpConnectReducer {
	constructor(creds) {
		this.code = Math.ceil(Math.random() * 1000) - Math.ceil(Math.random() * 100);
		this._creds = creds;
		this._client = FTPUtils.createClient();
		this.isFree = true;
		this.reqCount = 0;
		this.queue = 1;
		this.place = 1;
		this._emitter = new ReducerEmitter();
	}

	static maxREqCount = FTP_MAX_REQ_COUNT_IN_ONE_REDUCER || 3;
	static minOneTimeCon = FTP_MIN_ONE_TIME_CONECTIONS || 10;
	static maxOneTimeCon = FTP_MAX_ONE_TIME_CONECTIONS || 20;

	static generateKey({ host, username }) {
		return `${host}:${username}`;
	}

	static сhooseReducer(creds) {
		const key = this.generateKey(creds);
		const reducers = ftpCashe.get(key);
		if(!reducers) {
			const newReducer = new FtpConnectReducer(creds);
			ftpCashe.set(key, [newReducer]);

			return newReducer;
		}
	
		const freeReducer = reducers.find(reducer => reducer.isFree);
		if(freeReducer) {
			return freeReducer;
		}

		if(reducers.length <= this.minOneTimeCon) {
			const newReducer = new FtpConnectReducer(creds);
			ftpCashe.set(key, [...reducers, newReducer]);

			return newReducer;
		}

		const unloadedReducer = reducers.find(reducer => reducer.reqCount <= this.maxREqCount);
		if(unloadedReducer) {
			return unloadedReducer;
		}

		if(reducers.length === this.maxOneTimeCon) {
			const sortedReducers = _.sortBy(reducers, 'reqCount');
			return _.first(sortedReducers);
		}

		const newReducer = new FtpConnectReducer(creds);
		ftpCashe.set(key, [...reducers, newReducer]);

		return newReducer;
	}

	static getClient(creds) {
		const Reducer = this.сhooseReducer(creds)

		return Reducer.checkClient();
	}

	async checkClient() {
		this.reqCount += 1;
		if (this.isFree) {
			this.isFree = false;
		} else {
			const place = this.place;
			this.place += 1;
			await this.wait(place);
		}
	
		if (this._client.closed) {
			await FTPUtils.access(this._client, this._creds);
		}

		return this;
	}

	wait(place) {
		return new Promise((resolve) => {
			this._emitter.once(place, () => {
				this.isFree = false;
				resolve();
			});
		});
	}

	toFreePlace() {
		this.reqCount = this.reqCount > 0 ? this.reqCount - 1 : 0;
	}

	async download(stream, path) {
		try {
			await this._client.downloadTo(stream, path);
			this.close();
		} catch (error) {
			this.close();

			throw error;
		}
	}

	plusQue() {
		if(this.reqCount !== 0) {
			this.queue += 1;
			return;
		}

		this.queue = 1;
		this.place = 1;
	}

	close() {
		this.isFree = true;
		this.toFreePlace();
		this._emitter.emit(this.queue);
		this.plusQue();
		
	}
}

module.exports = FtpConnectReducer;
