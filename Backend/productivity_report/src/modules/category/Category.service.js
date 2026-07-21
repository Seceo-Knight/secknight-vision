
const CategoryModel = require('./Category.model');
const CategoryController = require('./Category.controller');
const isValidDomain = require('is-valid-domain');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter;
event.setMaxListeners(0);

event.on('category', async (damain_name, domain_id, organization_id) => {
    try {
        domain_id = domain_id._id

        if (!isValidDomain(damain_name)) {
            // console.log(`-------category : uncategorized---Invalid Domain-- URL : ${damain_name} `)
            let resultData = await CategoryController.upsertOrgCategory([{ name: 'uncategorized' }], domain_id, organization_id)
            return resultData;
        } else {
            const get_category = await CategoryModel.getDomainCategory(damain_name);
            /**  Stage-1 For Perticular domain category already added in DB (For=> if domain category found database)*/
            if (get_category.length > 0) {
                let resultData = await CategoryController.upsertOrgCategory(get_category, domain_id, organization_id)
                return resultData;
            } else {
                /** Stage-2 Finding Domain category from URL metadata */
                const get_category_metadata = await CategoryController.getCategoryFromMetadate(damain_name, domain_id, organization_id)

                if (get_category_metadata != null) {
                    return get_category_metadata
                }
                return null;
            }
        }
    } catch (err) {
        console.log(err, '--------error------')
        return null;
    }
})

module.exports = event;

