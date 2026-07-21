const request = require('./request');

const defaultUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)' +
    ' Chrome/51.0.2704.103 Safari/537.36';

class Auth {
    async loginAsEmployee(requestToLogin) {
        const response = await request
            .post('/api/v3/auth/user')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('User-Agent', defaultUserAgent)
            .send({email: "employee@example.com", password: "password@123", ip: "123.123.123.128"});
        const token = response.body.data;
        requestToLogin.set('authorization', `bearer ${token}`);
        return requestToLogin;
    }

    async loginAsAdmin(requestToLogin) {
        const response = await request
            .post('/api/v3/auth/admin')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('User-Agent', defaultUserAgent)
            .send({
                name: 'admin',
                first_name: 'Bob',
                last_name: 'Admin',
                email: 'admin@example.com',
                username: 'admin',
                address: 'Bangalore',
                phone: '+784726272',
                product_id: 6,
                begin_date: '2020-05-20',
                expire_date: '2037-12-12',
                timezone: 'Asia/Kolkata',
            });
        const token = response.body.data;
        requestToLogin.set('authorization', `bearer ${token}`);
        return requestToLogin;
    }
}

module.exports = new Auth;