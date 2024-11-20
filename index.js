// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const yahooFinance = require('yahoo-finance2').default;
// const seedDatabase = require('./seeds/seeds.js');
// require('dotenv').config();

// // Import Routes
// const stockRoutes = require('./routes/stocks.js'); // Your stock routes
// const userRoutes = require('./routes/users.js');   // Your user routes

// // Initialize Express App
// const app = express();

// // Middleware Configuration
// app.use(cors({
//     origin: ['http://127.0.0.1:5500', 'http://localhost:3000'], // Allow both origins
//     methods: ['GET', 'POST'],
//     credentials: true,
// }));

// app.use(bodyParser.json());
// app.use(express.json({ extended: true }));
// app.use(express.urlencoded({ extended: true }));

// // Define Stock Sectors and Symbols
// const stockSectors = {
//   technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'TECHM.NS'],
//   insurance: ['ICICIPRULI.NS', 'SBILIFE.NS', 'HDFCLIFE.NS'],
//   banks: ['HDFCBANK.NS', 'AXISBANK.NS', 'ICICIBANK.NS'],
//   publicSectorBanks: ['SBIN.NS', 'PNB.NS', 'BANKBARODA.NS', 'BANKINDIA.NS'],
//   cement: ['ACC.NS', 'AMBUJACEM.NS', 'ULTRACEMCO.NS']
// };

// // Define Stock Pair Metric Schema and Model
// const stockPairMetricSchema = new mongoose.Schema({
//     pair: { type: String, unique: true },
//     correlation: Number,        // CR
//     psd: Number,                // PSD
//     lsd: Number,                // LSD
//     ppr: Number,                // PPR
//     lpr: Number,                // LPR
//     lfd: Number,                // LFD
//     lfsd: Number,               // LFSD
//     twoSD: Number,              // 2 SD
//     twoPointSevenSD: Number,    // 2.7 SD
//     threeSD: Number,            // 3 SD
//     mtm: Number,                // MTM
//     lastUpdated: { type: Date, default: Date.now }
// });

// const StockPairMetric = mongoose.model('StockPairMetric', stockPairMetricSchema);

// // Define Historical Data Schema and Model
// const historicalDataSchema = new mongoose.Schema({
//     symbol: { type: String, unique: true },
//     data: Array,
//     lastUpdated: { type: Date, default: Date.now }
// });

// const HistoricalData = mongoose.model('HistoricalData', historicalDataSchema);

// // Helper Function to Introduce Delays (Throttling Requests)
// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // Suppress Yahoo Finance Notices
// yahooFinance.suppressNotices(['yahooSurvey']);

// // Function to Fetch Historical Data and Cache in MongoDB
// async function fetchHistoricalData(symbol) {
//     try {
//         const oneYearAgo = Math.floor((new Date().getTime() - 365 * 24 * 60 * 60 * 1000) / 1000);

//         // Check if data exists in MongoDB and is less than a day old
//         let historical = await HistoricalData.findOne({ symbol });
//         if (historical && (new Date() - historical.lastUpdated) < 24 * 60 * 60 * 1000) {
//             console.log(`Using cached historical data for ${symbol}.`);
//             return historical.data; // Return cached data
//         }

//         await sleep(1000); // 1-second delay to prevent rate-limiting
//         const queryOptions = { period1: oneYearAgo, interval: '1d' };
//         const data = await yahooFinance.historical(symbol, queryOptions);

//         if (!data || data.length === 0) {
//             console.error(`No historical data fetched for ${symbol}.`);
//             return [];
//         }

//         const processedData = data.map(d => ({ date: d.date, close: d.close }));

//         // Update MongoDB with new data
//         await HistoricalData.findOneAndUpdate(
//             { symbol },
//             { data: processedData, lastUpdated: new Date() },
//             { upsert: true }
//         );

//         console.log(`Fetched and cached historical data for ${symbol}.`);
//         return processedData;
//     } catch (error) {
//         console.error(`Error fetching historical data for ${symbol}:`, error.message);
//         return [];
//     }
// }

// // Function to Fetch Real-Time Data
// async function fetchRealTimeData(symbol) {
//     try {
//         // Fetch quote without specifying modules to get all available data
//         const quote = await yahooFinance.quote(symbol);

//         // Attempt to extract regularMarketPrice from different possible paths
//         let regularMarketPrice = null;
//         if (quote.price && quote.price.regularMarketPrice !== undefined) {
//             regularMarketPrice = quote.price.regularMarketPrice;
//         } else if (quote.regularMarketPrice !== undefined) {
//             regularMarketPrice = quote.regularMarketPrice;
//         }

//         if (regularMarketPrice !== null) {
//             return {
//                 symbol: quote.symbol,
//                 regularMarketPrice: regularMarketPrice,
//                 timestamp: new Date(),
//             };
//         } else {
//             console.error(`No real-time data found for ${symbol}.`, quote);
//             return null;
//         }
//     } catch (error) {
//         console.error(`Error fetching real-time data for ${symbol}:`, error.message);
//         return null;
//     }
// }

// // Function to Generate All Unique Stock Pairs Within the Same Sector
// function generateStockPairs(stockSectors) {
//     const pairs = [];

//     for (const sector in stockSectors) {
//         const stocks = stockSectors[sector];
//         for (let i = 0; i < stocks.length; i++) {
//             for (let j = i + 1; j < stocks.length; j++) {
//                 pairs.push([stocks[i], stocks[j]]);
//             }
//         }
//     }

//     return pairs;
// }

// // Function to Calculate Pearson Correlation Coefficient
// function calculateCorrelation(data1, data2) {
//     const n = data1.length;
//     if (n !== data2.length || n === 0) return 0;

//     const avg1 = data1.reduce((sum, d) => sum + d, 0) / n;
//     const avg2 = data2.reduce((sum, d) => sum + d, 0) / n;

//     let numerator = 0;
//     let denominator1 = 0;
//     let denominator2 = 0;

//     for (let i = 0; i < n; i++) {
//         numerator += (data1[i] - avg1) * (data2[i] - avg2);
//         denominator1 += Math.pow(data1[i] - avg1, 2);
//         denominator2 += Math.pow(data2[i] - avg2, 2);
//     }

//     const denominator = Math.sqrt(denominator1 * denominator2);
//     let correlation = denominator === 0 ? 0 : numerator / denominator;

//     // Clamp correlation to range [0, 1]
//     correlation = Math.max(0, Math.min(1, correlation));

//     return correlation;
// }


// function calculateMetrics(stock1, stock2, historical1, historical2, price1, price2) {
//     const prices1 = historical1.map(d => d.close);
//     const prices2 = historical2.map(d => d.close);

//     // Correlation (CR)
//     let correlation = calculateCorrelation(prices1, prices2);

//     // Filter: Exclude if correlation is negative or greater than 1
//     if (correlation <= 0 || correlation > 1) {
//         return null; // Skip this pair
//     }

//     // Price Spread Difference (PSD)
//     const psd = price1 - price2;

//     // Long Spread Deviation (LSD)
//     const historicalPSD = historical1.map((d, index) => d.close - (historical2[index] ? historical2[index].close : 0));
//     const avgPSD = historicalPSD.reduce((sum, d) => sum + d, 0) / historicalPSD.length;
//     const stdPSD = Math.sqrt(historicalPSD.reduce((sum, d) => sum + Math.pow(d - avgPSD, 2), 0) / (historicalPSD.length - 1));
//     const lsd = (psd - avgPSD) / stdPSD;

//     // Price Position Ratio (PPR)
//     const ppr = price1 / price2;

//     // Long Position Ratio (LPR)
//     const lpr = correlation !== 0 ? ppr / correlation : 0;

//     // Long Frequency Difference (LFD)
//     const lfd = 0;

//     // Long Spread Standard Deviation (LFSD)
//     const lfsd = stdPSD;

//     // Thresholds based on Standard Deviations
//     const twoSD = 2 * stdPSD;
//     const twoPointSevenSD = 2.7 * stdPSD;
//     const threeSD = 3 * stdPSD;

//     // Mark-to-Market (MTM)
//     const mtm = psd;

//     return {
//         pair: `${stock1} - ${stock2}`,
//         correlation: parseFloat(correlation.toFixed(4)), // Already clamped
//         psd: parseFloat(psd.toFixed(4)),
//         lsd: parseFloat(lsd.toFixed(4)),
//         ppr: parseFloat(ppr.toFixed(4)),
//         lpr: parseFloat(lpr.toFixed(4)),
//         lfd: parseFloat(lfd.toFixed(4)),
//         lfsd: parseFloat(lfsd.toFixed(4)),
//         twoSD: parseFloat(twoSD.toFixed(4)),
//         twoPointSevenSD: parseFloat(twoPointSevenSD.toFixed(4)),
//         threeSD: parseFloat(threeSD.toFixed(4)),
//         mtm: parseFloat(mtm.toFixed(4)),
//         lastUpdated: new Date()
//     };
// }


// async function fetchAndStoreMetrics() {
//     console.log('Starting metrics update...');
//     const stockPairs = generateStockPairs(stockSectors);
//     console.log(`Total stock pairs to process: ${stockPairs.length}`);

//     for (const [stock1, stock2] of stockPairs) {
//         try {
//             console.log(`Processing pair: ${stock1} - ${stock2}`);

//             // Fetch historical data concurrently
//             const [historical1, historical2] = await Promise.all([
//                 fetchHistoricalData(stock1),
//                 fetchHistoricalData(stock2),
//             ]);

//             // Fetch real-time data concurrently
//             const [realTime1, realTime2] = await Promise.all([
//                 fetchRealTimeData(stock1),
//                 fetchRealTimeData(stock2),
//             ]);

//             // Check if all necessary data is available
//             if (historical1.length && historical2.length && realTime1 && realTime2) {
//                 const metrics = calculateMetrics(
//                     stock1,
//                     stock2,
//                     historical1,
//                     historical2,
//                     realTime1.regularMarketPrice,
//                     realTime2.regularMarketPrice
//                 );

//                 // Skip pairs with invalid metrics
//                 if (!metrics || metrics.correlation <= 0 || metrics.correlation >= 1) {
//                     console.warn(`Skipping pair: ${stock1} - ${stock2} due to invalid correlation.`);
//                     continue;
//                 }

//                 // Upsert metrics into MongoDB
//                 await StockPairMetric.findOneAndUpdate(
//                     { pair: metrics.pair },
//                     metrics,
//                     { upsert: true, new: true }
//                 );

//                 console.log(`Metrics updated for pair: ${metrics.pair} at ${metrics.lastUpdated}`);
//             } else {
//                 console.warn(`Insufficient data for pair: ${stock1} - ${stock2}. Skipping.`);
//             }
//         } catch (error) {
//             console.error(`Error processing pair ${stock1} - ${stock2}:`, error.message);
//             // Continue processing other pairs despite errors
//         }
//     }

//     console.log('Metrics update completed.');
// }


// // API Routes Integration
// app.use('/api/stocks', stockRoutes); // Existing stock routes
// app.use('/api/users', userRoutes);   // Existing user routes

// // API Route to Get Metrics with Correlation Filtering
// app.get('/api/stock-pairs-metrics', async (req, res) => {
//     try {
//         // Extract query parameters for correlation range
//         const { minCorrelation = 0, maxCorrelation = 1 } = req.query;

//         // Parse query parameters and validate
//         const min = parseFloat(minCorrelation);
//         const max = parseFloat(maxCorrelation);

//         if (isNaN(min) || isNaN(max) || min < 0 || max > 1 || min > max) {
//             return res.status(400).json({ error: 'Invalid correlation range. Values must be between 0 and 1, and min must not exceed max.' });
//         }

//         // Fetch metrics filtered by the specified correlation range
//         const metrics = await StockPairMetric.find({
//             correlation: { $gte: min, $lte: max }
//         });

//         res.json(metrics);
//     } catch (error) {
//         console.error('Error fetching metrics from MongoDB:', error.message);
//         res.status(500).json({ error: 'Failed to fetch metrics' });
//     }
// });

// // Start Server and Initialize Tasks
// const PORT = process.env.PORT || 8081;
// mongoose
//     .connect(process.env.MONGO_CONN)
//     .then(() => {
//         console.log('Connected to MongoDB.');
//         app.listen(PORT, () => {
//             console.log(`Server running on port ${PORT}`);
//             fetchAndStoreMetrics(); // Initial fetch and store
//             setInterval(fetchAndStoreMetrics, 60000); // Update every minute
//         });

//         cron.schedule(
//             '1 20 * * *', // Every day at 8:01 PM
//             async () => {
//                 console.log('Running the daily seed task at 8:01 PM...');
//                 try {
//                     await seedDatabase();
//                     console.log('End-of-day data seeding completed.');
//                 } catch (error) {
//                     console.error('Error during end-of-day data seeding:', error.message);
//                 }
//             },
//             {
//                 timezone: 'Asia/Kolkata', // Adjust timezone
//             }
//         );
//     })
//     .catch((error) => console.log(`An error has occurred: ${error}`));



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
        origin: ['http://127.0.0.1:5500', 'http://localhost:3000'], // Allow both origins
        methods: ['GET', 'POST'],
    },
});

// Middleware Configuration
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000'], // Allow both origins
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
        cron.schedule('56 22 * * *', async () => {
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
