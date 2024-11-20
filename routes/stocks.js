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

router.get('/s/sectors', (req, res) => {
    res.status(200).json(sectors);
});

module.exports = router;
