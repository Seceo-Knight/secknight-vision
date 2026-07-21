const router = require('express').Router();
const WebDAVController = require('./webdav.controller');

const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + file.originalname
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage });

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {

    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;