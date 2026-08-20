require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const billingCronService = require('./app/Services/BillingCronService');

const socketService = require('./app/Services/SocketService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Initialize Socket.IO logging and tracking service
socketService.init(io);

// Attach io to req so controllers can broadcast events
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static upload assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register role-based routes grouping under /api
app.use('/api', apiRoutes);

// Initialize Cron Jobs
billingCronService.start();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
