const mongoose = require('mongoose');

const stockPairMetricSchema = new mongoose.Schema({
    pair: { type: String, unique: true }, // Unique identifier for the stock pair
    correlation: { type: Number, required: true }, // CR
    psd: { type: Number, required: true }, // Price Spread Difference
    lsd: { type: Number, required: true }, // Long Spread Deviation
    ppr: { type: Number, required: true }, // Price Position Ratio
    lpr: { type: Number, required: true }, // Long Position Ratio
    lfd: { type: Number, required: true }, // Long Frequency Difference
    lfsd: { type: Number, required: true }, // Long Spread Standard Deviation
    twoSD: { type: Number, required: true }, // Threshold for 2 SD
    twoPointSevenSD: { type: Number, required: true }, // Threshold for 2.7 SD
    threeSD: { type: Number, required: true }, // Threshold for 3 SD
    mtm: { type: Number, required: true }, // Mark-to-Market
    lastUpdated: { type: Date, default: Date.now }, // Last update timestamp
});

module.exports = mongoose.model('StockPairMetric', stockPairMetricSchema);
