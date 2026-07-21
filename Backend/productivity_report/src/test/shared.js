const expect = require('chai').expect;
const axios = require('axios');

const User = require('../routes/shared/User');
const Storage = require('../routes/shared/Storage')

let token = `d53a0303c7cebf166167284fa78aedda:a1fe223ce9cf017bc35d0f8cfdf9471fc06c4124186e8419ed41bc6d2a51530314c131e8fb017c0499160ba8ff958413444b3c86cccde92e46ceaea6153568f69cee28bd3d2062ebbc38e4fe426b9b6a1316b2bc199886a525c37b28ff81606fd034d374f9218d885a35f03ff5cdb045e4c4c6dfd91424c251d675fbb6ddc4d1457ad4dcfbf8a3056c0c567b600d40775f2b8abf1a250880fa3daa9cfa63100b57d6b8bd36a6d233a9d5eaf236bc6bf684da2fa98f872da8788e9478de0ba8c506bd8568ee3d79388ec30ee8b2b6c1374ab4cbc3babdd60327339c54b5c5d84a92b81e2342fac8a7728550d5203592bb7d3ebef9a11a4f18bbc2b2f2a8a76692c703cdebf4bbba71ff67e03cb33ee37dbac88db644484398c868b8b6286bad4efbbe07a0317d0a8fbb14b9208cd1d6c4ad866f28b9f47fac7ec205bb2d7af3cf890dadd3867cb8d6c8f517bbaf2d33e42a74cfb997f4a98187ae8b309e5d458175d25374e63188ccb79e453c8ac7e01e1d9aea86ad09b3b436849be1ec3460ff04d074b908cd4ee2c4b93caadf1272cf77718012ca39e790d629b0a92bd6e288bcf91ba304b4f80679790516cd71147481cdebb4c2d0dfd6cfb1eba1a006c0c70f0ec258fdef49e2e509149fb947ffd2`;
let url = "http://localhost:3002/api/v1";
let user_agent = "1234"
/**Validate Valid Inputs */
describe('Validated Valid Input', () => {

    describe(`Manager Authentication   ${__filename}`, (done) => {
        it('Should not have error if the manager auth values are valid input(manager Auth)', function (done) {
            request.post({
                url: url + "/manager-auth",
                headers: { "user-agent": user_agent },
                form: { userName: "manager@gmail.com", password: "Manager@123", ip: "123.123.123.128" }
            }, function (error, response, body) {
                body = JSON.parse(body)
                expect(body.code).to.equal(200);
                expect(body.data).to.not.be.null;
                expect(body.data).to.be.string
                expect(body.error).to.be.null;
                done();
            });
        });

        it('Should return logged user datails (detalais)', function (done) {
            request({
                headers: { "x-access-token": token, "user-agent": user_agent, },
                url: url + "/details",
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        });
    })

    describe(`Admin Authentication   ${__filename}`, (done) => {
        it('Should not have error if the Admin auth values are valid input(Admin Auth)', function (done) {
            request.post({
                url: url + "/admin-authentication",
                headers: { "user-agent": user_agent },
                form: {
                    "name": "basavaraj s",
                    "first_name": "basavaraj",
                    "last_name": "s",
                    "email": "raj.ueiug@gmail.com",
                    "username": "sureshbabug",
                    "address": "basavaraj s",
                    "phone": "+7829552254",
                    "product_id": "1",
                    "begin_date": "2019-01-27",
                    "expire_date": "2019-01-27"
                }
            }, function (error, response, body) {
                body = JSON.parse(body)
                console.log(body, '=========================')
                expect(body.code).to.equal(200);
                expect(body.data).to.not.be.null;
                expect(body.error).to.be.null;
                done();
            });
        });

        it('Should return logged user datails (detalais)', function (done) {
            request({
                headers: { "x-access-token": token, "user-agent": user_agent, },
                url: url + "/details",
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        });
    })

    describe(`Role Input Validation ${__filename}`, () => {
        it('Should not have error if the Role values are valid input(adding Role)', (done) => {
            request.post({
                headers: { "x-access-token": token, "user-agent": user_agent, },
                url: url + "/add-role", form: { "name": "Admin", "params": "A", },
            },
                function (error, response, body) {
                    body = JSON.parse(response.body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        })
        it('Should not have error while getting Role(Get Role)', (done) => {
            request({
                headers: { "x-access-token": token, "user-agent": user_agent },
                url: url + "/get-role"
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        })
    })


});


/**Validate Invalid Inputs */
describe(`Validated Invalid Input`, () => {

    describe(`Manager Authentication ${__filename}`, () => {
        it('Should have error if the manager auth values are invalid input(manager Auth)', function (done) {
            request.post({ url: url + "/manager-auth", form: { userName: "", password: "Manager@123", ip: "123.123.123.128" } }, function (error, response, body) {
                body = JSON.parse(body)
                // expect(body.code).not.equal(200);
                expect(body.code).to.equal(404);

                expect(body.data).to.be.null;
                expect(body.error).to.not.be.null;
                done();
            });
        });
    })


    describe(`Admin Authentication   ${__filename}`, (done) => {
        let data;
        it('Should  have error if the Admin auth values are invalid input(Admin Auth)', function (done) {
            request.post({
                url: url + "/admin-authentication",
                headers: { "user-agent": user_agent },
                form: {
                    "name": "",
                    "first_name": "",
                    "last_name": "s",
                    "email": "@gmail.com",
                    "username": "basavarajs",
                    "address": "basavaraj s",
                    "phone": "+7829552254"
                }
            }, function (error, response, body) {

                body = JSON.parse(body)
                data = body
                expect(body.code).to.equal(404);
                expect(body.data).to.be.null;
                expect(body.error).to.not.be.null;
                done();
            });
            console.log(body, '==============================')
        });

        it('Should return logged user datails (detalais)', function (done) {
            request({
                headers: { "x-access-token": token, "user-agent": user_agent, },
                url: url + "/details",
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        });
    })

    describe(`Role Input Validation ${__filename}`, () => {
        it('Should  have error if the Role values are invalid input(adding Role)', (done) => {
            request.post({
                headers: { "x-access-token": token, "user-agent": user_agent },
                url: url + "/add-role", form: { "name": "", "params": "A", },
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(404);
                    expect(body.error).to.not.be.null
                    done();
                });
        })

        it('Should have error while getting Role(Get Role)', (done) => {
            request({
                headers: { "x-access-token": token, "user-agent": user_agent },
                url: url + "/get-role"
            },
                function (error, response, body) {
                    body = JSON.parse(body)
                    expect(body.code).to.equal(200);
                    expect(body.error).to.be.null
                    done();
                });
        })
    })





});

