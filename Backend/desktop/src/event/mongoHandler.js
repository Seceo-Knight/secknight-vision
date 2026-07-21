const EmpKeyStrokesModel = require('../models/employee_keystrokes.schema');

/**
 * @description
 * To inset keystrokes.
 *
 * @param {Object} dataObj
 * @param {Number} dataObj.attendance_id
 * @param {String} dataObj.keystrokes
 */
exports.upsertKeyStrokes = (dataObj) => {
    EmpKeyStrokesModel.findOne({attendance_id: dataObj.attendance_id}, (err, keystrokeData) => {
        if(err) return console.error(err);
        if(keystrokeData) {
            keystrokeData.keystrokes += dataObj.keystrokes
            keystrokeData.save();
        } else {
            new EmpKeyStrokesModel({
                attendance_id: dataObj.attendance_id,
                keystrokes: dataObj.keystrokes
            }).save((err) => {
                if(err) console.error(err);
            });
        }
    });
}