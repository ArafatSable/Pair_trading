const mongoose = require('mongoose');

// Define Mongoose schema and model
const stockSchema = new mongoose.Schema({
  symbol: String,
  sector: String, // Added sector field
  quotes: [
    {
      date: Date,
      openPrice: Number,
      highPrice: Number,
      lowPrice: Number,
      closePrice: Number,
      volume: Number
    }
  ]
});

module.exports = mongoose.model('Stock', stockSchema);