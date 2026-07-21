const collection = 'useractivitydatas';
const indexName = 'userIdDataId';

module.exports = {
  async up(db) {
    try {
      await db
        .collection(collection)
        .createIndex(
          { userId: 1, dataId: 1 },
          { name: indexName, background: true },
        );
    } catch (error) {
      console.log(error);
    }
  },

  async down(db) {
    try {
      await db.collection(collection).dropIndex(indexName);
    } catch (error) {
      console.log(error);
    }
  },
};
