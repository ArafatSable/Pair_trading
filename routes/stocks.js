const express = require("express");
const {
    getStocks,
    getStock,
    getStocksBySymbol,
    getStockPairStats,
    getStockPairCorrelation,
    getStocksByCorrelationRange,
    getStockPair,
    getStockPairsBySectors,
    getStockPairClosePrices
} = require('../controllers/stocks.js');

const router = express.Router();

// Define sectors statically or fetch from the database
const sectors = [
    'All Sectors', 
    'technology', 
    'insurance', 
    'banks', 
    'publicSectorBanks', 
    'cement'
];

// Routes
router.get('/', getStocks);
router.get('/:id', getStock);
router.get('/symbol/:symbol', getStocksBySymbol);
router.get('/pair/:symbol1/:symbol2', getStockPairStats);
router.get('/pair/:stock1/:stock2/correlation', getStockPairCorrelation);
router.get('/c/correlation-range', getStocksByCorrelationRange);
router.get('/pair/stockpair', getStockPair);
router.get('/p/sectors', getStockPairsBySectors);
router.get('/g/close-prices/:symbol1/:symbol2/:period', getStockPairClosePrices);

// New Z-Score endpoint
router.get('/pair/:symbol1/:symbol2/zscore', async (req, res) => {
    try {
        // Utilize the existing getStockPairStats to fetch Z-Scores
        const { symbol1, symbol2 } = req.params;

        const stockPairStats = await getStockPairStats(req, res);

        if (stockPairStats && stockPairStats.zScores) {
            const zScores = stockPairStats.zScores; // Extract Z-Scores
            return res.status(200).json({
                stock1: symbol1,
                stock2: symbol2,
                zScores: zScores,
            });
        } else {
            return res.status(404).json({ message: "No Z-Scores available for the pair." });
        }
    } catch (error) {
        console.error('Error fetching Z-Scores:', error);
        res.status(500).json({ message: "Error fetching Z-Scores.", error });
    }
});

// Sectors endpoint
router.get('/s/sectors', (req, res) => {
    res.status(200).json(sectors);
});

module.exports = router;
