const {BaseModel} = require('../../../models/BaseModel');

class EmployeeUserModel extends BaseModel {
    static get TABLE_NAME() {
        return 'users';
    }

    static get TABLE_FIELDS() {
        return [
            'id', 'first_name', 'last_name', 'email', 'password', 'a_email', 'email_verified_at', 'contact_number',
            'date_join', 'address', 'photo_path', 'status', 'computer_name', 'domain', 'username',
            'is_active_directory', 'active_directory_meta', 'created_at', 'updated_at',
        ];
    }
}

module.exports.EmployeeUserModel = EmployeeUserModel;
