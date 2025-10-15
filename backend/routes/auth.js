const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// JWT middleware inline
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  console.log("Token from cookies:", token); // Debug log
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing user ID" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    console.log("Decoded user ID:", req.userId); // Debug log
    next();
  } catch (error) {
    console.log("Token verification error:", error.message); // Debug log
    res.status(401).json({ error: "Invalid token" });
  }
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hashed });

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
// Login route with explicit cookie domain
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    // Cookie options with explicit domain for localhost
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax", // Changed from "Lax" to "lax" (lowercase)
      secure: false, // Must be false for localhost
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
      domain: "localhost" // Explicitly set domain for localhost
    };

    console.log("Setting cookie with options:", cookieOptions);
    res.cookie("token", token, cookieOptions);

    // Log the response headers to verify Set-Cookie
    console.log("Response headers will include Set-Cookie");

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

// Add a test endpoint to check if cookies are being received
// Add this to your auth routes for testing
router.get('/test-auth', (req, res) => {
  console.log('=== AUTH TEST ===');
  console.log('All cookies:', req.cookies);
  console.log('Raw cookie header:', req.headers.cookie);
  console.log('Token exists:', !!req.cookies.token);
  
  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      res.json({ 
        success: true, 
        cookies: req.cookies, 
        decoded: decoded,
        userId: decoded.id 
      });
    } catch (error) {
      console.log('Token verification failed:', error.message);
      res.json({ 
        success: false, 
        error: error.message, 
        cookies: req.cookies 
      });
    }
  } else {
    res.json({ 
      success: false, 
      error: 'No token cookie found', 
      cookies: req.cookies,
      rawHeader: req.headers.cookie 
    });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;