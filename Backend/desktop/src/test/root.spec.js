const chai = require('chai')
    , assert = chai.assert
    , expect = chai.expect
    , should = chai.should();
let chaiHttp = require('chai-http');

const rootUrl = 'http://localhost:3001/api/v1';

chai.use(chaiHttp);

//parent block
describe('Root', () => {
    // Before each test we empty the database
    // beforeEach((done) => {
    //     Book.remove({}, (err) => {
    //         done();
    //     });
    // });

    /*
      * Test the /GET route
      */
    describe('/GET /', () => {
        it('it should GET running status of server', (done) => {
            chai.request(rootUrl)
                .get('/')
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    expect(res.body).to.have.property('message');
                    expect(res.body.message).to.not.be.null;
                    expect(res.body.message).to.equal('Hi i m there !!!');
                    done();
                });
        });
    });

    describe('/GET /server-time', () => {
        it('it should not have error', (done) => {
            chai.request(rootUrl)
                .get('/server-time')
                .end((err, res) => {
                    expect(err).to.be.null;
                    done();
                });
        });
        it('it should have status code 200', (done) => {
            chai.request(rootUrl)
                .get('/server-time')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
    });


    /*
     * Test the /POST route
     */
    describe('/POST /body', () => {
        var books = [{
            "isbn": "121212",
            "title": "World Is Best",
            "author": "Larry",
            "year": "2016"

        }, {
            "isbn": "121213",
            "title": "Node JS",
            "author": "John",
            "year": "2016"

        }];
        it('it should Send request body params.', (done) => {
            chai.request(rootUrl)
                .post('/body')
                .send(books)
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    done();
                });
        });
    });

});