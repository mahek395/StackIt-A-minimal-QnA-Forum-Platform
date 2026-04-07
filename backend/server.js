require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/Questions");
const answerRoutes = require('./routes/answerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const tagsRoute = require("./routes/tagsRoute");

const app = express();

// Middleware order is important!
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "*",
  credentials: true
}))

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
app.use("/api/tags", tagsRoute);

mongoose.connect(process.env.MONGO_URL)
  .then(() => app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port 5000");
    console.log("JWT_SECRET configured:", !!process.env.JWT_SECRET);
  }))
  .catch(err => console.error("MongoDB connection error:", err));
