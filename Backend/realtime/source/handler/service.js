const WebSocket = require('ws');

const agentValidation = require('../auth/agentValidation');
const adminValidation = require('../auth/adminValidation');

// Initialize objects to store connected agents and image requests
const connectedAgents = {};
const imageRequests = {};
let organizationRealTime = {};
let cameraStreamRequests = {};


const { publishToChannel, subscribeToChannel, getAsync, setAsync, delAsync } = require("../auth/redis");

subscribeToChannel("channel-auth", (message) => {
    message = JSON.parse(message);
    switch (message?.message) {
        case "Agent Auth":
            if (!connectedAgents[message.user_id]) connectedAgents[message.user_id] = "Dummy user";
            break;
        case "Frontend Auth":
            if (!connectedAgents[message.user_id]) connectedAgents[message.user_id] = "Dummy user";
            break;
        default:
            break;
    }
});

subscribeToChannel("channel-image-stream", (message) => {
    message = JSON.parse(message);
    switch (message?.message) {
        case "channel-image-stream":
            const requests = imageRequests[message.user_id] || [];
            requests.forEach(agentId => {
                const agentWs = connectedAgents[agentId];
                if (agentWs != "Dummy user" && agentWs && agentWs.readyState === WebSocket.OPEN) {
                    if(agentWs.isScreenCast && !agentWs.isRealTimeCards && !agentWs.isWebCamStream) agentWs.send(JSON.stringify({...message.parsedMessage, user_id: message.user_id}));
                }
            });
            break;
        default:
            break;
    }
});

subscribeToChannel("channel-camera-stream", (message) => {
    message = JSON.parse(message);
    switch (message?.message) {
        case "channel-camera-stream": // Find the admin who requested the webcam stream and send the message received from agent to connected admin/frontend user
            const requests = cameraStreamRequests[message.user_id] || [];
            requests.forEach(agentId => {
                const agentWs = connectedAgents[agentId];
                if (agentWs != "Dummy user" && agentWs && agentWs.readyState === WebSocket.OPEN) {
                    if(!agentWs.isScreenCast && !agentWs.isRealTimeCards && agentWs.isWebCamStream) agentWs.send(JSON.stringify({...message.parsedMessage, user_id: message.user_id}));
                }
            });
            break;
        case "channel-camera-stream-count": // Find the admin who requested the webcam stream and send the message received from agent to connected admin/frontend user
            const requestsCount = cameraStreamRequests[message.user_id] || [];
            requestsCount.forEach(agentId => {
                const agentWs = connectedAgents[agentId];
                if (agentWs != "Dummy user" && agentWs && agentWs.readyState === WebSocket.OPEN) {
                    if(!agentWs.isScreenCast && !agentWs.isRealTimeCards && agentWs.isWebCamStream) agentWs.send(JSON.stringify({type: message.parsedMessage.type, ...message.parsedMessage, user_id: message.user_id}));
                }
            });
            break;
        default:
            break;
    }
});

subscribeToChannel("channel-update-image-request", (message) => {
    message = JSON.parse(message);
    switch (message?.message) {
        case "channel-update-image-request":
            imageRequests[message.user_id] = [];
            break;
        case "channel-update-image-request2":
            if(imageRequests[message.user_id]) imageRequests[message.user_id].push(message.id);
            else {
                imageRequests[message.user_id] = [];
                imageRequests[message.user_id].push(message.id);
            }
            break;
        case "channel-update-image-request3":
            if (connectedAgents[message.user_id] && connectedAgents[message.user_id] !== "Dummy user") {
                connectedAgents[message.user_id].send('Start sending image - user is waiting')
            }
            break;
        case "handleFEControl":
            const agentWs = connectedAgents[message.user_id];
            if (agentWs !== "Dummy user") {
                agentWs.send(JSON.stringify(message.payload));
            }
            break;
        case "startLatencyTestAgent":
            const agentSocketWS = connectedAgents[message.user_id];
            if (agentSocketWS !== "Dummy user") {
                agentSocketWS.send('Start Latency Test');
            }
            break;
        case "latencyTestRecords":
            const requests = imageRequests[message.user_id] || [];
            requests.forEach(agentId => {
                const feUserWS = connectedAgents[agentId];
                if (feUserWS !== "Dummy user" && feUserWS && feUserWS.readyState === WebSocket.OPEN) {
                    feUserWS.send(JSON.stringify(message.parsedMessage));
                }
            });
            const camReq = cameraStreamRequests[message.user_id] || [];
            camReq.forEach(agentId => {
                const feUserWS = connectedAgents[agentId];
                if (feUserWS !== "Dummy user" && feUserWS && feUserWS.readyState === WebSocket.OPEN) {
                    feUserWS.send(JSON.stringify(message.parsedMessage));
                }
            });
            break;
        case "closeHandler":
            const agentCloseWs = connectedAgents[message.user_id];
            if (agentCloseWs !== "Dummy user" && agentCloseWs && agentCloseWs.readyState === WebSocket.OPEN) {
                agentCloseWs.send("User is disconnected, please stop sending images");
            }
            break;
        case "deleteConnectedAgents":
            delete connectedAgents[message.user_id];
            break;
        case "deleteImageRequest":
            delete imageRequests[message.user_id];
            break;
        case "admin_request_webcam_stream":
            // Handle admin request for webcam stream find connected agent and send message to agent to start webcam stream
            let userId = message.user_id;
            const adminWebcamRequest = connectedAgents[userId];
            if (adminWebcamRequest !== "Dummy user" && adminWebcamRequest && adminWebcamRequest.readyState === WebSocket.OPEN) {
                adminWebcamRequest.send(JSON.stringify({ type: "admin_request_webcam_stream", message: "User is connected for web cam stream" }));
            }
            if(!cameraStreamRequests[userId]) cameraStreamRequests[userId] = [message.frontend_user_id];
            else cameraStreamRequests[userId].push(message.frontend_user_id);
            break;
        case "admin_request_webcam_stream_select":
            let userIdSelect = message.user_id;
            const adminWebcamRequestSelect = connectedAgents[userIdSelect];
            if (adminWebcamRequestSelect !== "Dummy user" && adminWebcamRequestSelect && adminWebcamRequestSelect.readyState === WebSocket.OPEN) {
                adminWebcamRequestSelect.send(JSON.stringify({ type: "admin_request_webcam_stream_selected_screen", message: message.parsedMessage }));
            }
        case "admin_disconnected": 
            // Handle admin disconnection for webcam stream
            Object.keys(cameraStreamRequests).forEach(async (requestedUserId) => {
                cameraStreamRequests[requestedUserId] = cameraStreamRequests[requestedUserId].filter(id => id !== message.user_id);
                if (cameraStreamRequests[requestedUserId].length === 0) {
                    const agentCloseWs = connectedAgents[requestedUserId];
                    if (agentCloseWs !== "Dummy user" && agentCloseWs && agentCloseWs.readyState === WebSocket.OPEN) {
                        agentCloseWs.send("User is disconnected, please stop sending camera stream");
                    }
                }
            });
        default:
            break;
    }
});


subscribeToChannel("channel-update-realtime-activity", (message) => {
    message = JSON.parse(message);
    switch (message?.message) {
        case "agent_auth":
            organizationRealTime[message.organization_id] = organizationRealTime[message.organization_id] || { frontend: [], agents: [] };
            organizationRealTime[message.organization_id].agents.push(message.user_id);
            break;
        case "admin_auth":
            organizationRealTime[message.organization_id] = organizationRealTime[message.organization_id] || { frontend: [], agents: [] };
            organizationRealTime[message.organization_id].frontend.push(message.user_id);
            break;
        case "user_connected_to_dashboard_for_activity":
            for (const agent_id of organizationRealTime[message.organization_id]['agents']) {
                if(connectedAgents[agent_id] != "Dummy user") connectedAgents[agent_id].send("User connected to the dashboard, start sending the activity");
            }
            break;
        case "sending_agent_activity_to_users":
            for (const user_id of organizationRealTime[message.organization_id]['frontend']) {
                if(connectedAgents[user_id] != "Dummy user") 
                if(!connectedAgents[user_id].isScreenCast && !connectedAgents[user_id].isWebCamStream && connectedAgents[user_id].isRealTimeCards) connectedAgents[user_id].send(JSON.stringify(message.parsedMessage));
            }
            break;
        case "no_activity_found_send_current_activity":
            for (const agent_id of organizationRealTime[message.organization_id]['agents']) {
                if(connectedAgents[agent_id] != "Dummy user") connectedAgents[agent_id].send("No activity found, send the current activity");
            }
        case "idle_agent_alert":
                let passparsedMessage = (message.parsedMessage);
                let senderAgentId = message.senderAgentId;
                let date = passparsedMessage?.date;
                let start_date = passparsedMessage.start_time;
                let end_date = passparsedMessage.end_time;
                if(connectedAgents[senderAgentId] && connectedAgents[senderAgentId] != "Dummy user") connectedAgents[senderAgentId].send(JSON.stringify({ type: "idle_agent_alert", seconds : passparsedMessage._doc.total_duration - passparsedMessage._doc.active_seconds, application_id: passparsedMessage._doc._id, date, clock_in: start_date, clock_out: end_date, date }));

        case "disconnect":
            const userList = organizationRealTime[message.organization_id]?.[message.userType];
            if (userList && userList.length !== 0) {
                organizationRealTime[message.organization_id][message.userType] = userList.filter(id => id !== message.user_id);
            }
            break;
    }
});



const handleAgentAuth = async (ws, wss, parsedMessage) => {
    try {
        const agentData = await agentValidation(ws, wss, parsedMessage);
        if (agentData) {
            connectedAgents[agentData.user_id] = ws;
            ws.user_id = agentData.user_id;
            ws.organization_id = agentData.organization_id;

            await publishToChannel("channel-update-realtime-activity", JSON.stringify({ user_id: agentData.user_id, message: "agent_auth", organization_id: agentData.organization_id }));
            await publishToChannel("channel-auth", JSON.stringify({ user_id: agentData.user_id, message: "Agent Auth" }));

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
            await publishToChannel("channel-auth", JSON.stringify({ user_id: adminData.user_id, message: "Frontend Auth" }));
            await publishToChannel("channel-update-realtime-activity", JSON.stringify({ user_id: adminData.user_id, message: "admin_auth", organization_id: adminData.organization_id }));

            const key = `organizationActive:${ws.organization_id}`;
            let value = await getAsync(key);

            // If value is not found or equals 0, set it to 0
            if (!value || value == 0) {
                await setAsync(key, 0);
            }

            return ws.send('User authenticated successfully');
        } else {
            return ws.close();
        }
    } catch (error) {
        console.error('Error during admin authentication:', error);
        return ws.close();
    }
};

const handleReportAuth = async (ws, wss, parsedMessage) => {
    try {
        ws.user_id = "remote_server";
        return ws.send('Connected');
    } catch (error) {
        return ws.close();
    }
};

const handleStartImageStream = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    await publishToChannel("channel-image-stream", JSON.stringify({ user_id: ws.user_id, message: "channel-image-stream", parsedMessage }));
};

const handleImageRequest = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();

    const key = `organizationActive:${ws.organization_id}`;
    const value = await getAsync(key);
    if (value === '1') {
        // return ws.send("You are already connected to a different system.");
    }
    await setAsync(key, 1);
    ws.recevingImage = true;
    ws.isScreenCast = true;
    ws.isRealTimeCards = false;
    ws.isWebCamStream = false;

    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');

    if (!imageRequests[requestedUserId]) {
        imageRequests[requestedUserId] = [];
        await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "channel-update-image-request" }));
    }

    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "channel-update-image-request3", }));


    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "channel-update-image-request2", id: ws.user_id }));
    return ws.send(`Image request received for user ${requestedUserId}`);
};

const onCloseHandler = async (ws) => {
    const user_id = ws.user_id;
    if (user_id && connectedAgents[user_id] === ws) {
        await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: user_id, message: "deleteConnectedAgents", }));
    }

    if (ws.organization_id && ws.recevingImage) {
        const key = `organizationActive:${ws.organization_id}`;
        const value = await delAsync(key);
    }

    // Remove the closed WebSocket from imageRequests
    Object.keys(imageRequests).forEach(async (requestedUserId) => {
        imageRequests[requestedUserId] = imageRequests[requestedUserId].filter(id => id !== user_id);
        if (imageRequests[requestedUserId].length === 0) {
            await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "deleteImageRequest", }));
            await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "closeHandler" }));
        }
    });


    if(ws.isWebCamStream) await publishToChannel("channel-update-image-request", JSON.stringify({ message: "admin_disconnected", user_id }));

    if (typeof user_id === "string" || typeof user_id === "number") {
        const userType = typeof user_id === "string" ? "frontend" : "agents";
        await publishToChannel("channel-update-realtime-activity", JSON.stringify({ message: "disconnect", organization_id: ws.organization_id, user_id, userType }));
    }
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

const handleFeControl = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    let { event, data, requested_user_id, ...rest } = parsedMessage;

    if (!requested_user_id) return ws.send('Invalid requested_user_id');
    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requested_user_id, message: "handleFEControl", payload: { type: 'control', event: event, data: data, rest } }));
};

const handleLatencyTest = (ws, wss, parsedMessage) => {
    ws.send('Latency Test Completed');
};

const handleLatencyTestAgent = (ws, wss, parsedMessage) => {
    ws.send(JSON.stringify(parsedMessage));
};

const handleAgentLatencyTestRequest = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();

    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');

    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "startLatencyTestAgent" }));
};


const handleLatencyTestRecordSend = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: ws.user_id, message: "latencyTestRecords", parsedMessage }));
};

const handleSystemStatusRecordSend = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: ws.user_id, message: "latencyTestRecords", parsedMessage }));
};





/* Below Code is for Real time dashboard activity */

const handleUserConnected = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    if (!ws.organization_id) return ws.close();

    if (organizationRealTime[ws.organization_id]['agents'].length == 0) return ws.send('No agents connected to the system');

    await publishToChannel("channel-update-realtime-activity", JSON.stringify({ message: "user_connected_to_dashboard_for_activity", organization_id: ws.organization_id }));

    ws.isScreenCast = false;
    ws.isRealTimeCards = true;
    ws.isWebCamStream = false;

    ws.send(JSON.stringify({ type: "send_connected_agent_status", data: organizationRealTime[ws.organization_id]['agents'] }));
};


const handleRealTimeAgentConnectedStatus = (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    if (!ws.organization_id) return ws.close();

    if (organizationRealTime[ws.organization_id]['agents'].length == 0) return ws.send('No agents connected to the system');

    ws.send(JSON.stringify({ type: "send_connected_agent_status", data: organizationRealTime[ws.organization_id]['agents'] }));
};

const handleRealTimeUsageHistoryStatus = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    if (!ws.organization_id) return ws.close();

    if (organizationRealTime[ws.organization_id] && organizationRealTime[ws.organization_id]['frontend'].length == 0) return ws.send('No user connected to the system, stop sending requests');

    await publishToChannel("channel-update-realtime-activity", JSON.stringify({ message: "sending_agent_activity_to_users", organization_id: ws.organization_id, parsedMessage: { ...parsedMessage, user_id: ws.user_id } }));
};

const handleRealTimeUsageHistoryStatusNoActivity = async (ws, wss, parsedMessage) => {
    if (organizationRealTime[ws.organization_id] && organizationRealTime[ws.organization_id]['agents'].length == 0) return ws.send('No agents connected to the system');
    await publishToChannel("channel-update-realtime-activity", JSON.stringify({ message: "no_activity_found_send_current_activity", organization_id: ws.organization_id }));
    ws.send(JSON.stringify({ type: "send_connected_agent_status", data: organizationRealTime[ws.organization_id]['agents'] }));
}

const handleCheckAdminConnectedStatus = (ws, wss, parsedMessage) => {
    if (organizationRealTime[ws.organization_id] && organizationRealTime[ws.organization_id]['frontend'].length == 0) return ws.send('No user connected to the system, stop sending requests');
    return ws.send("User connected to the dashboard, start sending the activity");
};

const handleAgentIdleAlert = async (ws, wss, parsedMessage) => {
    if(!ws.user_id) return ws.close();
    if(ws.user_id) await publishToChannel("channel-update-realtime-activity", JSON.stringify({ message: "idle_agent_alert", organization_id: ws.organization_id, senderAgentId: parsedMessage.senderAgentId, parsedMessage }));
};


const handleCloseAgentDataStream = async (ws, wss, parsedMessage) => {
    if(!ws.user_id) return ws.close();
    return await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: parsedMessage.requested_user_id, message: "closeHandler" }));
}

const handleAdminRequestWebcamStream = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');
    // Marking user usage status
    ws.isScreenCast = false;
    ws.isRealTimeCards = false;
    ws.isWebCamStream = true;
    // Pushing message to connected agents
    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "admin_request_webcam_stream", parsedMessage, frontend_user_id: ws.user_id }));
};

const handleAdminRequestWebcamStreamSelect = async(ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    const requestedUserId = parsedMessage.requested_user_id;
    if (!requestedUserId) return ws.send('Invalid requested_user_id');
    await publishToChannel("channel-update-image-request", JSON.stringify({ user_id: requestedUserId, message: "admin_request_webcam_stream_select", parsedMessage, frontend_user_id: ws.user_id }));
}

const handleAgentWebcamStream = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    // Publishing received webcam stream to the channel for connected frontend users
    await publishToChannel("channel-camera-stream", JSON.stringify({ user_id: ws.user_id, message: "channel-camera-stream", parsedMessage }));
}

const handleAgentWebcamStreamCount = async (ws, wss, parsedMessage) => {
    if (!ws.user_id) return ws.close();
    // Publishing received webcam stream to the channel for connected frontend users
    await publishToChannel("channel-camera-stream", JSON.stringify({ user_id: ws.user_id, message: "channel-camera-stream-count", parsedMessage }));
}


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
    handleUserConnected,
    handleRealTimeAgentConnectedStatus,
    handleRealTimeUsageHistoryStatus,
    handleRealTimeUsageHistoryStatusNoActivity,
    handleCheckAdminConnectedStatus,
    handleReportAuth,
    handleAgentIdleAlert,
    handleCloseAgentDataStream,
    handleAdminRequestWebcamStream,
    handleAgentWebcamStream,
    handleAgentWebcamStreamCount,
    handleAdminRequestWebcamStreamSelect
}