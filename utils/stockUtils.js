// utils/stockUtils.js

/**
 * Generates all unique stock pairs within the same sector.
 * @param {Object} stockSectors - An object where keys are sectors and values are arrays of stock symbols.
 * @returns {Array} - An array of stock pair objects.
 */
function generateStockPairs(stockSectors) {
    const pairs = [];

    for (const sector in stockSectors) {
        const stocks = stockSectors[sector];
        for (let i = 0; i < stocks.length; i++) {
            for (let j = i + 1; j < stocks.length; j++) {
                pairs.push({
                    stock1: stocks[i],
                    stock2: stocks[j],
                    sector: sector
                });
            }
        }
    }

    return pairs;
}

/**
 * Calculates the Pearson correlation coefficient between two arrays.
 * @param {Array} arr1 - First array of numbers.
 * @param {Array} arr2 - Second array of numbers.
 * @returns {Number} - Correlation coefficient.
 */
function calculateCorrelation(arr1, arr2) {
    const n = arr1.length;
    if (n !== arr2.length || n === 0) return 0;

    const mean1 = calculateMean(arr1);
    const mean2 = calculateMean(arr2);

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = arr1[i] - mean1;
        const diff2 = arr2[i] - mean2;
        numerator += diff1 * diff2;
        denominator1 += diff1 ** 2;
        denominator2 += diff2 ** 2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculates the mean of an array.
 * @param {Array} data - Array of numbers.
 * @returns {Number} - Mean value.
 */
function calculateMean(data) {
    return data.reduce((acc, val) => acc + val, 0) / data.length;
}

/**
 * Calculates the standard deviation of an array.
 * @param {Array} data - Array of numbers.
 * @param {Number} mean - Mean of the array.
 * @returns {Number} - Standard deviation.
 */
function calculateStandardDeviation(data, mean) {
    const variance = data.reduce((acc, val) => acc + (val - mean) ** 2, 0) / data.length;
    return Math.sqrt(variance);
}

/**
 * Calculates the Z-Score for a given value.
 * @param {Number} value - The value to calculate the Z-Score for.
 * @param {Number} mean - Mean of the dataset.
 * @param {Number} stdDev - Standard deviation of the dataset.
 * @returns {Number} - Z-Score.
 */
function calculateZScore(value, mean, stdDev) {
    return stdDev !== 0 ? (value - mean) / stdDev : 0;
}

/**
 * Calculates Long Frequency Difference (LFD).
 * @param {Array} stock1Prices - Array of stock1 prices.
 * @param {Array} stock2Prices - Array of stock2 prices.
 * @returns {Number} - Calculated LFD.
 */
function calculateLFD(stock1Prices, stock2Prices) {
    // Implement your actual logic for LFD
    const priceDifference = stock1Prices.map((price, index) => price - stock2Prices[index]);
    return calculateMean(priceDifference);
}

/**
 * Calculates Last Falling Spread Deviation (LFSD).
 * @param {Array} stock1Prices - Array of stock1 prices.
 * @param {Array} stock2Prices - Array of stock2 prices.
 * @returns {Number} - Calculated LFSD.
 */
function calculateLFSD(stock1Prices, stock2Prices) {
    // Implement your actual logic for LFSD
    const priceDifference = stock1Prices.map((price, index) => price - stock2Prices[index]);
    const meanSpread = calculateMean(priceDifference);
    return calculateStandardDeviation(priceDifference, meanSpread);
}

module.exports = {
    generateStockPairs,
    calculateCorrelation,
    calculateMean,
    calculateStandardDeviation,
    calculateZScore,
    calculateLFD,
    calculateLFSD
};
