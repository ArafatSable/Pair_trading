

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http'); // Required for socket.io integration
const { Server } = require('socket.io');
require('dotenv').config();

// Import Routes
const stockRoutes = require('./routes/stocks'); // Your stock routes
const userRoutes = require('./routes/users');   // Your user routes
const realtimeStockRoutes = require('./routes/realtimeStocks'); // New route for real-time stocks

// Initialize Express App
const app = express();
const server = http.createServer(app); // Create HTTP server for socket.io
const io = new Server(server, {
    cors: {
        origin: ['http://127.0.0.1:5500', 'https://pairtrading.netlify.app'], // Allow both origins
        methods: ['GET', 'POST'],
    },
});

// Middleware Configuration
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://pairtrading.netlify.app'], // Allow both origins
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket Connections
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Import Function for Metrics
const { fetchAndStoreMetrics } = require('./controllers/realtimeStocks');

// API Routes Integration
app.use('/api/stocks', stockRoutes);          // Existing stock routes
app.use('/api/users', userRoutes);            // Existing user routes
app.use('/api/realtime-stocks', realtimeStockRoutes); // New real-time stocks routes

// Helper: Start periodic metrics fetch
let intervalId = null;
const startPeriodicMetricsFetch = () => {
    if (intervalId) clearInterval(intervalId); // Clear any existing intervals
    intervalId = setInterval(async () => {
        try {
            await fetchAndStoreMetrics(io); // Fetch and broadcast updates
        } catch (error) {
            console.error('Error during periodic metrics fetch:', error.message);
        }
    }, 60000);
};

// Start Server and Initialize Tasks
const PORT = process.env.PORT || 8081;
mongoose
    .connect(process.env.MONGO_CONN)
    .then(() => {
        console.log('Connected to MongoDB.');

        // Start the server
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            // Run initial metrics fetch and start periodic updates
            fetchAndStoreMetrics(io); // Pass `io` to enable broadcasting to clients
            startPeriodicMetricsFetch(); // Initialize the periodic fetch
        });

        // Schedule Daily Seed Task
        cron.schedule('1 20 * * *', async () => {
            console.log('Running the daily seed task...');
            try {
                clearInterval(intervalId); // Pause periodic updates
                const seedDatabase = require('./seeds/seeds'); // Lazy-load seeding task
                await seedDatabase();
                console.log('End-of-day data seeding completed.');
        
                console.log('Restarting periodic metrics fetch after seeding...');
                startPeriodicMetricsFetch(); // Resume periodic updates
            } catch (error) {
                console.error('Error during end-of-day data seeding:', error.message);
                startPeriodicMetricsFetch(); // Ensure updates resume even after an error
            }
        }, { timezone: 'Asia/Kolkata' });
        
    })
    .catch((error) => console.error('Database connection error:', error.message));
