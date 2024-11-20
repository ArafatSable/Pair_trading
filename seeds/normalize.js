// backend/utils/normalizeData.js
const normalizeData = (rawData) => {
    return rawData.map(record => ({
      date: new Date(record['DATE ']), // Convert to Date object
      expiryDate: new Date(record['EXPIRY DATE ']), // Convert to Date object
      openPrice: record['OPEN PRICE '] || 0,
      highPrice: record['HIGH PRICE '] || 0,
      lowPrice: record['LOW PRICE '] || 0,
      closePrice: record['CLOSE PRICE '] || 0,
      lastPrice: record['LAST PRICE '] || 0,
      settlePrice: record['SETTLE PRICE '] || 0,
      volume: record['Volume '] || 0,
      value: record['VALUE '] || 0,
      premiumValue: record['PREMIUM VALUE '] || 0,
      openInterest: record['OPEN INTEREST '] || 0,
      changeInOi: record['CHANGE IN OI '] || 0,
      symbol: record.symbol || 'UNKNOWN', // Default symbol if not provided
    }));
  };
  
  module.exports = normalizeData;
  