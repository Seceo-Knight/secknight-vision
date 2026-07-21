const multer = require('multer');

const Employee = require('../shared/User');

const upload = multer({
    dest: __dirname.split('src')[0] + 'public/images/profilePic/'
}).single('avatar');

class UserService {

    //Role of user like employee,Manger
    addRole(req, res) {
        let name = req.body.name;
        let params = req.body.params;
        if (name) {
            Employee.addRole(name, params, (err, data) => {
                if (err) {
                    return res.json({ code: 400, data: null, message: 'Error while adding role', error: err });
                } else if (data.affectedRows > 0) {
                    return res.json({ code: 200, data: null, message: 'Succefully role added', error: err });
                } else {
                    return res.json({ code: 204, data: null, message: 'Role already exists', error: err });
                }
            })
        } else {
            return res.json({ code: 400, data: null, message: 'Field missing', error: null });
        }
    }

    //Get list of role 
    getRole(req, res) {
        Employee.retrieveRole((err, data) => {
            if (err) {
                return res.json({ code: 400, data: null, message: 'Error while getting role data', error: err });
            } else {
                return res.json({ code: 200, data: data, message: 'Role data', error: err });
            }
        })
    }

    //Add employee to databse
    addUser(req, res) {
        upload(req, res, function (err) {
            let filename;
            if (req.file) {
                filename = `'/public/default/profilePic/${req.file.filename}`
            } else {
                filename = '/public/default/profilePic/user.png'
            }
            console.log('=======data===============', req.body);

            if (name, email, password, location_id, department_id, role_id, status) {

            } else {
                return res.json({ code: 400, data: null, message: 'Field missing', error: null });
            }
        })
    }

}

module.exports = new UserService;

// var aes256 = require('aes256');

// var key = 'Globus7879';
// var plaintext = 'my plaintext message';

// var encrypted = aes256.encrypt(key, plaintext);
// console.log('========enc===========', encrypted);
// var decrypted = aes256.decrypt(key, "Wxf9qg3Gb6dPieNpxYIJBwiuZCZl5lD24HpCu7CNLBU=");
// console.log('=========dec============', decrypted);

// var aes256 = require('aes256');

// var key = 'my passphrase';
// var plaintext = 'my plaintext message';

// var cipher = aes256.createCipher(key);

// var encrypted = cipher.encrypt(plaintext);
// var decrypted = cipher.decrypt("Wxf9qg3Gb6dPieNpxYIJBwiuZCZl5lD24HpCu7CNLBU=");
// console.log('=================enc=======', encrypted);
// console.log('=================dnc=======', decrypted);


// var bcrypt = require('bcryptjs');
// var salt = bcrypt.genSaltSync(10);
// var hash = bcrypt.hashSync("B4c0/\/", salt);
// console.log('=================', hash);
// // Load hash from your password DB.
// let res = bcrypt.compareSync("B4c0/\/", hash); // true
// // let bcrypt.compareSync("not_bacon", hash); // false
// console.log('=================', res);
