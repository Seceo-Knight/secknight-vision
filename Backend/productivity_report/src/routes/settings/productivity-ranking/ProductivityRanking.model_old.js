const mySql = require('../../../database/MySqlConnection').getInstance();

class PRService {

  async productivityRankingCount() {
    const query = `
      SELECT COUNT(*)
      FROM app_domain;
    `;

    const data = await mySql.query(query);
    return data[0]['COUNT(*)'];
  }

  async adminActivityCount(admin_id, type = null, startDate, endDate) {
    type = type ? `AND at.type="${type}"` : ``;
    const dateFilter = (startDate && endDate) ? `AND day BETWEEN "${startDate}" AND "${endDate}"` : ``;

    const query = `
      SELECT COUNT (DISTINCT ad.id) AS count
      FROM activity_track AS at
      INNER JOIN app_domain AS ad
        ON ad.name = at.name
      WHERE
        ad.id IS NOT NULL AND
        admin_id=${admin_id} ${dateFilter} ${type};
    `;

    const data = await mySql.query(query);
    return data[0]['count'];
  }

  async deptActivityCount(admin_id, dept_id, type = null, startDate, endDate) {
    type = type ? `AND at.type="${type}"` : ``;
    const dateFilter = (startDate && endDate) ? `AND at.day BETWEEN "${startDate}" AND "${endDate}"` : ``;

    const query = `
      SELECT COUNT (DISTINCT ad.id) AS count
      FROM users  AS u
      LEFT JOIN activity_track  AS at
        ON at.user_id = u.id
      INNER JOIN app_domain AS ad
        ON ad.name = at.name
      WHERE
        ad.id IS NOT NULL AND
        u.admin_id=${admin_id} AND
        u.department_id=${dept_id} ${dateFilter} ${type};
    `;

    const data = await mySql.query(query);
    return data[0]['count'];
  }

  getProductivityRankingOld(admin_id, limit, offset) {
    const query = `
      SELECT
        ad.id, ad.type, ad.name,
        adp.status
      FROM app_domain AS ad
      LEFT JOIN app_domain_productivity AS adp
        ON ad.id = adp.app_domain_id AND adp.admin_id = ${admin_id}
      LIMIT ${limit} OFFSET ${offset};
    `
    return mySql.query(query);
  }

  getAdminProductivityRanking(admin_id, limit, offset, type = null, startDate, endDate) {
    type = type ? `AND at.type="${type}"` : ``;
    const dateFilter = (startDate && endDate) ? `AND at.day BETWEEN "${startDate}" AND "${endDate}"` : ``;

    const query = `
      SELECT
        DISTINCT ad.id, ad.type, ad.name, ad.status AS ad_status,
        adp.status AS adp_status, adp.department_id AS department_id
      FROM activity_track   AS at
      INNER JOIN app_domain  AS ad
        ON ad.name = at.name
      LEFT JOIN app_domain_productivity AS adp
        ON ad.id = adp.app_domain_id  AND adp.admin_id = ${admin_id} AND adp.department_id IS NULL
      WHERE at.admin_id=${admin_id} ${dateFilter} ${type}
      LIMIT ${limit} OFFSET ${offset};
    `;

    return mySql.query(query);
  }

  getDeptProductivityRanking(admin_id, dept_id, limit, offset, type = null, startDate, endDate) {
    type = type ? `AND at.type="${type}"` : ``;
    const dateFilter = (startDate && endDate) ? `AND at.day BETWEEN "${startDate}" AND "${endDate}"` : ``;

    const query = `
      SELECT
        DISTINCT ad.id, ad.type, ad.name, ad.status AS ad_status,
        adp.status AS adp_status, adp.department_id AS department_id
      FROM users  AS u
      LEFT JOIN activity_track  AS at
        ON at.user_id = u.id
      INNER JOIN app_domain  AS ad
        ON ad.name = at.name
      LEFT JOIN app_domain_productivity AS adp
        ON ad.id = adp.app_domain_id  AND adp.admin_id = ${admin_id} AND adp.department_id = ${dept_id}
      WHERE
        u.admin_id=${admin_id} AND
        u.department_id=${dept_id} AND
        at.admin_id=${admin_id} ${dateFilter} ${type}
      LIMIT ${limit} OFFSET ${offset};
    `
    return mySql.query(query);
  }

  findProductivityRanking(columns, filter) {
    const query = `
      SELECT ${columns}
      FROM app_domain_productivity
      WHERE ${filter};
    `;

    return mySql.query(query);
  }

  findAppDomain(columns, filter) {
    const query = `
      SELECT ${columns}
      FROM app_domain
      WHERE ${filter};
    `;

    return mySql.query(query);
  }

  updateProductivityRankingStatus(id, status) {
    const query = `
      UPDATE app_domain_productivity
      SET status = ${status}
      WHERE id = ${id};
    `;

    return mySql.query(query);
  }

  addAppDomain(type, name) {
    const query = `
      INSERT INTO app_domain
        (type, name)
      VALUES
        ("${type}", "${name}")
    `;

    return mySql.query(query);
  }

  addProductivityRankingStatus(app_domain_id, admin_id, status, department_id = null) {
    const query = `
      INSERT INTO app_domain_productivity
        (app_domain_id, admin_id, status, department_id)
      VALUES
        (${app_domain_id}, ${admin_id}, ${status}, ${department_id})
    `;

    return mySql.query(query);
  }

  bulkAddProductivityRanking(dataObj) {
    const query = `
      INSERT IGNORE INTO app_domain_productivity (app_domain_id, admin_id, status, department_id)
      VALUES ?
    `;

    return mySql.query(query, [dataObj]);
  }

  upsertProductivityRankingOld(admin_id, app_domain_id, status, department_id = null) {
    const query = `
      INSERT INTO app_domain_productivity
        (app_domain_id, admin_id, status, department_id)
      VALUES
        (${app_domain_id}, ${admin_id}, ${status}, ${department_id})
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        app_domain_id = ${app_domain_id},
        admin_id = ${admin_id},
        status = ${status},
        department_id = ${department_id};
    `;

    return mySql.query(query);
  }

  upsertProductivityRanking(dataObj) {
    const query = `
      INSERT INTO app_domain_productivity (app_domain_id, admin_id, status, department_id)
      VALUES ?
        
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        status = VALUES(status);
    `;

    return mySql.query(query, [dataObj]);
  }

}

module.exports = new PRService;


// (async() => {
//   // const query = `
//       // SELECT *
//       //   FROM app_domain_productivity
//       //   WHERE (app_domain_id, admin_id, department_id) IN ((1, 1, ISNULL),(1, 1, 1),(1, 1, 2))
//   // `
//   const query = `
//     SELECT *
//     FROM app_domain_productivity
//     WHERE
//       (app_domain_id=1 AND admin_id=1 AND department_id IS NULL) OR
//       (app_domain_id=1 AND admin_id=1 AND department_id = 1) OR
//       (app_domain_id=1 AND admin_id=1 AND department_id = 2);
//   `
//   console.log(await mySql.query(query));
// })()

// (async() => {
//   const query = `
//     SELECT
//       ad.id, ad.type, ad.name, ad.status AS ad_status,
//       adp.status AS adp_status, adp.department_id AS dept_id
//     FROM activity_track   AS at
//     LEFT JOIN app_domain  AS ad
//       ON ad.name = at.name
//     LEFT JOIN app_domain_productivity AS adp
//       ON ad.id = adp.app_domain_id  AND adp.admin_id = 1 AND adp.department_id IS NULL
//     WHERE at.admin_id=1 AND at.day BETWEEN "2020-02-07" AND "2020-02-12"
//     LIMIT 10 OFFSET 0;
//   `;
//   // const query = `
//   //   SELECT
//   //     ad.id, ad.type, ad.name,
//   //     adp.status
//   //   FROM app_domain AS ad
//   //   LEFT JOIN app_domain_productivity AS adp
//   //     ON ad.id = adp.app_domain_id AND adp.admin_id = 1
//   //   LIMIT 3 OFFSET 0;
//   // `;
  
//   const data = await mySql.query(query);
//   console.log(data);
//   console.log(data.length);
// })()


// (async() => {
//   const query = `
//     SELECT
//       ad.id, ad.type, ad.name, ad.status AS ad_status,
//       adp.status AS adp_status, adp.department_id AS apd_dept_id,
//       at.*
//     FROM users  AS u
//     LEFT JOIN activity_track  AS at
//       ON at.user_id = u.id
//     LEFT JOIN app_domain  AS ad
//       ON ad.name = at.name
//     LEFT JOIN app_domain_productivity AS adp
//       ON ad.id = adp.app_domain_id  AND adp.admin_id = 1 AND adp.department_id = 2
//     WHERE u.admin_id=1 AND u.department_id=2 AND at.admin_id=1 AND at.day BETWEEN "2020-02-07" AND "2020-02-12"
//     LIMIT 10 OFFSET 0;
//   `;
//   // const query = `
//   //   SELECT
//   //     ad.id, ad.type, ad.name,
//   //     adp.status
//   //   FROM app_domain AS ad
//   //   LEFT JOIN app_domain_productivity AS adp
//   //     ON ad.id = adp.app_domain_id AND adp.admin_id = 1
//   //   LIMIT 3 OFFSET 0;
//   // `;
  
//   const data = await mySql.query(query);
//   console.log(data);
//   console.log(data.length);
// })()