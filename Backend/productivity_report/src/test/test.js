const expect = require('chai').expect;
var axios = require('axios');

let token = `14f893bbaa8f1a8ae79bf317096b73b9:08cfc6f7eb1ff48eeb3cf21145b7c2dd671478430a356ff8ec9af08dd1cf03da8870992006aa48af04fbbf117b42a11ddee4ed43d9d2f12e95b70c718afdd98c2a04cabe6848f8bc9b440893e601a9a8e11535b3333c598d1a30bfe361f242e6096858b0d2a34b33bf527a05d548c6b7a17a5f17e094b8a40e546ca8860e0a884f2102a8d7a6c749565e88f29a034790dc24df017c2df7ce07aacd902b8d986ff189d9d4ebb4a4e195942f1b92046b54bde51ead2e6db8b543a96d4d4ed67e524115a90ad155ac2e895e27a54812a3ee31c14ca3cadace9905b91691fb1d2bdad65772bf0b1618d743b0eb956a861fd707be991769f3a558ab8d064c1838f853ec8d996d72165e577e3495a599d9b432f905314b79198a552a358c54cd579be80e3fac9799d1504941af2b792a26d9a6cb8f08ccbd671dd4e11971080d12bfae230b6c8b2e9598782741fb1c5e954b97d401573f9acd8961f816e84b8311121b87f24654a0bbbed210fd28e3a7f017d2d1eac74cd556933b681f381d064244dae19f41e5399eda5b3442afd932fa5162e03095c4718a717ace43609aed65049d84f433a7ca6f6ef55013dd13b2278a7ea63c07b4a4c67436ed5bdfe19457bf7e3096596a725da05bcdd59b66fcc0209485e7279aa417b7e6b7e01754ddc0f862511fe7d8809fa106c513f1a3103f2b1ba7fa20dae34974882979b6d32d33b6c70c5eccfa1919bed62cd39e4264c29b29257089f94d1972d1d1b8b6b1248aa1ef1f2e6c26ff0b1487a782b298798078b0`;
let url = "http://localhost:3002/api/v1";
let user_agent = "1234"

/**Validate valid Inputs */
describe('Validated Valid Input', () => {

    describe(`Admin Authentication   ${__filename}`, (done) => {
        //     it('Should not have error if the Admin auth values are valid input(Admin Auth)', function (done) {
        //         request.post({
        //             url: url + "/admin-authentication",
        //             headers: { "user-agent": user_agent },
        //             form: {
        //                 "name": "basavaraj s",
        //                 "first_name": "basavaraj",
        //                 "last_name": "s",
        //                 "email": "basavaraj@gmail.com",
        //                 "username": "sureshbabug",
        //                 "address": "basavaraj s",
        //                 "phone": "+7829552254",
        //                 "product_id": "1",
        //                 "begin_date": "2019-01-27",
        //                 "expire_date": "2019-01-27"
        //             }
        //         }, function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.data).to.not.be.null;
        //             expect(body.error).to.be.null;
        //             done();
        //         });
        //     });

        //     // it('Should return logged user datails (detalais)', function (done) {
        //     //     request({
        //     //         headers: { "x-access-token": token, "user-agent": user_agent, },
        //     //         url: url + "/details",
        //     //     },
        //     //         function (error, response, body) {
        //     //             body = JSON.parse(body)
        //     //             console.log(body)
        //     //             expect(body.code).to.equal(200);
        //     //             expect(body.error).to.be.null
        //     //             done();
        //     //         });
        //     // });
    })

    describe(`Role Input Validation ${__filename}`, () => {
        //     it('Should not have error if the Role values are valid input(adding Role)', (done) => {
        //         request.post({
        //             headers: { "x-access-token": token, "user-agent": user_agent, },
        //             url: url + "/add-role", form: { "name": "Admin", "params": "A", },
        //         },
        //             function (error, response, body) {
        //                 body = JSON.parse(response.body)
        //                 expect(body.code).to.equal(200);
        //                 expect(body.error).to.be.null
        //                 done();
        //             });
        //     })
        //     it('Should not have error while getting Role(Get Role)', (done) => {
        //         request({
        //             headers: { "x-access-token": token, "user-agent": user_agent },
        //             url: url + "/get-role"
        //         },
        //             function (error, response, body) {
        //                 body = JSON.parse(body)
        //                 expect(body.code).to.equal(200);
        //                 expect(body.error).to.be.null
        //                 done();
        //             });
        //     })
    })

    describe(`Department Input Validation ${__filename}`, () => {

        //     it('Should not have error if the department input values  are valid input(Add Department)', (done) => {
        //         request.post({
        //             headers: { "x-access-token": token, "user-agent": user_agent },
        //             url: "http://localhost:3002/api/v1/create-departments", form: {
        //                 "name": "PHP",
        //                 "short_name": "PHP",
        //             }
        //         },
        //             function (error, response, body) {
        //                 console.log(body, '====================================', error)
        //                 body = JSON.parse(body)
        //                 expect(body.code).to.equal(200);
        //                 expect(body.error).to.be.null
        //                 done();
        //             });
        //     })


        //     it('Should not have error if the get department input values  are valid input(get Departments)', (done) => {

        //         request.post({
        //             headers: { "x-access-token": token, "user-agent": user_agent },
        //             url: url + "/get-departments", form: {
        //                 "skip": "0",
        //                 "limit": "10"
        //             }
        //         },
        //             function (error, response, body) {
        //                 body = JSON.parse(body)
        //                 expect(body.code).to.equal(200);
        //                 expect(body.error).to.be.null
        //                 done();
        //             });
        //     })

        //     it('Should not have error if the update department input values  are valid input(update Department)', (done) => {

        //         request.put({
        //             headers: { "x-access-token": token, "user-agent": user_agent },
        //             url: url + "/update-department", form: {
        //                 "name": "Android",
        //                 "short_name": "AND",
        //                 "department_id": "1"
        //             }
        //         },
        //             function (error, response, body) {
        //                 body = JSON.parse(body)
        //                 expect(body.code).to.equal(200);
        //                 expect(body.error).to.be.null
        //                 done();
        //             });
        //     })

    })

    describe(`Location Input Validation ${__filename}`, () => {

        // it('Should not have error if the Location input values  are valid input(Add Location )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: "http://localhost:3002/api/v1/add-location", form: {
        //             "name": "Hydrabad",
        //             "short_name": "HYD",
        //         }
        //     },
        //         function (error, response, body) {
        //             console.log(body, error)
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the get Location input values are valid input(get Location )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-locations", form: {
        //             "skip": "0",
        //             "limit": "10",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the update Location input values are valid input(update Location )', (done) => {
        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/update-location", form: {
        //             "name": "bangalorrr",
        //             "short_name": "bang",
        //             "location_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the adding department to Location input values are valid input(add department to Location )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/add-department-location", form: {
        //             "location_id": "1",
        //             "department_ids": [
        //                 1
        //             ],
        //             "department_name": "Nodeasasdaasrr js",
        //             "short_name": "NODsxasdaErr"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();


        //         });
        // })

        // it('Should not have error if the add department to location by name from Location input values are valid input(add department to Location by name )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/add-dept-location-by-name", form: {
        //             "location": "mysoreerdfsd",
        //             "short_name": "myrwr",
        //             "department_id": "1",
        //             "department_name": "javtgfascsdripdfsdft",
        //             "dept_short_name": "js"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();


        //         });
        // })


        // it('Should not have error if the get department to location by name from Location input values are valid input(get department to Location by name )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-department-by-location", form: {
        //             "location_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

    })

    describe(`User Module Input Validation ${__filename}`, () => {
        // it('Should not have error if the User values are valid input(Register User)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/user-register", form: {
        //             "name": "basanagouda",
        //             "full_name": "basanagouda",
        //             "email": "basanagouda@gmail.com",
        //             "password": "Basanagouda@123",
        //             "phone": "7829552217",
        //             "emp_code": "GLB-BAN-4148",
        //             "location_id": "1",
        //             "department_id": "1",
        //             "date_join": "11/18/2019",
        //             "address": "dfjfrf",
        //             "role_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the User values are valid input(Register User)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/user-register", form: {
        //             "name": "manager",
        //             "full_name": "manager",
        //             "email": "manager@gmail.com",
        //             "password": "Manager@123",
        //             "phone": "7829552217",
        //             "emp_code": "GLB-BAN-41448",
        //             "location_id": "1",
        //             "department_id": "1",
        //             "date_join": "11/18/2019",
        //             "address": "dfjfrf",
        //             "role_id": "2"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })



        // it('Should not have error if the User search values are valid input(User search)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/users-search", form: {
        //             "name": "basanagouda",
        //             "department_ids": [
        //                 1
        //             ],
        //             "location_id": "1",
        //             "role_id": "1",
        //             "skip": "0",
        //             "limit": "10"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })


        // it('Should not have error if the  fetch User values are valid input(Fetch Users)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/fetch-users", form: {
        //             "location_id": "1",
        //             "department_id": "1",
        //             "role_id": "1",
        //             "skip": "0",
        //             "limit": "10"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the get User values are valid input(get User)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-user", form: {
        //             "user_id": "1",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the Update user status values are valid input(Update user status)', (done) => {
        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/update-user-status", form: {
        //             "user_ids": [
        //                 {
        //                     "user_id": 1
        //                 }
        //             ],
        //             "status": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the Assign User to manager values are valid input(Assign User to manager )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/assign-user-manager", form: {
        //             "user_id": "1",
        //             "manager_id": [
        //                 2

        //             ]
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the Get Assigned Employee to Manager  values are valid input(Get Assigned Employee to Manager )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-assigned-employee-to-manager", form: {
        //             "manager_id": "2",
        //             "location_id": "1",
        //             "department_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             console.log(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the unassign User to manager values are valid input(Unassign User to manager )', (done) => {
        //     request.delete({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/unassign-user-manager", form: {
        //             "manager_id": 2,
        //             "user_id": [
        //                 1

        //             ]
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the User Profile Update values are valid input(User Profile Update )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/user-profile-update", form: {
        //             "userId": "1",
        //             "name": "Basavsadaraj",
        //             "full_name": "Basasdavaraj S",
        //             "email": "basavaqweraj@gmail.com",
        //             "password": "Basavaraj@1234",
        //             "phone": "7829552217",
        //             "emp_code": "GLB-BAN-4zz18",
        //             "location_id": "1",
        //             "department_id": "1",
        //             "address": "dfjfrf",
        //             "role_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null
        //             done();
        //         });
        // })




    })

    describe(`Firewall  ${__filename}`, (done) => {

        //     it('Should not have error if the add category values are valid input(add category)', function (done) {
        //         request.post({
        //             url: url + "/add-category",
        //             headers: { "x-access-token": token, "user-agent": user_agent },
        //             form: {
        //                 "name": "categoryName"
        //             }
        //         }, function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(200);
        //             expect(body.error).to.be.null;
        //             done();
        //         });
        //     });

        // it('Should not have error if the add domain values are valid input(Add Domain)', function (done) {
        //     request.post({
        //         url: url + "/add-domain",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "name": "domainName",
        //             "category_id": "1"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should not have error if the Update Category values are valid input(Update Category)', function (done) {
        //     request.put({
        //         url: url + "/update-category",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "category_id": "1",
        //             "name": "Sports"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should have error While getting days (Get Days)', function (done) {
        //     request.get({
        //         url: url + "/get-days",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should have error While Getting Category (Get Category)', function (done) {
        //     request.get({
        //         url: url + "/get-category",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should have error While Getting Category Domain (Get Category Domains)', function (done) {
        //     request.get({
        //         url: url + "/get-category-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });



        // it('Should not have error if the block user department domain values are valid input(Block User Department Domain)', function (done) {
        //     request.post({
        //         url: url + "/block-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "entity_type": "U",
        //             "entity_ids": [1],
        //             "domain_ids": [1],
        //             "category_ids": [1],
        //             "days_ids": [1
        //             ]
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should not have error if the get blocked user department domain values are valid input(Get Blocked User Department Domain)', function (done) {
        //     request.post({
        //         url: url + "/get-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "skip": "0",
        //             "limit": "10"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });


        // it('Should not have error if the single rule blocked user departmennt domaons values are valid input(Single Rule Blocked User Departmennt Domaons)', function (done) {
        //     request.post({
        //         url: url + "/single-rule-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "blocked_rule_id": "1"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should not have error if the update blocked user departmennt domaons values are valid input(Update Blocked User Departmennt Domaons)', function (done) {
        //     request.put({
        //         url: url + "/update-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "blocked_rule_id": "1",
        //             "entity_type": "U",
        //             "entity_ids": [1],
        //             "domain_ids": [1],
        //             "category_ids": [1],
        //             "days_ids": [1]
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });


    })

    describe(`IP Whitelist  ${__filename}`, (done) => {

        // it('Should not have error if the add ip whitelist values are valid input(Add IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/add-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "admin_email": "abc@gamil.com",
        //             "ip": "44.21.45.145"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should not have error if the get ip whitelist values are valid input(Get IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/get-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "skip": "0",
        //             "limit": "10"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });


        // it('Should not have error if the edit ip whitelist values are valid input(Edit IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/edit-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "ip_id": "1",
        //             "ip": "14.45.87.145"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

        // it('Should not have error if the serach ip values are valid input(Search IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/search-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "ip": "44.21.45.145"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

    })

    describe(`Manager Authentication   ${__filename}`, (done) => {
        // it('Should not have error if the manager auth values are valid input(manager Auth)', function (done) {
        //     request.post({
        //         url: url + "/manager-auth",
        //         headers: { "user-agent": user_agent },
        //         form: { userName: "manager@gmail.com", password: "Manager@123", ip: "14.45.87.145" }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(200);
        //         expect(body.data).to.not.be.null;
        //         expect(body.error).to.be.null;
        //         done();
        //     });
        // });

    })

    describe(`Reports  ${__filename}`, (done) => {
        it('Should not have error if the get download option values are valid input(Get Download Option)', function (done) {
            request.get({
                url: url + "/get-download-option",
                headers: { "x-access-token": token, "user-agent": user_agent },
            }, function (error, response, body) {
                body = JSON.parse(body)
                expect(body.code).to.equal(200);
                expect(body.error).to.be.null;
                done();
            });
        });

        it('Should not have error if the user report values are valid input(User Report)', function (done) {
            request.post({
                url: url + "/user-report",
                headers: { "x-access-token": token, "user-agent": user_agent },
                form: {
                    "user_id": [
                        1,
                        2
                    ],
                    "from_date": "2019-11-19",
                    "to_date": "2020-11-29"
                }
            }, function (error, response, body) {
                body = JSON.parse(body)
                expect(body.code).to.equal(200);
                expect(body.error).to.be.null;
                done();
            });
        });




    })

})


/**Validate Invalid Inputs */
describe(`Validated Invalid Input`, () => {

    describe(`Admin Authentication   ${__filename}`, (done) => {
        // it('Should  have error if the Admin auth values are invalid input(Admin Auth)', function (done) {
        //     request.post({
        //         url: url + "/admin-authentication",
        //         headers: { "user-agent": user_agent },
        //         form: {
        //             "name": "",
        //             "first_name": "",
        //             "last_name": "s",
        //             "email": "",
        //             "username": "",
        //             "address": "",
        //             "phone": ""
        //         }
        //     }, function (error, response, body) {

        //         body = JSON.parse(body)
        //         data = body
        //         expect(body.code).to.equal(404);
        //         expect(body.data).to.be.null;
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

    })

    describe(`Role Input Validation ${__filename}`, () => {
        // it('Should  have error if the Role values are invalid input(adding Role)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/add-role", form: { "name": "", "params": "", },
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })


    })

    describe(`Department Input Validation ${__filename}`, () => {

        // it('Should have error if the department input values are invalid input(Add Department)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: "http://localhost:3002/api/v1/create-departments", form: {
        //             "name": "",
        //             "short_name": "p",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })



        // it('Should have error if the get department input values  are invalid input(get Departments)', (done) => {

        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: "http://localhost:3002/api/v1/get-departments", form: {
        //             "skip": "dsfgsd",
        //             "limit": "10dgsd"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the update department input values are invalid input(update Department)', (done) => {

        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/update-department", form: {
        //             "name": "",
        //             "short_name": "",
        //             "department_id": "fgnhh1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the delete department input values  are invalid input(delete Department)', (done) => {

        //     request.delete({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/delete-department", form: {
        //             "department_id": "sdfd4"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

    })

    describe(`Location Input Validation ${__filename}`, () => {

        // it('Should  have error if the add Location input values  are invalid input(Add Location )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/add-location", form: {
        //             "name": "",
        //             "short_name": "BL",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should  have error if the get Location input values  are invalid input(get Location )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-locations", form: {
        //             "skip": "sdfsd",
        //             "limit": "BL",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the update Location input values are invalid input(update Location )', (done) => {
        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/update-location", form: {
        //             "name": "",
        //             "short_name": "bang",
        //             "location_id": "1dfgsd"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the deleteing  department from Location input values are invalid input(delete department from Location )', (done) => {
        //     request.delete({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/delete-dept-location", form: {
        //             "location_id": "1",
        //             "department_id": "4dfsdfg"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should error if the delete Location input values are invalid input(delete Location )', (done) => {
        //     request.delete({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/delete-location", form: {
        //             "location_id": "4sdfsdfsdf",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should not have error if the add department to location by name from Location input values are invalid input(add department to Location by name )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/add-dept-location-by-name", form: {
        //             "location": "",
        //             "short_name": "myr",
        //             "department_id": "1sfsdf,",
        //             "department_name": "",
        //             "dept_short_name": "js"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();


        //         });
        // })

        // it('Should have error if the get department to location by name from Location input values are valid input(get department to Location by name )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-department-by-location", form: {
        //             "location_id": "aSas1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

    })

    describe(`User Module Input Validation ${__filename}`, () => {
        // it('Should have error if the User values are invalid input(Register User)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/user-register", form: {
        //             "name": "",
        //             "full_name": "basanagouda",
        //             "email": "",
        //             "password": "Basanagouda@123",
        //             "phone": "7829552217",
        //             "emp_code": "GLB-BAN-4146",
        //             "location_id": "1",
        //             "department_id": "1",
        //             "date_join": "11/18/2019",
        //             "address": "dfjfrf",
        //             "role_id": "1"
        //         },
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             // expect(body.error).to.be.null
        //             done();
        //         });
        // })



        // it('Should have error if the User search values are invalid input(User search)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/users-search", form: {
        //             "name": "basavaraj",
        //             "department_ids": [
        //                 1
        //             ],
        //             "location_id": "asasd",
        //             "role_id": "asas2",
        //             "skip": "0sas",
        //             "limit": "1asa0"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })


        // it('Should have error if the  fetch User values are invalid input(Fetch Users)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/fetch-users", form: {
        //             "location_id": "sda1",
        //             "department_id": "sdsad1",
        //             "role_id": "sds2",
        //             "skip": "0",
        //             "limit": "10"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the get User values are invalid input(get User)', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-user", form: {
        //             "user_id": "1sdfsd",
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })


        // it('Should have error if the Update user status values are invalid input(Update user status)', (done) => {
        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/update-user-status", form: {
        //             "user_ids": [
        //                 {
        //                     "user_id": "dfsdf"
        //                 },
        //                 {
        //                     "user_id": "dsdfs"
        //                 }
        //             ],
        //             "status": "sdfs1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the Upgrade and Downgrade to Manager values are valid input(Upgrade and Downgrade to Manager)', (done) => {
        //     request.put({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/upgrade-downgrade-manager", form: {
        //             "user_id": "1sdfsd",
        //             "params": "M"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the Assign User to manager values are invalid input(Assign User to manager )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/assign-user-manager", form: {
        //             "user_id": "18dsdf",
        //             "manager_id": [
        //                 "sddf",
        //                 2,

        //             ]
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the unassign User to manager values are invalid input(Unassign User to manager )', (done) => {
        //     request.delete({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/unassign-user-manager", form: {
        //             "manager_id": "1fsdds",
        //             "user_id": [
        //                 "vdfdf"

        //             ]
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the User Profile Update values are invalid input(User Profile Update )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/user-profile-update", form: {
        //             "userId": "sdfsdf",
        //             "name": "Basavsadaraj",
        //             "full_name": "Basasdavaraj S",
        //             "email": "basavaqweraj@gmail.com",
        //             "password": "Basavaraj@1234",
        //             "phone": "7829552217",
        //             "emp_code": "GLB-BAN-418",
        //             "location_id": "1",
        //             "department_id": "1",
        //             "address": "dfjfrf",
        //             "role_id": "1"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

        // it('Should have error if the Get Assigned Employee to Manager values are invalid input(Get Assigned Employee to Manager )', (done) => {
        //     request.post({
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         url: url + "/get-assigned-employee-to-manager", form: {
        //             "manager_id": "1fgsd",
        //             "location_id": "1dfgdf",
        //             "department_id": "1dfg"
        //         }
        //     },
        //         function (error, response, body) {
        //             body = JSON.parse(body)
        //             expect(body.code).to.equal(404);
        //             expect(body.error).to.not.be.null
        //             done();
        //         });
        // })

    })

    describe(`Firewall  ${__filename}`, (done) => {

        // it('Should have error if the add category values are valid input(add category)', function (done) {
        //     request.post({
        //         url: url + "/add-category",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "name": ""
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });


        // it('Should have error if the add domain values are invalid input(Add Domain)', function (done) {
        //     request.post({
        //         url: url + "/add-domain",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "name": "",
        //             "category_id": "1af"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         console.log(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should have error if the Update Category values are invalid input(Update Category)', function (done) {
        //     request.put({
        //         url: url + "/update-category",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "category_id": "1sd",
        //             "name": "Sports"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });


        // it('Should have error if the delet Category values are invalid input(Delete Category)', function (done) {
        //     request.delete({
        //         url: url + "/delete-category",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "category_id": "1sd",
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });


        // it('Should  have error if the block user department domain values are invalid input(Block User Department Domain)', function (done) {
        //     request.post({
        //         url: url + "/block-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "entity_type": "",
        //             "entity_ids": ["fgsdfg"],
        //             "domain_ids": ["fdgsdfgs"],
        //             "category_ids": ["fsdfg"],
        //             "days_ids": ["fdgsdf"
        //             ]
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });


        // it('Should  have error if the single rule blocked user departmennt domaons values are invalid input(Single Rule Blocked User Departmennt Domaons)', function (done) {
        //     request.post({
        //         url: url + "/single-rule-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "blocked_rule_id": "1sdad"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should have error if the delete blocked user departmennt domaons values are invalid input(Delete Blocked User Departmennt Domaons)', function (done) {
        //     request.delete({
        //         url: url + "/delete-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "blocked_rule_id": [

        //                 "hkjkhjkh"
        //             ]
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should have error if the update blocked user departmennt domaons values are invalid input(Update Blocked User Departmennt Domaons)', function (done) {
        //     request.put({
        //         url: url + "/update-blocked-user-dept-domains",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "blocked_rule_id": "1klhlh",
        //             "entity_type": "U",
        //             "entity_ids": [1],
        //             "domain_ids": [1],
        //             "category_ids": [1],
        //             "days_ids": [1]
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });



    })

    describe(`IP Whitelist  ${__filename}`, (done) => {

        // it('Should have error if the add ip whitelist values are invalid input(Add IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/add-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "admin_email": "",
        //             "ip": ""
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should have error if the delete ip whitelist values are valid input(Delete IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/delete-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "ip_id": "4sdsd"
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.message).to.equal("Validation Failed.");
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should  have error if the edit ip whitelist values are invalid input(Edit IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/edit-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "ip_id": "dfsdf1",
        //             "ip": ""
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

        // it('Should have error if the serach ip values are invalid input(Search IP Whitelist )', function (done) {
        //     request.post({
        //         url: url + "/search-ip-whitelist",
        //         headers: { "x-access-token": token, "user-agent": user_agent },
        //         form: {
        //             "ip": ""
        //         }
        //     }, function (error, response, body) {
        //         body = JSON.parse(body)
        //         expect(body.code).to.equal(404);
        //         expect(body.error).to.not.be.null;
        //         done();
        //     });
        // });

    })

    describe(`Reports  ${__filename}`, (done) => {


        it('Should have error if the user report values are invalid input(User Report)', function (done) {
            request.post({
                url: url + "/user-report",
                headers: { "x-access-token": token, "user-agent": user_agent },
                form: {
                    "user_id": [
                        "Dsdfasdf",
                        2
                    ],
                    "from_date": "201awerawer9-11-19",
                    "to_date": "2020-sdfasf11-29"
                }
            }, function (error, response, body) {
                body = JSON.parse(body)
                expect(body.code).to.equal(404);
                expect(body.error).to.not.be.null;
                done();
            });
        });




    })

});
