const express = require('express');
const router = express.Router();
const {
    fetchHistoricalData,
    fetchRealTimeData,
    fetchAndStoreMetrics,
} = require('../controllers/realtimeStocks');
const StockPairMetric = require('../models/stockPairMetric');

// Helper for Standardized Error Response
const handleError = (res, error, message = 'An error occurred', status = 500) => {
    console.error(message, error.message || error);
    return res.status(status).json({ message, error: error.message || error });
};

// @route   GET /api/realtime-stocks/historical/:symbol
// @desc    Fetch and return historical stock data
// @access  Public
router.get('/historical/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        const data = await fetchHistoricalData(symbol);
        if (!data || data.length === 0) {
            return res.status(404).json({ message: `No historical data found for symbol: ${symbol}` });
        }
        res.json(data);
    } catch (error) {
        handleError(res, error, `Failed to fetch historical data for ${symbol}`);
    }
});

// @route   GET /api/realtime-stocks/realtime/:symbol
// @desc    Fetch and return real-time stock data
// @access  Public
router.get('/realtime/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        const data = await fetchRealTimeData(symbol);
        if (!data) {
            return res.status(404).json({ message: `No real-time data found for symbol: ${symbol}` });
        }
        res.json(data);
    } catch (error) {
        handleError(res, error, `Failed to fetch real-time data for ${symbol}`);
    }
});

// @route   POST /api/realtime-stocks/update-metrics
// @desc    Update stock pair metrics
// @access  Public
router.post('/update-metrics', async (req, res) => {
    try {
        console.log('Updating stock pair metrics...');
        await fetchAndStoreMetrics();
        res.json({ message: 'Stock pair metrics updated successfully.' });
    } catch (error) {
        handleError(res, error, 'Failed to update stock pair metrics');
    }
});

// @route   GET /api/stock-pairs-metrics
// @desc    Fetch stock pair metrics with optional filtering by correlation range
// @access  Public
router.get('/stock-pairs-metrics', async (req, res) => {
    try {
        // Extract query parameters for correlation range
        const { minCorrelation = 0, maxCorrelation = 1 } = req.query;

        // Parse query parameters and validate
        const min = parseFloat(minCorrelation);
        const max = parseFloat(maxCorrelation);

        if (isNaN(min) || isNaN(max) || min < 0 || max > 1 || min > max) {
            return res.status(400).json({
                error: 'Invalid correlation range. Values must be between 0 and 1, and min must not exceed max.',
            });
        }

        // Fetch metrics filtered by the specified correlation range
        const metrics = await StockPairMetric.find({
            correlation: { $gte: min, $lte: max },
        });

        res.json(metrics);
    } catch (error) {
        handleError(res, error, 'Failed to fetch metrics');
    }
});

// Optional: Add a health check route for debugging
// @route   GET /api/realtime-stocks/health
// @desc    Check if the service is running
// @access  Public
router.get('/health', (req, res) => {
    res.json({ status: 'Service is running', timestamp: new Date() });
});

module.exports = router;
