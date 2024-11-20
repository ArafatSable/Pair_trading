
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    match: [/^[a-zA-Z\s]*$/]
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
  },
  password: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    required: true,
    min: 0
  }
});


module.exports = mongoose.model('User', userSchema);
