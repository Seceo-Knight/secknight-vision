
const multer = require('multer');
const ResellerCURD = require('../shared/ResellerCURD')
const sendResponse = require('../../utils/myService').sendResponse;
const Validation = require('.././../rules/validation/Reseller')


const upload = multer({
    dest: __dirname.split('src')[0] + 'public/reseller',
    filename: function (req, file, callback) {
        callback(null, file)
    }
}).fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]);



class ResellerService {
    async addResellerData(req, res) {
        upload(req, res, async function (err) {

            let admin_id = req['decoded'].jsonData.admin_id;
            const title = req.query.title;
            const brand = req.query.brand;
            const validate = Validation.addResellerData(title, brand);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const logo = req.files['logo'] ? `/reseller/${req.files['logo'][0].filename}` : null;
            const favicon = req.files['favicon'] ? `/reseller/${req.files['favicon'][0].filename}` : null;

            const create_reseller = await ResellerCURD.createReseller(admin_id, title, logo, favicon, brand);
            if (create_reseller.affectedRows == 0) return sendResponse(res, 400, null, 'Failed To Insertes Reseller Data.', null);

            return sendResponse(res, 200, { id: create_reseller.insertId, title: title, brand: brand, logo: logo, favicon: favicon }, 'Successfully Insertes Reseller Data.', null);

        })

    }

    async getResellerData(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const get_reseller_data = await ResellerCURD.getReseller(admin_id);
        if (get_reseller_data.length == 0) return sendResponse(res, 400, null, 'No Data Found.', null);
        return sendResponse(res, 200, get_reseller_data, 'Success.', null);
    }

}

module.exports = new ResellerService;