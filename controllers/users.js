// const express =require('express');
// const mongoose =require('mongoose');
// const bcrypt =require('bcryptjs');
// const jwt =require('jsonwebtoken');
// const dotenv =require("dotenv");
// const User =require('../models/user.js');

// dotenv.config();
// const jwtSecret = process.env.JWT_SECRET;
// const router = express.Router();

// // remove first transaction after a certain amount to keep logs clean
// async function clearFirstLog(res, userId) {
//   try {
//     const countLogs = await ActionLog.find({ userId: userId }).countDocuments();
//     if (countLogs > 20) {
//       await ActionLog.findOneAndDelete({ userId: userId }, { sort: { loggedAt: 1 } });
//     }
//   } catch (error) {
//     res.status(400).json({ message: "Failure to cleanup logs!" });
//   }
// }

// module.exports.registerUser = async (req, res) => {
//   try {
//     const { email, password, firstName, lastName } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists." });
//     }

//     const salt = await bcrypt.genSalt(12);
//     const passwordHashed = await bcrypt.hash(password, salt);
//     const createdUser = await User.create({ email: email, password: passwordHashed, name: `${firstName} ${lastName}`, coins: 100000 });
//     const token = jwt.sign({ email: createdUser.email, id: createdUser._id }, jwtSecret, { expiresIn: "15m" });

//     const registerLog = new ActionLog({
//       userId: createdUser._id,
//       logAction: "REGISTER"
//     });
//     await registerLog.save();
//     clearFirstLog(res, createdUser._id);

//     const userResponse = {
//       name: createdUser.name,
//       email: createdUser.email,
//       coins: createdUser.coins,
//     }

//     res.status(201).json({ result: userResponse, token: token });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while registering the user." });
//   }
// };

// module.exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const existingUser = await User.findOne({ email });

//     if (!existingUser) {
//       return res.status(404).json({ message: "User doesn't exist." });
//     }

//     const passwordCorrect = await bcrypt.compare(password, existingUser.password);

//     if (!passwordCorrect) {
//       return res.status(400).json({ message: "Invalid login credentials." });
//     }

//     const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, jwtSecret, { expiresIn: "15m" });

//     const loginLog = new ActionLog({
//       userId: existingUser._id,
//       logAction: "LOGIN"
//     });
//     await loginLog.save();
//     clearFirstLog(res, existingUser._id);

//     const userResponse = {
//       name: existingUser.name,
//       email: existingUser.email,
//       coins: existingUser.coins,
//     }

//     res.status(200).json({ result: userResponse, token: token });
//   } catch (err) {
//     res.status(500).json({ message: "An error occurred while registering the user." });
//   }
// };

// module.exports.getUserInfo = async (req, res) => {
//   try {
//     const userData = await User.findById(req.userId);

//     const userResponse = {
//       name: userData.name,
//       email: userData.email,
//       coins: userData.coins,
//     }

//     res.status(200).json(userResponse);
//   } catch (error) {
//     res.status(404).json({ message: "An error has occurred fetching the user requested." });
//   }
// };

// module.exports.updateUserName = async (req, res) => {
//   try {
//     const { firstName, lastName } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     await User.findByIdAndUpdate(req.userId, { name: `${firstName} ${lastName}` });
//     const updatedUser = await User.findById(req.userId);


//     const userResponse = {
//       name: updatedUser.name,
//       email: updatedUser.email,
//       coins: updatedUser.coins,
//     }

//     res.status(200).json(userResponse);
//   } catch (error) {
//     res.status(404).json({ message: "An error has occurred updating your username." });
//   }
// };

// module.exports.updateUserPassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword, newPasswordConfirmed } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     if (newPassword !== newPasswordConfirmed) {
//       return res.status(400).json({ message: "Passwords do not match!." });
//     }

//     const userData = await User.findById(req.userId);
//     const passwordCorrect = await bcrypt.compare(currentPassword, userData.password);

//     if (!passwordCorrect) {
//       return res.status(400).json({ message: "Invalid old password!" });
//     }

//     const salt = await bcrypt.genSalt(12);
//     const passwordHashed = await bcrypt.hash(newPassword, salt);

//     await User.findByIdAndUpdate(req.userId, { password: passwordHashed });
//     res.status(200).json({ message: "Password successfully updated!" });
//   } catch (error) {
//     res.status(404).json({ message: "An error has occurred updating your username." });
//   }
// };

// module.exports.removeUser = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     await ActionLog.deleteMany({ userId: req.userId });
//     await Transaction.deleteMany({ userId: req.userId });
//     await PurchasedStock.deleteMany({ userId: req.userId });
//     await User.findByIdAndDelete(req.userId);

//     res.status(200).json({ message: "User successfully deleted!" });
//   } catch (error) {
//     res.status(404).json({ message: "An error has occurred removing the user." });
//   }
// }

// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const dotenv = require("dotenv");
// const User = require('../models/user.js');

// dotenv.config();
// const jwtSecret = process.env.JWT_SECRET;
// const router = express.Router();

// // Register user
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, firstName, lastName } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists." });
//     }

//     const salt = await bcrypt.genSalt(12);
//     const passwordHashed = await bcrypt.hash(password, salt);
//     const createdUser = await User.create({ email, password: passwordHashed, name: `${firstName} ${lastName}`, coins: 100000 });
//     const token = jwt.sign({ email: createdUser.email, id: createdUser._id }, jwtSecret, { expiresIn: "1h" });

//     const userResponse = {
//       name: createdUser.name,
//       email: createdUser.email,
//       coins: createdUser.coins,
//     };

//     res.status(201).json({ result: userResponse, token: token });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while registering the user." });
//   }
// });

// // Login user
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const existingUser = await User.findOne({ email });

//     if (!existingUser) {
//       return res.status(404).json({ message: "User doesn't exist." });
//     }

//     const passwordCorrect = await bcrypt.compare(password, existingUser.password);

//     if (!passwordCorrect) {
//       return res.status(400).json({ message: "Invalid login credentials." });
//     }

//     const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, jwtSecret, { expiresIn: "1h" });

//     const userResponse = {
//       name: existingUser.name,
//       email: existingUser.email,
//       coins: existingUser.coins,
//     };

//     res.status(200).json({ result: userResponse, token: token });
//   } catch (err) {
//     res.status(500).json({ message: "An error occurred while logging in the user." });
//   }
// });

// // Get user information
// router.get('/userinfo', async (req, res) => {
//   try {
//     const userData = await User.findById(req.userId);

//     const userResponse = {
//       name: userData.name,
//       email: userData.email,
//       coins: userData.coins,
//     };

//     res.status(200).json(userResponse);
//   } catch (error) {
//     res.status(404).json({ message: "An error occurred fetching the user information." });
//   }
// });

// // Update user name
// router.patch('/username', async (req, res) => {
//   try {
//     const { firstName, lastName } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     await User.findByIdAndUpdate(req.userId, { name: `${firstName} ${lastName}` });
//     const updatedUser = await User.findById(req.userId);

//     const userResponse = {
//       name: updatedUser.name,
//       email: updatedUser.email,
//       coins: updatedUser.coins,
//     };

//     res.status(200).json(userResponse);
//   } catch (error) {
//     res.status(404).json({ message: "An error occurred updating your username." });
//   }
// });

// // Update user password
// router.patch('/password', async (req, res) => {
//   try {
//     const { currentPassword, newPassword, newPasswordConfirmed } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     if (newPassword !== newPasswordConfirmed) {
//       return res.status(400).json({ message: "Passwords do not match!." });
//     }

//     const userData = await User.findById(req.userId);
//     const passwordCorrect = await bcrypt.compare(currentPassword, userData.password);

//     if (!passwordCorrect) {
//       return res.status(400).json({ message: "Invalid old password!" });
//     }

//     const salt = await bcrypt.genSalt(12);
//     const passwordHashed = await bcrypt.hash(newPassword, salt);

//     await User.findByIdAndUpdate(req.userId, { password: passwordHashed });
//     res.status(200).json({ message: "Password successfully updated!" });
//   } catch (error) {
//     res.status(404).json({ message: "An error occurred updating your password." });
//   }
// });

// // Remove user
// router.delete('/removeuser', async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.userId)) {
//       return res.status(404).send(`No user with id: ${req.userId}`);
//     }

//     if (req.userId === process.env.GUEST_ID) {
//       return res.status(400).send({ message: "Not allowed to modify guest account!" });
//     }

//     await User.findByIdAndDelete(req.userId);

//     res.status(200).json({ message: "User successfully deleted!" });
//   } catch (error) {
//     res.status(404).json({ message: "An error occurred removing the user." });
//   }
// });

// // Export the router with the defined routes
// module.exports = router;

