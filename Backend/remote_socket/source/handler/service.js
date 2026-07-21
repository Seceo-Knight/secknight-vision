const WebSocket = require('ws');

const agentValidation = require('../auth/agentValidation');
const adminValidation = require('../auth/adminValidation');
const configFile = require("../../../config/config");

// Initialize objects to store connected agents and image requests
const connectedAgents = {};
const imageRequests = {};
let organizationActive = {};


const handleAgentAuth = async (ws, wss, parsedMessage) => {
    try {
        const agentData = await agentValidation(ws, wss, parsedMessage);
        if (agentData) {
            connectedAgents[agentData.user_id] = ws;
            ws.user_id = agentData.user_id;

            const allowedUsers = configFile.SCREEN_CAST_FOR_SPECIFIC_USERS[ws.organization_id];
            if (allowedUsers && !allowedUsers.includes(agentData.user_id)) {
                return ws.close();
            }

            console.log(`Agent connected successfully: ${ws.user_id}`);
            return ws.send('Agent authenticated successfully');
        } else {
            return ws.close();
        }
    } catch (error) {
        console.error('Error during agent authentication:', error);
        return ws.close();
    }
};

const handleFeAuth = async (ws, wss, parsedMessage) => {
    try {
        let adminData = await adminValidation(ws, wss, parsedMessage);
        if (adminData) {
            adminData.user_id = `${adminData.user_id}${Date.now()}`
            connectedAgents[adminData.user_id] = ws;
            ws.user_id = adminData.user_id;
            ws.organization_id = adminData.organization_id;
            if (!organizationActive[ws.organization_id] || organizationActive[ws.organization_id] == 0) organizationActive[ws.organization_id] = 0;
            console.log(`Admin connected successfully: ${adminData.user_id}`);
            return ws.send('User authenticated successfully');
        } else {
            return ws.close();
        }
    } catch (error) {
        console.error('Error during admin authentication:', error);
        return ws.close();
    }
};

const handleStartImageStream = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    const requests = imageRequests[ws.user_id] || [];
    requests.forEach(agentId => {
        const agentWs = connectedAgents[agentId];
        if (agentWs && agentWs.readyState === WebSocket.OPEN) {
            agentWs.send(JSON.stringify(parsedMessage));
        }
    });

    // return ws.send(`Started receiving image stream for user ${ws.user_id}`);
};

const handleImageRequest = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();

    if (!configFile.DISABLE_BLOCKING_MULTIPLE_ACCESS_SCREENCAST.includes(ws.organization_id)) {
        if (organizationActive[ws.organization_id] === 1) return ws.send("You are already connected to a different system.");
        else organizationActive[ws.organization_id] = 1;
    }


    ws.recevingImage = true;

    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');

    if (!imageRequests[requestedUserId]) {
        imageRequests[requestedUserId] = [];
    }

    const agentWs = connectedAgents[requestedUserId];
    if (agentWs) {
        agentWs.send('Start sending image - user is waiting');
    }

    imageRequests[requestedUserId].push(ws.user_id);
    return ws.send(`Image request received for user ${requestedUserId}`);
};

const onCloseHandler = (ws) => {
    const user_id = ws.user_id;
    if (user_id && connectedAgents[user_id] === ws) {
        delete connectedAgents[user_id];
    }

    if (ws.organization_id && ws.recevingImage) {
        delete organizationActive[ws.organization_id];
    }

    // Remove the closed WebSocket from imageRequests
    Object.keys(imageRequests).forEach(requestedUserId => {
        imageRequests[requestedUserId] = imageRequests[requestedUserId].filter(id => id !== user_id);
        if (imageRequests[requestedUserId].length === 0) {
            delete imageRequests[requestedUserId];
            const agentWs = connectedAgents[requestedUserId];
            if (agentWs && agentWs.readyState === WebSocket.OPEN) {
                agentWs.send("User is disconnected, please stop sending images");
            }
        }
    });
};


const checkAgentOnlineStatus = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();

    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');

    const agentWs = connectedAgents[requestedUserId];
    if (agentWs) {
        ws.send('Agent is online -- Agent Status');
    } else {
        ws.send('Agent is offline -- Agent Status');
    }
}

const handleFeControl = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    let { event, data, requested_user_id, ...rest } = parsedMessage;

    if (!requested_user_id) return ws.send('Invalid requested_user_id');
    const agentWs = connectedAgents[requested_user_id];
    if (agentWs) {
        agentWs.send(JSON.stringify({ type: 'control', event: event, data: data, rest }));
    }
};

const handleLatencyTest = (ws, wss, parsedMessage) => {
    ws.send('Latency Test Completed');
};

const handleLatencyTestAgent = (ws, wss, parsedMessage) => {
    ws.send(JSON.stringify(parsedMessage));
};

const handleAgentLatencyTestRequest = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();

    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');

    const agentWs = connectedAgents[requestedUserId];
    if (agentWs) {
        agentWs.send('Start Latency Test');
    }
};


const handleLatencyTestRecordSend = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    const requests = imageRequests[ws.user_id] || [];
    requests.forEach(agentId => {
        const feUserWS = connectedAgents[agentId];
        if (feUserWS && feUserWS.readyState === WebSocket.OPEN) {
            feUserWS.send(JSON.stringify(parsedMessage));
        }
    });
};

const handleSystemStatusRecordSend = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    const requests = imageRequests[ws.user_id] || [];
    requests.forEach(agentId => {
        const feUserWS = connectedAgents[agentId];
        if (feUserWS && feUserWS.readyState === WebSocket.OPEN) {
            feUserWS.send(JSON.stringify(parsedMessage));
        }
    });
};


const handleCheckAdminConnectedStatus = (ws, wss, parsedMessage) => {
    return ws.send('No user connected to the system, stop sending requests');
};


module.exports = {
    handleAgentAuth,
    handleFeAuth,
    handleStartImageStream,
    handleImageRequest,
    onCloseHandler,
    checkAgentOnlineStatus,
    handleFeControl,
    handleLatencyTest,
    handleAgentLatencyTestRequest,
    handleLatencyTestRecordSend,
    handleLatencyTestAgent,
    handleSystemStatusRecordSend,
    handleCheckAdminConnectedStatus
}