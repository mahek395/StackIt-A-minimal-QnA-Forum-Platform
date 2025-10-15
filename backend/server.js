require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/Questions");
const answerRoutes = require('./routes/answerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware order is important!
app.use(express.json());
app.use(cookieParser());

// Fixed CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Add your frontend URLs
  credentials: true, // This is crucial for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Add this middleware to log requests and cookies
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Cookies received:', req.cookies);
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/notifications', notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(5000, () => {
    console.log("Server running on port 5000");
    console.log("CORS enabled for:", ["http://localhost:5173", "http://localhost:3000"]);
    console.log("JWT_SECRET configured:", !!process.env.JWT_SECRET);
  }))
  .catch(err => console.error("MongoDB connection error:", err));