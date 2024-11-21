const mongoose = require('mongoose');

const stockPairStatsSchema = new mongoose.Schema({
    stock1: { type: String, required: true },
    stock2: { type: String, required: true },
    dates: { type: [Date], required: true }, // Dates for the graph
    zScores: { type: [Object], required: true }, // Array of { date, zScore }
    priceRatios: { type: [Object], required: true }, // Array of { date, priceRatio }
    correlationValues: { type: [Object], required: true }, // Array of { date, correlation }
    lastZScore: { type: Number, required: true },
    lastCorrelation: { type: Number, required: true },
    detailedStats: {
        cashNeutralPercentage: { type: Number, required: true },
        prStdDev: { type: Number, required: true },
        closePR: { type: Number, required: true },
        minPR: { type: Number, required: true },
        maxPR: { type: Number, required: true },
        meanPR: { type: Number, required: true },
        SD1: { type: Number, required: true },
        SD2: { type: Number, required: true },
        SD2_7: { type: Number, required: true },
        SD3: { type: Number, required: true }
    }
});

module.exports = mongoose.model('StockPairStats', stockPairStatsSchema);
