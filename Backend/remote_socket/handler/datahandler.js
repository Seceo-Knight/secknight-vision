const WebSocket = require('ws');
const Service = require('./service');

const onMessageHandler = async (ws, wss, message) => {
    try {
        const parsedMessage = JSON.parse(message.toString());
        if (!parsedMessage.type) return ws.close();

        switch (parsedMessage.type) {
            case 'agent_auth':
                return Service.handleAgentAuth(ws, wss, parsedMessage);
                
            case 'fe_auth':
                return Service.handleFeAuth(ws, wss, parsedMessage);

            case 'start_image_stream':
                return Service.handleStartImageStream(ws, wss, parsedMessage);

            case 'image_request':
                return Service.handleImageRequest(ws, wss, parsedMessage);

            case 'check_agent_status': 
                return Service.checkAgentOnlineStatus(ws, wss, parsedMessage);

            case 'fe_control':
                return Service.handleFeControl(ws, wss, parsedMessage);

            case 'latency_test':
                return Service.handleLatencyTest(ws, wss, parsedMessage);

            case 'latency_test_agent':
                return Service.handleLatencyTestAgent(ws, wss, parsedMessage);

            case 'latency_test_send_record':
                return Service.handleLatencyTestRecordSend(ws, wss, parsedMessage);

            case 'agent_latency_test_request':
                return Service.handleAgentLatencyTestRequest(ws, wss, parsedMessage);

            default:
                return ws.send('Unknown message type');
        }
    } catch (error) {
        console.error('Error handling message:', error);
        return ws.close();
    }
};

module.exports = {
    onMessageHandler,
    onCloseHandler: Service.onCloseHandler
};