const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
    symbol: { type: String, unique: true, required: true }, // Stock symbol (e.g., TCS.NS)
    data: { type: Array, required: true }, // Array of historical data points (e.g., { date, close })
    lastUpdated: { type: Date, default: Date.now }, // Last update timestamp
});

module.exports = mongoose.model('HistoricalData', historicalDataSchema);
