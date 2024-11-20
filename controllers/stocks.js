const Stock = require('../models/stock');

// Function to get all stocks
const getStocks = async (req, res) => {
    try {
        const stocks = await Stock.find(); // Fetch all stocks
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving stocks" });
    }
};

// Function to get a single stock by ID
const getStock = async (req, res) => {
    const { id } = req.params;
    try {
        const stock = await Stock.findById(id); // Fetch stock by ID
        if (!stock) return res.status(404).json({ message: "Stock not found" });
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving the stock" });
    }
};

// Function to get stocks by symbol
const getStocksBySymbol = async (req, res) => {
    const { symbol } = req.params;
    try {
        const stocks = await Stock.find({ symbol: symbol.toUpperCase() });
        if (!stocks.length) {
            return res.status(404).json({ message: `No stocks found for symbol: ${symbol}` });
        }
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving stocks for symbol: ${symbol}` });
    }
};

// Helper function to generate all stock pairs
const generateStockPairs = (stocks) => {
    const pairs = [];
    for (let i = 0; i < stocks.length; i++) {
        for (let j = i + 1; j < stocks.length; j++) {
            pairs.push({
                stock1: stocks[i].symbol,
                stock2: stocks[j].symbol
            });
        }
    }
    return pairs;
};

// Function to get stocks by correlation and sector
const getStocksByCorrelationRange = async (req, res) => {
    const { min, max, sector } = req.query;

    if (min < 0 || max > 1 || min > max) {
        return res.status(400).json({ message: 'Invalid correlation range. Must be between 0 and 1.' });
    }

    try {
        const stocks = await Stock.find(sector ? { sector } : {}); // Fetch all stocks or filtered by sector

        if (!stocks || stocks.length === 0) {
            return res.status(404).json({ message: 'No stocks found in the database.' });
        }

        const stockPairs = [];

        // Loop through each pair of stocks and calculate correlation
        for (let i = 0; i < stocks.length; i++) {
            for (let j = i + 1; j < stocks.length; j++) {
                if (stocks[i].sector !== stocks[j].sector) {
                    continue; // Only consider pairs within the same sector
                }

                const stock1Prices = stocks[i].quotes.map(item => item.closePrice);
                const stock2Prices = stocks[j].quotes.map(item => item.closePrice);

                const length = Math.min(stock1Prices.length, stock2Prices.length);
                const stock1Trimmed = stock1Prices.slice(0, length);
                const stock2Trimmed = stock2Prices.slice(0, length);

                const corr = correlation(stock1Trimmed, stock2Trimmed);

                if (corr >= min && corr <= max) {
                    stockPairs.push({
                        stock1: stocks[i].symbol,
                        stock2: stocks[j].symbol,
                        correlation: corr
                    });
                }
            }
        }

        if (stockPairs.length === 0) {
            return res.status(404).json({ message: 'No stock pairs found within the specified correlation range.' });
        }

        res.status(200).json(stockPairs);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the stock.' });
    }
};


// Function to get all stock pairs with calculations
const getStockPair = async (req, res) => {
    try {
        const stocks = await Stock.find().select('symbol quotes sector'); // Fetch symbol, quotes, and sector field for calculations

        if (!stocks || stocks.length === 0) {
            return res.status(404).json({ message: 'No stocks found in the database.' });
        }

        if (stocks.length < 2) {
            return res.status(400).json({ message: 'Not enough stocks to create pairs.' });
        }

        const stockPairs = [];

        for (let i = 0; i < stocks.length; i++) {
            for (let j = i + 1; j < stocks.length; j++) {
                const stock1 = stocks[i];
                const stock2 = stocks[j];

                // Ensure that quotes are available and not empty, and stocks are in the same sector
                if (!stock1.quotes || !stock2.quotes || stock1.quotes.length === 0 || stock2.quotes.length === 0 || stock1.sector !== stock2.sector) {
                    continue; // Skip pairs that don't have sufficient data or are not in the same sector
                }

                const stock1Prices = stock1.quotes.map(item => item.closePrice);
                const stock2Prices = stock2.quotes.map(item => item.closePrice);

                const length = Math.min(stock1Prices.length, stock2Prices.length);
                const stock1Trimmed = stock1Prices.slice(0, length);
                const stock2Trimmed = stock2Prices.slice(0, length);

                const correlationValue = correlation(stock1Trimmed, stock2Trimmed);

                // Calculate required metrics
                const priceRatios = stock1Trimmed.map((price1, index) => price1 / stock2Trimmed[index]);
                const priceSpreads = stock1Trimmed.map((price1, index) => price1 - stock2Trimmed[index]);

                const meanRatio = calculateMean(priceRatios);
                const stdDevRatio = calculateStandardDeviation(priceRatios, meanRatio);

                const meanSpread = calculateMean(priceSpreads);
                const stdDevSpread = calculateStandardDeviation(priceSpreads, meanSpread);

                const PSD = calculateStandardDeviation(stock1Trimmed, calculateMean(stock1Trimmed));
                const lastStandardDeviation = stdDevRatio;
                const priceToPriceRatio = stock1Trimmed[stock1Trimmed.length - 1] / stock2Trimmed[stock2Trimmed.length - 1];
                const lastPriceRatio = priceToPriceRatio;
                const MTM = (stock1Trimmed[stock1Trimmed.length - 1] - stock1Trimmed[stock1Trimmed.length - 2]) * 1000;
                
                const LFD = calculateLFD(stock1Trimmed, stock2Trimmed);
                const LFSD = calculateLFSD(stock1Trimmed, stock2Trimmed);
                const SD2 = stdDevRatio * 2;
                const SD2_7 = stdDevRatio * 2.7;
                const SD3 = stdDevRatio * 3;

                // Push stock pair with all calculations
                stockPairs.push({
                    stock1: stock1.symbol,
                    stock2: stock2.symbol,
                    correlation: correlationValue,
                    PSD: PSD,
                    LSD: lastStandardDeviation,
                    PPR: priceToPriceRatio,
                    LPR: lastPriceRatio,
                    LFD: LFD,
                    LFSD: LFSD,
                    SD2: SD2,
                    SD2_7: SD2_7,
                    SD3: SD3,
                    MTM: MTM
                });
            }
        }

        if (stockPairs.length === 0) {
            return res.status(404).json({ message: 'No valid stock pairs found.' });
        }

        res.status(200).json(stockPairs);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving stock pairs', error: error.message });
    }
};

// Helper function to calculate Last Falling Distance (LFD)
const calculateLFD = (stock1Trimmed, stock2Trimmed) => {
    // Logic for LFD calculation
    const priceDifference = stock1Trimmed.map((price, index) => price - stock2Trimmed[index]);
    return calculateMean(priceDifference); // Example logic, modify based on requirement
};

// Helper function to calculate Last Falling Spread Deviation (LFSD)
const calculateLFSD = (stock1Trimmed, stock2Trimmed) => {
    // Logic for LFSD calculation
    const priceDifference = stock1Trimmed.map((price, index) => price - stock2Trimmed[index]);
    const meanSpread = calculateMean(priceDifference);
    return calculateStandardDeviation(priceDifference, meanSpread); // Example logic, modify based on requirement
};




// Helper functions for calculations
const calculateMean = (data) => data.reduce((acc, value) => acc + value, 0) / data.length;

const calculateStandardDeviation = (data, mean) => {
    const variance = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
};

const calculateZScore = (value, mean, stdDev) => (stdDev !== 0) ? (value - mean) / stdDev : 0;

const correlation = (arr1, arr2) => {
    const mean1 = calculateMean(arr1);
    const mean2 = calculateMean(arr2);
    const covariance = arr1.reduce((sum, val, i) => sum + ((val - mean1) * (arr2[i] - mean2)), 0) / (arr1.length - 1);
    const stdDev1 = calculateStandardDeviation(arr1, mean1);
    const stdDev2 = calculateStandardDeviation(arr2, mean2);
    return (stdDev1 * stdDev2 !== 0) ? covariance / (stdDev1 * stdDev2) : 0;
};


// Function to get stock pairs by sectors
const getStockPairsBySectors = async (req, res) => {
    try {
        const stocks = await Stock.find().select('symbol sector quotes'); // Fetch symbols, sectors, and quotes

        if (!stocks || stocks.length === 0) {
            return res.status(404).json({ message: 'No stocks found in the database.' });
        }

        const sectorGroups = {};
        const stockPairsBySector = [];

        // Group stocks by sector
        for (let stock of stocks) {
            if (!sectorGroups[stock.sector]) {
                sectorGroups[stock.sector] = [];
            }
            sectorGroups[stock.sector].push(stock);
        }

        // Generate stock pairs within each sector
        for (let sector in sectorGroups) {
            const sectorStocks = sectorGroups[sector];
            for (let i = 0; i < sectorStocks.length; i++) {
                for (let j = i + 1; j < sectorStocks.length; j++) {
                    const stock1 = sectorStocks[i];
                    const stock2 = sectorStocks[j];

                    // Ensure there are quotes available for both stocks
                    if (stock1.quotes.length === 0 || stock2.quotes.length === 0) {
                        continue;
                    }

                    // Extract closing prices for both stocks
                    const stock1Prices = stock1.quotes.map(quote => quote.closePrice);
                    const stock2Prices = stock2.quotes.map(quote => quote.closePrice);

                    const length = Math.min(stock1Prices.length, stock2Prices.length);
                    const stock1Trimmed = stock1Prices.slice(0, length);
                    const stock2Trimmed = stock2Prices.slice(0, length);

                    // Calculate metrics: correlation, mean, standard deviation, etc.
                    const correlationValue = correlation(stock1Trimmed, stock2Trimmed);
                    const priceRatios = stock1Trimmed.map((price1, index) => price1 / stock2Trimmed[index]);
                    const meanRatio = calculateMean(priceRatios);
                    const stdDevRatio = calculateStandardDeviation(priceRatios, meanRatio);

                    // Push the stock pair along with the calculated data
                    stockPairsBySector.push({
                        sector,
                        stock1: stock1.symbol,
                        stock2: stock2.symbol,
                        correlation: correlationValue,
                        meanRatio: meanRatio,
                        stdDevRatio: stdDevRatio,
                    });
                }
            }
        }

        if (stockPairsBySector.length === 0) {
            return res.status(404).json({ message: 'No valid stock pairs found.' });
        }

        res.status(200).json(stockPairsBySector);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving stock pairs by sectors', error: error.message });
    }
};

// Function to get correlation between two stocks
const getStockPairCorrelation = async (req, res) => {
    const { stock1, stock2 } = req.params;

    try {
        const [stock1Data, stock2Data] = await Promise.all([
            Stock.findOne({ symbol: stock1 }).select('quotes sector'),
            Stock.findOne({ symbol: stock2 }).select('quotes sector')
        ]);

        if (!stock1Data || !stock2Data || stock1Data.sector !== stock2Data.sector) {
            return res.status(404).json({ message: "One or both stocks not found or stocks are not in the same sector" });
        }

        const stock1ClosingPrices = stock1Data.quotes.map(item => item.closePrice);
        const stock2ClosingPrices = stock2Data.quotes.map(item => item.closePrice);

        if (stock1ClosingPrices.length < 2 || stock2ClosingPrices.length < 2) {
            return res.status(400).json({ message: "Not enough data points to calculate correlation." });
        }

        const correlationFactor = correlation(stock1ClosingPrices, stock2ClosingPrices);

        res.status(200).json({
            stock1,
            stock2,
            correlation: correlationFactor
        });

    } catch (error) {
        res.status(500).json({ message: "Error calculating stock correlation" });
    }
};

// Function to get close prices for a pair of stocks
const getStockPairClosePrices = async (req, res) => {
    const { symbol1, symbol2, period } = req.params;

    try {
        const [stock1Data, stock2Data] = await Promise.all([
            Stock.findOne({ symbol: symbol1 }).select('quotes sector'),
            Stock.findOne({ symbol: symbol2 }).select('quotes sector')
        ]);

        if (!stock1Data || !stock2Data || stock1Data.sector !== stock2Data.sector) {
            return res.status(404).json({ message: "One or both stocks not found or stocks are not in the same sector" });
        }

        // Get the current date and calculate the start date based on the requested period
        const endDate = new Date();
        let startDate;

        switch (period) {
            case '1week':
                startDate = new Date();
                startDate.setDate(endDate.getDate() - 7); // Go back 7 days
                break;
            case '5weeks':
                startDate = new Date();
                startDate.setDate(endDate.getDate() - 35); // Go back 35 days
                break;
            case '6months':
                startDate = new Date();
                startDate.setMonth(endDate.getMonth() - 6); // Go back 6 months
                break;
            case '1year':
                startDate = new Date();
                startDate.setFullYear(endDate.getFullYear() - 1); // Go back 1 year
                break;
            default:
                return res.status(400).json({ message: "Invalid period specified" });
        }

        // Filter stock quotes based on the date range
        const stock1ClosingPrices = stock1Data.quotes
            .filter(item => new Date(item.date) >= startDate && new Date(item.date) <= endDate)
            .map(item => ({ date: item.date, closePrice: item.closePrice }));

        const stock2ClosingPrices = stock2Data.quotes
            .filter(item => new Date(item.date) >= startDate && new Date(item.date) <= endDate)
            .map(item => ({ date: item.date, closePrice: item.closePrice }));

        res.status(200).json({
            stock1: { symbol: stock1Data.symbol, closePrices: stock1ClosingPrices },
            stock2: { symbol: stock2Data.symbol, closePrices: stock2ClosingPrices }
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching close prices for the stock pair", error });
    }
};
const getStockPairStats = async (req, res) => {
    const { symbol1, symbol2 } = req.params;

    try {
        // Fetch stock data for both stocks in parallel
        const [stock1Data, stock2Data] = await Promise.all([
            Stock.findOne({ symbol: symbol1 }).select('quotes sector'),
            Stock.findOne({ symbol: symbol2 }).select('quotes sector')
        ]);

        // Validate data and ensure both stocks belong to the same sector
        if (!stock1Data || !stock2Data || stock1Data.sector !== stock2Data.sector) {
            return res.status(404).json({ message: "Data not found for one or both stocks or stocks are not in the same sector" });
        }

        // Extract stock prices and dates from the quotes data
        const stock1Quotes = stock1Data.quotes.map(item => ({ date: item.date, closePrice: item.closePrice }));
        const stock2Quotes = stock2Data.quotes.map(item => ({ date: item.date, closePrice: item.closePrice }));

        // Ensure that both stocks have quotes data
        if (stock1Quotes.length === 0 || stock2Quotes.length === 0) {
            return res.status(400).json({ message: "Not enough data points to calculate statistics." });
        }

        // Use the minimum length of data available for both stocks
        const length = Math.min(stock1Quotes.length, stock2Quotes.length);
        const stock1Prices = stock1Quotes.slice(0, length).map(item => item.closePrice);
        const stock2Prices = stock2Quotes.slice(0, length).map(item => item.closePrice);
        const dates = stock1Quotes.slice(0, length).map(item => item.date);

        // Calculate rolling price ratios
        const priceRatios = stock1Prices.map((price1, i) => ({
            date: dates[i],
            priceRatio: price1 / stock2Prices[i]
        }));

        // Calculate rolling Z-Scores for price ratios
        const meanPR = calculateMean(priceRatios.map(pr => pr.priceRatio));
        const prStdDev = calculateStandardDeviation(priceRatios.map(pr => pr.priceRatio), meanPR);
        const zScores = priceRatios.map(({ priceRatio, date }) => ({
            date,
            zScore: calculateZScore(priceRatio, meanPR, prStdDev)
        }));

        // Calculate rolling correlation at each point in time
        const correlationValues = stock1Prices.map((_, i) => {
            const corr = correlation(stock1Prices.slice(0, i + 1), stock2Prices.slice(0, i + 1));
            return { date: dates[i], correlation: corr };
        });

        // Get the last Z-Score and last Correlation
        const lastZScore = zScores[zScores.length - 1] ? zScores[zScores.length - 1].zScore : "N/A";
        const lastCorrelation = correlationValues[correlationValues.length - 1] ? correlationValues[correlationValues.length - 1].correlation : "N/A";

        // Additional metrics for price ratios
        const cashNeutralPercentage = (stock2Prices[stock2Prices.length - 1] / stock1Prices[stock1Prices.length - 1]) * 100;
        const closePR = priceRatios[priceRatios.length - 1].priceRatio;
        const minPR = Math.min(...priceRatios.map(pr => pr.priceRatio));
        const maxPR = Math.max(...priceRatios.map(pr => pr.priceRatio));
        const SD1 = meanPR + prStdDev;
        const SD2 = meanPR + (2 * prStdDev);
        const SD2_7 = meanPR + (2.7 * prStdDev);
        const SD3 = meanPR + (3 * prStdDev);

        // Return the full statistics along with data for the graphs
        res.status(200).json({
            stock1: symbol1,
            stock2: symbol2,
            dates: dates,  // Dates for the graph
            zScores: zScores,  // Z-Scores for the graph
            priceRatios: priceRatios,  // Rolling price ratios
            correlationValues: correlationValues,  // Time-series correlation for the graph
            lastZScore: lastZScore,  // Last Z-Score
            lastCorrelation: lastCorrelation,  // Last Correlation
            detailedStats: {
                cashNeutralPercentage: cashNeutralPercentage.toFixed(2),
                prStdDev: prStdDev.toFixed(4),
                closePR: closePR.toFixed(4),
                minPR: minPR.toFixed(4),
                maxPR: maxPR.toFixed(4),
                meanPR: meanPR.toFixed(4),
                SD1: SD1.toFixed(4),
                SD2: SD2.toFixed(4),
                SD2_7: SD2_7.toFixed(4),
                SD3: SD3.toFixed(4)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error calculating pair stats", error });
    }
};

module.exports = {
    getStocks,
    getStock,
    getStockPairStats,
    getStockPairCorrelation,
    getStocksByCorrelationRange,
    getStocksBySymbol,
    getStockPairsBySectors,
    getStockPair,
    getStockPairClosePrices
};
