const WebSocket = require('ws');
const Service = require('./service');

const onMessageHandler = async (ws, wss, message) => {
    try {
        const parsedMessage = JSON.parse(message.toString().split("\n")[0]);
        if (!parsedMessage.type) return ws.close();

        switch (parsedMessage.type) {
            case 'agent_auth':
                return Service.handleAgentAuth(ws, wss, parsedMessage);
                
            case 'fe_auth':
                return Service.handleFeAuth(ws, wss, parsedMessage);

            case 'report_auth':
                return Service.handleReportAuth(ws, wss, parsedMessage);

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

            case 'system_status_send_record':
                return Service.handleSystemStatusRecordSend(ws, wss, parsedMessage);

            case 'agent_latency_test_request':
                return Service.handleAgentLatencyTestRequest(ws, wss, parsedMessage);



            case 'realtime_status_user_connected': // In realtime dashboard, the admin is connected.
                return Service.handleUserConnected(ws, wss, parsedMessage);

            case 'realtime_connected_agent_status': // After every one minute interval call this 
                return Service.handleRealTimeAgentConnectedStatus(ws, wss, parsedMessage);

            case 'realtime_usage_history_status': // For agent to send data of application usage when switch event is called.
                return Service.handleRealTimeUsageHistoryStatus(ws, wss, parsedMessage);
            
            case 'realtime_usage_history_status_no_activity': // For agent to send data of application usage when dont have data at initialization time
                return Service.handleRealTimeUsageHistoryStatusNoActivity(ws, wss, parsedMessage);

            case 'check_admin_conneted_status': // For agent to check wheather admin is connected or not and need to send data
                return Service.handleCheckAdminConnectedStatus(ws, wss, parsedMessage);

            case 'agent_idle_alert':
                return Service.handleAgentIdleAlert(ws, wss, parsedMessage);

            case 'close_agent_data_stream':
                return Service.handleCloseAgentDataStream(ws, wss, parsedMessage);

            case 'admin_request_webcam_stream': // For Admin to request webcam stream from agent (Frontend to Backend to Agent)
                return Service.handleAdminRequestWebcamStream(ws, wss, parsedMessage);
            
            case 'agent_webcam_stream': // For Agent to send webcam stream to admin (Agent to Backend to Frontend)
                return Service.handleAgentWebcamStream(ws, wss, parsedMessage);

            case 'agent_webcam_stream_counts': 
                return Service.handleAgentWebcamStreamCount(ws, wss, parsedMessage);

            case 'admin_request_webcam_stream_select': 
                return Service.handleAdminRequestWebcamStreamSelect(ws, wss, parsedMessage);

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