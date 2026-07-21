const chai = require('chai')
    , assert = chai.assert
    , expect = chai.expect
    , should = chai.should();
let chaiHttp = require('chai-http');

const rootUrl = 'http://localhost:3001/api/v1';

chai.use(chaiHttp);

describe('Auth', () => {
    describe('POST /login', () => {
        it('it should log in', (done) => {
            chai.request(rootUrl)
                .post('/login')
                .send({
                    "email": "test@gmail.com",
                    "password": "13e28b656f10170e08c90637d61ab6bf:1b06479eb8b9891b9835016dcd3faa691b631522b4bcfa00b8689e1b0dfa3db5"
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.not.be.null;
                    expect(res.body.data).to.equal(true);
                    done();
                })
        });
        it('it should return user does not exist', (done) => {
            chai.request(rootUrl)
                .post('/login')
                .send({
                    "email": "asd@gmail.com",
                    "password": "asd"
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('code');
                    expect(res.body.data).to.not.be.null;
                    expect(res.body.data).to.equal(false);
                    expect(res.body.code).to.equal(404);
                    done();
                })
        });
        it('it should return password did not match!!!', (done) => {
            chai.request(rootUrl)
                .post('/login')
                .send({
                    "email": "test@gmail.com",
                    "password": "asd"
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('code');
                    expect(res.body.data).to.not.be.null;
                    expect(res.body.code).to.equal(400);
                    expect(res.body.data).to.equal(false);
                    done();
                })
        });
        it('it should return something is missing', (done) => {
            chai.request(rootUrl)
                .post('/login')
                .send({
                    "email": "test@gmail.com",
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('code');
                    expect(res.body.data).to.not.be.null;
                    expect(res.body.error).to.not.be.null;
                    expect(res.body.code).to.equal(500);
                    expect(res.body.data).to.equal(false);
                    done();
                })
        });
    });
});
