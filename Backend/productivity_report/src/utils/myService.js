const Response = require("express");

exports.sendResponse = (res, code, data, message, error) => {
    return res
        // .status(code)
        .json({
            code: code,
            message: message,
            error: error,
            data: data
        });
};