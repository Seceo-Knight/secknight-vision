
const XLSX = require('xlsx');
const _ = require('underscore');

const Common = require('../../../utils/helpers/Common');
const PRService = require('./ProductivityRanking.model_old');
const PRValidator = require('./ProductivityRanking.validator_old');

class ProductivityRanking {

  async getProductivityRankingOld(req, res, next) {
    try {
      await PRValidator.getProductivityRanking().validateAsync(req.query);

      let manager_id = null;
      const admin_id = req['decoded'].jsonData.admin_id;
      if (req['decoded'].jsonData.is_manager == true) {
        manager_id = req['decoded'].jsonData.id;
      }

      const limit = 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;

      let [count, prRanking] = await Promise.all([
        PRService.productivityRankingCount(),
        PRService.getProductivityRanking(admin_id, limit, offset)
      ]);

      const result = prRanking.map(item => {
        if(!item.status) {
          item.status = 1;
        }
        return item;
      });

      res.json({
        code: 200,
        data: result,
        hasMoreData: (page * limit) > count ? false : true,
        message: 'Productivity Ranking.',
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getProductivityRanking(req, res, next) {
    try {
      await PRValidator.getProductivityRanking().validateAsync(req.query);

      const admin_id = req['decoded'].jsonData.admin_id;

      const limit = process.env.PAGINATION_LIMIT || 500;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const { startDate, endDate, department_id, type } = req.query;

      let promiseArr = [
        PRService.adminActivityCount(admin_id, type, startDate, endDate),
        PRService.getAdminProductivityRanking(admin_id, limit, offset, type, startDate, endDate)
      ];

      if(department_id) {
        promiseArr = [
          PRService.deptActivityCount(admin_id, department_id, type, startDate, endDate),
          PRService.getDeptProductivityRanking(admin_id, department_id, limit, offset, type, startDate, endDate)
        ]
      }

      let [count, prRanking] = await Promise.all(promiseArr);

      const result = prRanking.map(item => {
        if(!item.id) { return; }

        item['scope'] = item.adp_status === null ? 'Global' : item.department_id === null ? 'Company' : 'Department';
        item['status'] = item.adp_status === null ? item.ad_status : item.adp_status;

        delete item.ad_status;
        delete item.adp_status;

        return item;
      }).filter(e => e);

      res.json({
        code: 200,
        data: result,
        hasMoreData: (page * limit) > count ? false : true,
        message: 'Productivity Ranking.',
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async upsertProductivityRanking(req, res, next) {
    try {
      const admin_id = req['decoded'].jsonData.admin_id;
      const { app_domain_id, department_id, status } = await PRValidator.upsertProductivityRanking().validateAsync(req.body);

      let insertId;
      if(department_id) {
        const result = await PRService.upsertProductivityRanking([[app_domain_id, admin_id, status, department_id]]);
        insertId = result.insertId;
      } else {
        const prRanking = await PRService.findProductivityRanking(`id`, `admin_id=${admin_id} AND app_domain_id=${app_domain_id} AND department_id IS NULL`);

        if(prRanking.length === 0) {
          const result = await PRService.addProductivityRankingStatus(app_domain_id, admin_id, status);
          insertId = result.insertId;
        } else {
          await PRService.updateProductivityRankingStatus(prRanking[0].id, status);
          insertId = prRanking[0].id;
        }
      }
      
      res.json({
        code: 200,
        data: (await PRService.findProductivityRanking(`*`, `id = ${insertId}`))[0],
        message: 'Success.',
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async addProductivityRanking(req, res, next) {
    try {
      const admin_id = req['decoded'].jsonData.admin_id;

      let { name, type, status } = await PRValidator.addProductivityRanking().validateAsync(req.body);

      if(type === 'WEB') { name = Common.extractHostname(name); }

      let [app_domain] = await PRService.findAppDomain(`id`, `name = "${name}"`);

      if(!app_domain) {
        const result = await PRService.addAppDomain(type, name);
        app_domain = { id: result.insertId };
      }

      const [prRanking] = await PRService.findProductivityRanking(`id`, `admin_id=${admin_id} AND app_domain_id=${app_domain.id} AND department_id IS NULL`);

      if(prRanking) {
        return res.status(400).json({ code: 400, data: null, message: `"${name}" Already Exist.`, error: 'Already Exist' });
      }

      const app_domain_productivity = await PRService.addProductivityRankingStatus(app_domain.id, admin_id, status);

      res.json({
        code: 200,
        data: (await PRService.findProductivityRanking(`app_domain_id, admin_id, status, department_id`, `id = ${app_domain_productivity.insertId}`))[0],
        message: 'Success.',
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async bulkAddProductivityRanking(req, res, next) {
    try {
      const admin_id = req['decoded'].jsonData.admin_id;

      const {data} = await PRValidator.bulkAddProductivityRanking().validateAsync(req.body);

      const [dataWithDeptId, dataWithoutDeptId] = _.partition(data, (o) => o.department_id);

      const toBeInsertedData = dataWithDeptId.map(item => [item.app_domain_id, admin_id, item.status, item.department_id]);

      await PRService.upsertProductivityRanking(toBeInsertedData);

      res.json({ code: 200, data: null, message: 'Success.', error: null });
    } catch (err) {
      next(err);
    }
  }

}

module.exports = new ProductivityRanking;