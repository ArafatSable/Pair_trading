const yahooFinance = require('yahoo-finance2').default;
const StockPairMetric = require('../models/stockPairMetric');
const HistoricalData = require('../models/historicalData');

// Define Stock Sectors and Symbols
const stockSectors = {
    technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'TECHM.NS'],
    insurance: ['ICICIPRULI.NS', 'SBILIFE.NS', 'HDFCLIFE.NS'],
    banks: ['HDFCBANK.NS', 'AXISBANK.NS', 'ICICIBANK.NS'],
    publicSectorBanks: ['SBIN.NS', 'PNB.NS', 'BANKBARODA.NS', 'BANKINDIA.NS'],
    cement: ['ACC.NS', 'AMBUJACEM.NS', 'ULTRACEMCO.NS'],
};

// Helper: Delay to prevent rate-limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Suppress Yahoo Finance Notices
yahooFinance.suppressNotices(['yahooSurvey']);

/**
 * Fetch Historical Data for a Stock Symbol
 */
async function fetchHistoricalData(symbol) {
    try {
        const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);

        // Check if cached data is fresh (less than 24 hours old)
        const historical = await HistoricalData.findOne({ symbol });
        if (historical && (Date.now() - historical.lastUpdated) < 24 * 60 * 60 * 1000) {
            console.log(`Using cached historical data for ${symbol}`);
            return historical.data;
        }

        await sleep(1000); // Throttle requests
        const queryOptions = { period1: oneYearAgo, interval: '1d' };
        const data = await yahooFinance.historical(symbol, queryOptions);

        if (!data || data.length === 0) {
            console.error(`No historical data fetched for ${symbol}`);
            return [];
        }

        const processedData = data.map(d => ({ date: d.date, close: d.close }));

        // Update or insert data in MongoDB
        await HistoricalData.findOneAndUpdate(
            { symbol },
            { data: processedData, lastUpdated: new Date() },
            { upsert: true }
        );

        console.log(`Fetched and cached historical data for ${symbol}`);
        return processedData;
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error.message);
        return [];
    }
}

/**
 * Fetch Real-Time Data for a Stock Symbol
 */
async function fetchRealTimeData(symbol) {
    try {
        const quote = await yahooFinance.quote(symbol);
        const price = quote.regularMarketPrice || quote.price?.regularMarketPrice;

        if (price !== undefined) {
            return {
                symbol: quote.symbol,
                regularMarketPrice: price,
                timestamp: new Date(),
            };
        }

        console.error(`No real-time data found for ${symbol}`);
        return null;
    } catch (error) {
        console.error(`Error fetching real-time data for ${symbol}:`, error.message);
        return null;
    }
}

function calculateMetrics(stock1, stock2, historical1, historical2, price1, price2) {
    const prices1 = historical1.map(d => d.close);
    const prices2 = historical2.map(d => d.close);

    // Correlation (CR)
    let correlation = calculateCorrelation(prices1, prices2);

    // Filter: Exclude if correlation is negative or greater than 1
    if (correlation <= 0 || correlation > 1) {
        return null; // Skip this pair
    }

    // Price Spread Difference (PSD)
    const psd = price1 - price2;

    // Long Spread Deviation (LSD)
    const historicalPSD = historical1.map((d, index) => d.close - (historical2[index] ? historical2[index].close : 0));
    const avgPSD = historicalPSD.reduce((sum, d) => sum + d, 0) / historicalPSD.length;
    const stdPSD = Math.sqrt(historicalPSD.reduce((sum, d) => sum + Math.pow(d - avgPSD, 2), 0) / (historicalPSD.length - 1));
    const lsd = (psd - avgPSD) / stdPSD;

    // Price Position Ratio (PPR)
    const ppr = price1 / price2;

    // Long Position Ratio (LPR)
    const lpr = correlation !== 0 ? ppr / correlation : 0;

    // Long Frequency Difference (LFD)
    const lfd = 0;

    // Long Spread Standard Deviation (LFSD)
    const lfsd = stdPSD;

    // Thresholds based on Standard Deviations
    const twoSD = 2 * stdPSD;
    const twoPointSevenSD = 2.7 * stdPSD;
    const threeSD = 3 * stdPSD;

    // Mark-to-Market (MTM)
    const mtm = psd;

    return {
        pair: `${stock1} - ${stock2}`,
        correlation: parseFloat(correlation.toFixed(4)), // Already clamped
        psd: parseFloat(psd.toFixed(4)),
        lsd: parseFloat(lsd.toFixed(4)),
        ppr: parseFloat(ppr.toFixed(4)),
        lpr: parseFloat(lpr.toFixed(4)),
        lfd: parseFloat(lfd.toFixed(4)),
        lfsd: parseFloat(lfsd.toFixed(4)),
        twoSD: parseFloat(twoSD.toFixed(4)),
        twoPointSevenSD: parseFloat(twoPointSevenSD.toFixed(4)),
        threeSD: parseFloat(threeSD.toFixed(4)),
        mtm: parseFloat(mtm.toFixed(4)),
        lastUpdated: new Date(),
    };
}

/**
 * Generate All Unique Stock Pairs Within the Same Sector
 */

function generateStockPairs(stockSectors) {
    const pairs = [];

    for (const sector in stockSectors) {
        const stocks = stockSectors[sector];
        for (let i = 0; i < stocks.length; i++) {
            for (let j = i + 1; j < stocks.length; j++) {
                pairs.push([stocks[i], stocks[j]]);
            }
        }
    }

    return pairs;
}

/**
 * Calculate Pearson Correlation Coefficient
 */
function calculateCorrelation(data1, data2) {
    const n = data1.length;
    if (n !== data2.length || n === 0) return 0;

    const avg1 = data1.reduce((sum, d) => sum + d, 0) / n;
    const avg2 = data2.reduce((sum, d) => sum + d, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
        numerator += (data1[i] - avg1) * (data2[i] - avg2);
        denominator1 += Math.pow(data1[i] - avg1, 2);
        denominator2 += Math.pow(data2[i] - avg2, 2);
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Fetch and Store Metrics for All Stock Pairs
 */
async function fetchAndStoreMetrics(io = null) {
    console.log('Starting metrics update...');
    const stockPairs = generateStockPairs(stockSectors);

    for (const [stock1, stock2] of stockPairs) {
        try {
            console.log(`Processing pair: ${stock1} - ${stock2}`);

            // Fetch historical and real-time data
            const [historical1, historical2] = await Promise.all([
                fetchHistoricalData(stock1),
                fetchHistoricalData(stock2),
            ]);
            const [realTime1, realTime2] = await Promise.all([
                fetchRealTimeData(stock1),
                fetchRealTimeData(stock2),
            ]);

            if (historical1.length && historical2.length && realTime1 && realTime2) {
                // Calculate metrics
                const metrics = calculateMetrics(
                    stock1, stock2,
                    historical1, historical2,
                    realTime1.regularMarketPrice, realTime2.regularMarketPrice
                );

                if (!metrics) continue;

                // Upsert metrics into MongoDB
                const updatedMetric = await StockPairMetric.findOneAndUpdate(
                    { pair: metrics.pair },
                    metrics,
                    { upsert: true, new: true }
                );

                console.log(`Metrics updated for pair: ${metrics.pair}`);

                // Emit real-time updates if io is available
                if (io) {
                    io.emit('metricsUpdate', updatedMetric);
                }
            } else {
                console.warn(`Skipping pair ${stock1} - ${stock2} due to insufficient data.`);
            }
        } catch (error) {
            console.error(`Error processing pair ${stock1} - ${stock2}:`, error.message);
        }
    }

    console.log('Metrics update completed.');
}

module.exports = {
    fetchHistoricalData,
    fetchRealTimeData,
    fetchAndStoreMetrics,
};
