'use strict';
const indexesOptions = [
  { tableName: 'production_stats', indexFields: ['user_id'] },
  {
    tableName: 'employee_timesheet',
    indexFields: ['attendance_id', 'type', 'mode'],
  },
  { tableName: 'project_tasks', indexFields: ['name'] },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      await Promise.all(
        indexesOptions.map(({ tableName, indexFields }) => {
          return queryInterface.addIndex(tableName, indexFields, {
            transaction,
          });
        }),
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      await Promise.all(
        indexesOptions.map(({ tableName, indexFields }) => {
          return queryInterface.removeIndex(tableName, indexFields, {
            transaction,
          });
        }),
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
