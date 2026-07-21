const Joi = require('joi');

class Desktop {

    validateDesktopData(user_ids, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep) {
        const schema = Joi.object().keys({
            user_ids: Joi.array().items(Joi.number()).min(1),
            // user_ids: Joi.array().items(Joi.object({ user_id: Joi.number().required() })).required().min(1),
            shutdown: Joi.boolean().allow(''),
            restart: Joi.boolean().allow(''),
            logoff: Joi.boolean().allow(''),
            lock_computer: Joi.boolean().allow(''),
            task_manager: Joi.boolean().allow(''),
            block_usb: Joi.boolean().allow(''),
            lock_print: Joi.boolean().allow(''),
            signout: Joi.boolean().allow(''),
            hibernate: Joi.boolean().allow(''),
            sleep: Joi.boolean().allow(''),
        });
        var result = Joi.validate({ user_ids, shutdown, restart, logoff, lock_computer, task_manager, block_usb, lock_print, signout, hibernate, sleep }, schema);
        return result;
    }

}

module.exports = new Desktop;

