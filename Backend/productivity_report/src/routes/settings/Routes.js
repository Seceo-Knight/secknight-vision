const multer = require('multer');
const router = require('express').Router();

const ProductivityRanking = require('./productivity-ranking/ProductivityRanking.controller');
const ProductivityRanking_old = require('./productivity-ranking/ProductivityRanking.controller_old');

class SettingsRoute {
  constructor() {
    this.myRoutes = router;
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, __dirname.split('src')[0] + 'public'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
      })
    }).single('file');
    this.core();
  }

  core() {

    //Productivity Ranking
    this.myRoutes.get('/productivity-rankings', ProductivityRanking.getProductivityRanking);
    this.myRoutes.put('/productivity-ranking', ProductivityRanking.bulkUpdateProductivityRanking);
    // this.myRoutes.put('/productivity-ranking-bulk', ProductivityRanking.bulkUpdateProductivityRanking);
    // this.myRoutes.put('/productivity-ranking', ProductivityRanking_old.upsertProductivityRanking);
    // this.myRoutes.post('/productivity-ranking-single', ProductivityRanking_old.addProductivityRanking);
    // this.myRoutes.post('/productivity-ranking-bulk', this.upload, ProductivityRanking_old.bulkAddProductivityRanking);

  }

  getRouters() {
    return this.myRoutes;
  }
}

module.exports = new SettingsRoute;