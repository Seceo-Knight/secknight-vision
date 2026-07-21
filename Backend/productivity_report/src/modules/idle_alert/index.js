const axios = require('axios'); // This is not used in the provided code
const WebSocket = require('ws');
const mysql = require('../../database/MySqlConnection').getInstance();

const  { TaskSchemaModel } = require("../../models/silah_db.schema");
const moment = require('moment-timezone');

const wssUrl = 'wss://realtime.empmonitor.com';
let ws;
let connected = false;
let reconnectInterval = 5000; // 5 seconds
let isReconnecting = false;  // Prevent multiple reconnections

// Function to connect to WebSocket
function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket is already connected or connecting. Skipping reconnection.');
        return;
    }

    isReconnecting = true;
    ws = new WebSocket(wssUrl);

    ws.on('open', () => {
        console.log('Connected to the WSS server');
        ws.send(JSON.stringify({ type: "report_auth" }));
        connected = true;
        isReconnecting = false;  // Reset reconnection flag
    });

    ws.on('message', (data) => {
        connected = true;
        console.log('Received from server:', data.toString());
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    ws.on('close', () => {
        connected = false;
        console.log('Disconnected from the server, attempting to reconnect...');
        if (!isReconnecting) {
            isReconnecting = true;
            setTimeout(connectWebSocket, reconnectInterval);
        }
    });
}

// Initial connection
connectWebSocket();

// Event listener for idle-alert-agent
const event = new (require('events').EventEmitter)();

event.on('idle-alert-agent', async ({ data, start_time, end_time, date }) => {
    try {
        console.log("User is idle ------" + data.employee_id);
        if (!connected) return;

        // Query to get user and employee IDs
        const [result] = await mysql.query(`
            SELECT u.id as user_id, e.id as employee_id 
            FROM employees e 
            JOIN users u ON u.id = e.user_id
            WHERE e.id = ${data.employee_id}
        `);

        if (!result) return;

        const socketData = {
            ...data,
            type: "agent_idle_alert",
            senderAgentId: result.user_id,
            start_time, end_time, date
        };

        ws.send(JSON.stringify(socketData));
    } catch (err) {
        console.log('-------error occurred in idle request------', err.message);
    }
});

event.on('project-task-auto-stop-idle-time', async ({ organization_id, employee_id, start_time }) => {
    try {
        let taskDate;
        let finalTask = await TaskSchemaModel.findOne({ organization_id, assigned_user: employee_id, status: 1  });
        if(!finalTask) return;
        for(const task of finalTask.task_working_status) {
            if(task.start_time && !task.end_time) {
                taskDate = moment(task.start_time).format('YYYY-MM-DD');
                break;
            }
        }
        if(taskDate == moment(start_time).format('YYYY-MM-DD')) {
            finalTask.status = 2;
            for(const task of finalTask.task_working_status) {
                if(task.start_time && !task.end_time) {
                    task.end_time = moment().utc().toISOString();
                    let totalWorkingTime = moment(task.end_time).diff(moment(task.start_time), 'seconds');
                    finalTask.total_working_time += totalWorkingTime;
                    break;
                }
            }
            await finalTask.save();
        }
    } catch (err) {
        console.log('-------error occurred------', err.message);
    }
});

module.exports = event;
