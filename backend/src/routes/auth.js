const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/register", async (req, res) => {
    try{
        const {email, password } = req.body || {};
        if (!email || !password){
            return res.status(400).json({error: "Email and password are required"});
        }
        if (password.length < 8){
            return res.status(400).json({error: "Password must be at least 8 characters long"});
        }
        const existing = await User.findOne({email: email.toLowerCase().trim()});
        if (existing) return res.status(409).json({error: "Email already registered"});

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({email: email.toLowerCase().trim(), passwordHash});
        await user.save();

        const token = jwt.sign({id : user._id}, process.env.JWT_SECRET, {expiresIn: "7d"} );

        return res.status(201).json({
            message: "User registered",
            user: { id: user._id, email: user.email},
            token,
        });
        }catch (err){
            console.error("Registration Error:", err);
            return res.status(500).json({ error: "Server error during registration"});
        }

});

router.post("/login", async (req,res) => {
    try{
        const {email, password} = req.body || {};
        if (!email || !password){
            return res.status(400).json({error: "Email and password are required"});
        }

        const user = await User.findOne({email: email.toLowerCase().trim()});
        if (!user) return res.status(401).json({error: "Invalid credentials"});

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch) return res.status(401).json({error: "Invalid credentials"});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d"});

        return res.json({
            message: "Login successful",
            user: {id: user._id, email: user.email},
            token,
        });
        }catch(err){
            console.error("Login Error:", err);
            return res.status(500).json({error: "Server error during login"});
        }
});

router.get("/me", authMiddleware, async (req,res) => {
    res.json({user: req.user});
});

module.exports = router;

