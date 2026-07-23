require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const morgan = require('morgan');

const { onMessageHandler, onCloseHandler } = require('./source/handler/datahandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running!' });
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ip = ip.replace(",35.201.73.5", "")
    // console.log(`User connected: ${ip}`);
    
    ws.on('message', (message) => onMessageHandler(ws, wss, message));
    ws.on('close', () => onCloseHandler(ws));
});

server.listen(process.env.PORT || 5001, () => {
    console.log(`Server listening on port ${process.env.PORT || 5001}`);
});
