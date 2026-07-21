'use strict';
const orgBlockedDepartment = require('../../../models/organization_blocked_domains.schema');

class FirewallModel {
    constructor() {
        this.applicationInfoTable = 'application_info';
    }

    async getBlockedUserDomainFromMongo(day, userId) {
        return await orgBlockedDepartment.aggregate([
            {
                $match: {
                    block_type: 'U',
                    days: day,
                    status: 1,
                    userOrDeptId: userId,
                }
            },
            {
                $lookup: {
                    from: 'organization_apps_webs',
                    localField: 'domain_ids',
                    foreignField: '_id',
                    as: 'domainsData'
                }
            },
            {
                $lookup: {
                    from: 'organization_categories',
                    localField: 'category_ids',
                    foreignField: '_id',
                    as: 'categoriesData'
                }
            },
            {
                $project: {
                    domainsData: {
                        $map: {
                            input: '$domainsData',
                            as: 'domain',
                            in: '$$domain.name'

                        }
                    },
                    // categoriesData: {
                    //     $map: {
                    //         input: '$categoriesData',
                    //         as: 'category',
                    //         in: '$$category.name'
                    //     }
                    // }
                }
            }
        ]);
    }

    async getBlockedDepartmentDomainFromMongo(day, departmentId) {
        return await orgBlockedDepartment.aggregate([
            {
                $match: {
                    block_type: 'D',
                    days: day,
                    status: 1,
                    userOrDeptId: departmentId,
                }
            },
            {
                $lookup: {
                    from: 'organization_apps_webs',
                    localField: 'domain_ids',
                    foreignField: '_id',
                    as: 'domainsData'
                }
            },
            {
                $lookup: {
                    from: 'organization_categories',
                    localField: 'category_ids',
                    foreignField: '_id',
                    as: 'categoriesData'
                }
            },
            {
                $project: {
                    domainsData: {
                        $map: {
                            input: '$domainsData',
                            as: 'domain',
                            in: '$$domain.name'

                        }
                    },
                    // categoriesData: {
                    //     $map: {
                    //         input: '$categoriesData',
                    //         as: 'category',
                    //         in: '$$category.name'
                    //     }
                    // }
                }
            }
        ]);
    }
}

module.exports = new FirewallModel;