// const mongo_url = "mongodb://localhost:27017/StocksSeed";
// const yahooFinance = require('yahoo-finance2').default;
// const mongoose = require('mongoose');
// const { DateTime } = require('luxon');
// const Stock = require('../models/stock');  // Importing Stock schema
// require('dotenv').config();  // Initialize dotenv to use .env variables

// // MongoDB connection
// if (!mongo_url) {
//   console.error('Error: MONGO_CONN environment variable is not set.');
//   process.exit(1);
// }

// mongoose.connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB successfully'))
//   .catch((error) => {
//     console.error('Error connecting to MongoDB:', error);
//     process.exit(1);
//   });

// // Stock tickers for the given groups
// const stockSectors = {
//   technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'TECHM.NS'],
//   insurance: ['ICICIPRULI.NS', 'SBILIFE.NS', 'HDFCLIFE.NS'],
//   banks: ['HDFCBANK.NS', 'AXISBANK.NS', 'ICICIBANK.NS'],
//   publicSectorBanks: ['SBIN.NS', 'PNB.NS', 'BANKBARODA.NS', 'BANKINDIA.NS'],
//   cement: ['ACC.NS', 'AMBUJACEM.NS', 'ULTRACEMCO.NS']
// };

// // Date settings
// const today = DateTime.local().toISODate();
// const lastYear = DateTime.local().minus({ years: 1 }).toISODate();

// // Seeding data into MongoDB
// async function seedStockData() {
//   try {
//     // Clear existing data in Stocks collection
//     await Stock.deleteMany();
//     console.log('Existing stock data cleared.');

//     for (const [sector, symbols] of Object.entries(stockSectors)) {
//       const historicalDataPromises = symbols.map(symbol =>
//         yahooFinance.chart(symbol, {
//           period1: lastYear,
//           period2: today,
//           interval: '1d' // Daily frequency
//         }).catch(error => {
//           console.warn(`No data found for symbol: ${symbol}. It may be delisted.`);
//           return null;
//         })
//       );

//       const allStockData = await Promise.all(historicalDataPromises);

//       // Filter out any null data (symbols that had no data)
//       const validStockData = allStockData.filter(data => data !== null);

//       // Create and save stock data to MongoDB
//       for (const data of validStockData) {
//         const stock = new Stock({
//           symbol: data.meta.symbol,
//           sector: sector, // Save the sector information
//           quotes: data.quotes.map(entry => ({
//             date: entry.date,
//             openPrice: entry.open,
//             highPrice: entry.high,
//             lowPrice: entry.low,
//             closePrice: entry.close,
//             volume: entry.volume
//           }))
//         });

//         await stock.save();
//       }
//     }

//     console.log('Stock data seeded successfully.');
//     process.exit();
//   } catch (error) {
//     console.error('Error seeding stock data:', error);
//     process.exit(1);
//   }
// }

// module.exports = seedStockData;

// // If script is run directly, seed the database
// if (require.main === module) {
//   seedStockData();
// }


const yahooFinance = require('yahoo-finance2').default;
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Stock = require('../models/stock');  // Importing Stock schema
require('dotenv').config();  // Initialize dotenv to use .env variables

// Stock tickers for the given groups
const stockSectors = {
  technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'TECHM.NS'],
  insurance: ['ICICIPRULI.NS', 'SBILIFE.NS', 'HDFCLIFE.NS'],
  banks: ['HDFCBANK.NS', 'AXISBANK.NS', 'ICICIBANK.NS'],
  publicSectorBanks: ['SBIN.NS', 'PNB.NS', 'BANKBARODA.NS', 'BANKINDIA.NS'],
  cement: ['ACC.NS', 'AMBUJACEM.NS', 'ULTRACEMCO.NS']
};

// Date settings
const today = DateTime.local().toISODate();
const lastYear = DateTime.local().minus({ years: 1 }).toISODate();

// Seeding data into MongoDB
async function seedStockData() {
  try {
    console.log('Clearing existing stock data...');
    await Stock.deleteMany();

    for (const [sector, symbols] of Object.entries(stockSectors)) {
      console.log(`Fetching data for sector: ${sector}`);

      const historicalDataPromises = symbols.map(symbol =>
        yahooFinance.chart(symbol, {
          period1: lastYear,
          period2: today,
          interval: '1d' // Daily frequency
        }).catch(error => {
          console.warn(`No data found for symbol: ${symbol}. It may be delisted.`);
          return null;
        })
      );

      const allStockData = await Promise.all(historicalDataPromises);

      // Filter out any null data (symbols that had no data)
      const validStockData = allStockData.filter(data => data !== null);

      // Create and save stock data to MongoDB
      for (const data of validStockData) {
        const stock = new Stock({
          symbol: data.meta.symbol,
          sector: sector, // Save the sector information
          quotes: data.quotes.map(entry => ({
            date: entry.date,
            openPrice: entry.open,
            highPrice: entry.high,
            lowPrice: entry.low,
            closePrice: entry.close,
            volume: entry.volume
          }))
        });

        await stock.save();
        console.log(`Saved data for symbol: ${data.meta.symbol}`);
      }
    }

    console.log('Stock data seeded successfully.');
  } catch (error) {
    console.error('Error during data seeding:', error);
  }
}

module.exports = seedStockData;
