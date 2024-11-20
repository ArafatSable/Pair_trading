// const express = require("express");
// const router = express.Router();

// const auth = require("../middlewares/auth.js");
// const { registerUser, loginUser, getUserInfo, updateUserName, updateUserPassword, removeUser } = require("../controllers/users.js");

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/userinfo", auth, getUserInfo);
// router.patch("/username", auth, updateUserName);
// router.patch("/password", auth, updateUserPassword);
// router.delete("/removeuser", auth, removeUser);

// module.exports = router;


const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const User = require('../models/user'); // Ensure the User model is imported
const dotenv = require('dotenv');
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'araft'; // Use environment variable or fallback
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHashed = await bcrypt.hash(password, salt);
        const createdUser = await User.create({
            email,
            password: passwordHashed,
            name: `${firstName} ${lastName}`,
            coins: 100000
        });

        const token = jwt.sign({ email: createdUser.email, id: createdUser._id }, jwtSecret, { expiresIn: '1h' });

        const userResponse = {
            name: createdUser.name,
            email: createdUser.email,
            coins: createdUser.coins,
        };

        res.status(201).json({ result: userResponse, token });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'An error occurred while registering the user.' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: "User doesn't exist." });
        }

        const passwordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!passwordCorrect) {
            return res.status(400).json({ message: 'Invalid login credentials.' });
        }

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, jwtSecret, { expiresIn: '1h' });

        const userResponse = {
            name: existingUser.name,
            email: existingUser.email,
            coins: existingUser.coins,
        };

        res.status(200).json({ result: userResponse, token });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'An error occurred while logging in the user.' });
    }
});

// Get user information
router.get('/userinfo', auth, async (req, res) => {
    try {
        const userData = await User.findById(req.userId);

        if (!userData) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const userResponse = {
            name: userData.name,
            email: userData.email,
            coins: userData.coins,
        };

        res.status(200).json(userResponse);
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(404).json({ message: 'An error occurred fetching the user information.' });
    }
});

// Update user name
router.patch('/username', auth, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.userId)) {
            return res.status(404).send(`No user with id: ${req.userId}`);
        }

        await User.findByIdAndUpdate(req.userId, { name: `${firstName} ${lastName}` });
        const updatedUser = await User.findById(req.userId);

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const userResponse = {
            name: updatedUser.name,
            email: updatedUser.email,
            coins: updatedUser.coins,
        };

        res.status(200).json(userResponse);
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(404).json({ message: 'An error occurred updating your username.' });
    }
});

// Update user password
router.patch('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, newPasswordConfirmed } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.userId)) {
            return res.status(404).send(`No user with id: ${req.userId}`);
        }

        if (newPassword !== newPasswordConfirmed) {
            return res.status(400).json({ message: 'Passwords do not match!' });
        }

        const userData = await User.findById(req.userId);
        const passwordCorrect = await bcrypt.compare(currentPassword, userData.password);

        if (!passwordCorrect) {
            return res.status(400).json({ message: 'Invalid old password!' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHashed = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(req.userId, { password: passwordHashed });
        res.status(200).json({ message: 'Password successfully updated!' });
    } catch (error) {
        res.status(404).json({ message: 'An error occurred updating your password.' });
    }
});

// Remove user
router.delete('/removeuser', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.userId)) {
            return res.status(404).send(`No user with id: ${req.userId}`);
        }

        await User.findByIdAndDelete(req.userId);

        res.status(200).json({ message: 'User successfully deleted!' });
    } catch (error) {
        res.status(404).json({ message: 'An error occurred removing the user.' });
    }
});

// Export the router with the defined routes
module.exports = router;


