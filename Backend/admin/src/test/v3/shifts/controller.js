const {request, assert, expect, auth, fixtures} = require('../../helpers/common');

const {OrganizationShiftsModel} = require('../../../routes/v3/shifts');

beforeEach(() => fixtures.load());

describe('Shifts Controller', async () => {
    it('Create', async () => {
        const response = await auth.loginAsEmployee(request
            .post('/api/v3/organization-shift')
            .send({
                name: 'Shift 2',
                data: '{"mon":{"status":false,"time":{"start":"09:00","end":"18:00"}},"tue":{"status":false,"time":{"start":"09:00","end":"18:00"}},"wed":{"status":false,"time":{"start":"09:00","end":"18:00"}},"thu":{"status":false,"time":{"start":"09:00","end":"18:00"}},"fri":{"status":false,"time":{"start":"09:00","end":"18:00"}},"sat":{"status":false,"time":{"start":"09:00","end":"15:00"}},"sun":{"status":false,"time":{"start":"09:00","end":"18:00"}}}',
                color_code: 1,
            }));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity created.');
        expect(response.body.data.id).to.be.a('number');
    });

    it('Get', async () => {
        const response = await auth.loginAsEmployee(request.get('/api/v3/organization-shift?id=1'));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity returned.');
        assert.equal(response.body.data[0].id, 1);
        assert.equal(response.body.data[0].name, 'Shift 1');
        expect(response.body.data[0].data).to.be.a('string');
    });

    it('Update', async () => {
        const data = "{\"mon\":{\"status\":true,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}},\"tue\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}},\"wed\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}},\"thu\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}},\"fri\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}},\"sat\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"15:00\"}},\"sun\":{\"status\":false,\"time\":{\"start\":\"09:00\",\"end\":\"18:00\"}}}";
        const response = await auth.loginAsEmployee(request
            .put('/api/v3/organization-shift')
            .send({
                id: 1,
                name: "new_name",
                data: data,
                color_code: 1,
            }));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity updated.');
        const {result} = response.body.data;
        assert.equal(result.id, 1);
        const entity = await OrganizationShiftsModel.get(1);
        assert.equal(entity.name, 'new_name');
        assert.equal(entity.data, data);
    });

    it('Delete', async () => {
        const response = await auth.loginAsEmployee(request
            .delete('/api/v3/organization-shift')
            .send({id: 1}));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity deleted.');
        assert.equal(response.body.data.id, 1);
        try {
            await OrganizationShiftsModel.get(1);
        } catch (e) {
            assert.equal(e.message, 'Record Not Found');
        }
    });

    it('Find by', async () => {
        const response = await auth.loginAsEmployee(request
            .get('/api/v3/organization-shift/find_by?name=Shift+1&created_by=1&updated_by=2'));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entities returned.');
        assert.equal(response.body.data.length, 1);
        const entity = response.body.data[0];
        assert.equal(entity.name, 'Shift 1');
        assert.equal(entity.created_by, 1);
        assert.equal(entity.updated_by, 2);
    });
});
