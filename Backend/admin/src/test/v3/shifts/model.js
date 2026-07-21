const {assert, expect, fixtures} = require('../../helpers/common');

const {OrganizationShiftsModel} = require('../../../routes/v3/shifts');

beforeEach(() => fixtures.load());

describe('Organization Shifts Model', async () => {
    it('Create', async () => {
        const entity = await OrganizationShiftsModel.create({
            organization_id: 1,
            name: 'Shift 1',
            data: '{"mon":{"status":false,"time":{"start":"09:00","end":"18:00"}},"tue":{"status":false,"time":{"start":"09:00","end":"18:00"}},"wed":{"status":false,"time":{"start":"09:00","end":"18:00"}},"thu":{"status":false,"time":{"start":"09:00","end":"18:00"}},"fri":{"status":false,"time":{"start":"09:00","end":"18:00"}},"sat":{"status":false,"time":{"start":"09:00","end":"15:00"}},"sun":{"status":false,"time":{"start":"09:00","end":"18:00"}}}',
            created_by: 1,
            color_code: 1,
        });
        assert.equal(entity.affectedRows, 1);
        expect(entity.insertId).to.be.a('number');
    });

    it('Get', async () => {
        const entity = await OrganizationShiftsModel.get(1);
        assert.equal(entity.id, 1);
        assert.equal(entity.organization_id, 1);
    });

    it('Update', async () => {
        const result = await OrganizationShiftsModel.update(
            1,
            { name: 'Shift 2', }
        );
        assert.equal(result.affectedRows, 1);
        assert.equal(result.changedRows, 1);

        const entity = await OrganizationShiftsModel.get(1);
        assert.equal(entity.name, 'Shift 2');
    });

    it('Delete', async () => {
        const result = await OrganizationShiftsModel.delete(1);
        assert.equal(result.affectedRows, 1);
    });

    it('Find by', async () => {
        const entities = await OrganizationShiftsModel.findBy({organization_id: 1});
        assert.equal(entities.length, 1);
        assert.equal(entities[0].organization_id, 1);
    });

    it('Times by date', async () => {
        const entity = await OrganizationShiftsModel.get(1);
        const times = await entity.timesByDate(new Date('2020-01-01 08:00:00'));
        assert.equal(times.start.format('YYYY-MM-DD HH:mm Z'), '2020-01-01 08:00 +00:00');
        assert.equal(times.end.format('YYYY-MM-DD HH:mm Z'), '2020-01-01 17:00 +00:00');
    });
});
