const gcm = require('node-gcm');

let transport;
const mockMessages = [];
const mockState = { shouldFailOnce: false, shouldFail: false };

class Mock {
    static reset() {
        mockMessages.splice(0, mockMessages.length);
    }

    static messages() {
        return mockMessages;
    }

    static lastMessage() {
        return mockMessages.length ? mockMessages[mockMessages.length - 1] : undefined;
    }

    static shouldFailOnce() {
        mockState.shouldFailOnce = true;
    }

    static shouldFail(shouldFail) {
        mockState.shouldFail = shouldFail;
    }
}

if (process.env.NODE_ENV === 'test') {
    class MockTransport {
        send(message, recipients, callback) {
            let shouldFail = false;
            if (mockState.shouldFailOnce) {
                mockState.shouldFailOnce = false;
                shouldFail = true;
            }
            if (mockState.shouldFail) {
                shouldFail = true;
            }
            if (!shouldFail) {
                mockMessages.push({ message, recipients: recipients.registrationTokens });
            }
            shouldFail ?
                callback(401, undefined)
                : callback(undefined, { success: 1 });
        }
    }

    transport = new MockTransport();
} else {
    transport = new gcm.Sender(process.env.FIREBASE_API_KEY);
}

class Firebase {
    static async sendMessage(registrationTokens, message) {
        const messageObj = new gcm.Message({
            timeToLive: 86400,
            notification: {
                title: 'EmpMonitor',
                body: message,
            }
        });
        return new Promise((resolve, reject) => {
            transport.send(messageObj, { registrationTokens }, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    }
}

if (process.env.NODE_ENV === 'test') {
    Firebase.Mock = Mock;
}


module.exports.Firebase = Firebase;
