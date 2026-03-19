const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// JWT middleware inline
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  console.log("Token from cookies:", token);
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing user ID" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    console.log("Decoded user ID:", req.userId);
    next();
  } catch (error) {
    console.log("Token verification error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, firstName, lastName, email, password: hashed });

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Logged in",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Profile (protected)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Test auth endpoint
router.get('/test-auth', (req, res) => {
  console.log('=== AUTH TEST ===');
  console.log('All cookies:', req.cookies);
  console.log('Token exists:', !!req.cookies.token);

  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      res.json({ success: true, cookies: req.cookies, decoded, userId: decoded.id });
    } catch (error) {
      res.json({ success: false, error: error.message, cookies: req.cookies });
    }
  } else {
    res.json({ success: false, error: 'No token cookie found', cookies: req.cookies });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;