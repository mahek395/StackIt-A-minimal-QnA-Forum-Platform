const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Question = require("../models/Questions.js");
const Answer = require("../models/Answers.js");
const User = require("../models/User");
const { verifyToken } = require("./auth");

// Debug log middleware
router.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// Get all questions - WITH DETAILED DEBUGGING
router.get("/", async (req, res) => {
  try {
    console.log("\n=== FETCHING QUESTIONS ===");

    const questionCount = await Question.countDocuments();
    console.log(`Total questions in database: ${questionCount}`);

    if (questionCount === 0) {
      console.log("No questions found - returning empty array");
      return res.json([]);
    }

    console.log("Fetching questions with populated authors...");
    const questions = await Question.find()
      .populate("author", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Fetched ${questions.length} questions`);
    console.log("First question sample:", questions[0]);

    // ✅ Fix ObjectId constructor
    const questionIds = questions.map(q => new mongoose.Types.ObjectId(q._id));
    console.log("Question IDs:", questionIds);

    // Count answers for all questions in one go
    const answerCounts = await Answer.aggregate([
      { $match: { question: { $in: questionIds } } },
      { $group: { _id: "$question", count: { $sum: 1 } } }
    ]);

    console.log("Raw answerCounts from DB:", answerCounts);

    // Convert counts into a lookup map
    const countMap = {};
    answerCounts.forEach(ac => {
      countMap[ac._id.toString()] = ac.count;
    });

    console.log("Answer count lookup map:", countMap);

    // Merge counts into questions
    const transformedQuestions = questions.map(q => ({
      _id: q._id,
      title: q.title,
      description: q.description,
      tags: q.tags || [],
      author: q.author || null,
      answersCount: countMap[q._id.toString()] || 0,
      views: q.views || 0,
      createdAt: q.createdAt
    }));

    console.log("Final transformedQuestions:", transformedQuestions);

    res.json(transformedQuestions);

  } catch (err) {
    console.error("=== ERROR FETCHING QUESTIONS ===");
    console.error("Error details:", err);
    res.status(500).json({
      error: "Failed to fetch questions",
      details: err.message
    });
  }
});

// 🚨 THIS IS THE MISSING ROUTE - GET single question by ID
router.get("/:id", async (req, res) => {
  try {
    console.log("\n=== FETCHING SINGLE QUESTION ===");
    console.log("Question ID:", req.params.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format:", req.params.id);
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const question = await Question.findById(req.params.id)
      .populate("author", "firstName lastName email username");
    
    if (!question) {
      console.log("Question not found with ID:", req.params.id);
      return res.status(404).json({ error: "Question not found" });
    }
    
    console.log("Question found:", {
      id: question._id,
      title: question.title,
      author: question.author?.firstName || question.author?.username
    });
    
    res.json(question);
    
  } catch (err) {
    console.error("=== ERROR FETCHING SINGLE QUESTION ===");
    console.error("Error details:", err);
    
    // Handle CastError specifically
    if (err.name === 'CastError') {
      return res.status(400).json({ error: "Invalid question ID format" });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error",
      details: err.message 
    });
  }
});

// Create a question (requires token)
router.post("/", verifyToken, async (req, res) => {
  try {
    console.log("\n=== CREATING NEW QUESTION ===");
    console.log("User ID from token:", req.userId);

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }

    const { title, description, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Verify user exists
    const userExists = await User.findById(req.userId);
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }
    
    console.log("Creating question for user:", userExists.firstName, userExists.lastName);

    const newQuestion = new Question({
      title,
      description,
      tags: tags || [],
      author: req.userId,
    });

    const savedQuestion = await newQuestion.save();
    
    // Populate author info before returning
    await savedQuestion.populate("author", "firstName lastName email");
    
    console.log("Question created successfully:", savedQuestion._id);
    res.status(201).json(savedQuestion);

  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a question (only author can edit)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    console.log("\n=== UPDATING QUESTION ===");
    console.log("Question ID:", req.params.id);
    console.log("User ID:", req.userId);

    const { title, description, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Check if user is the author
    if (question.author.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to edit this question" });
    }

    // Update fields
    if (title) question.title = title;
    if (description) question.description = description;
    if (tags) question.tags = tags;
    question.updatedAt = new Date();

    await question.save();
    await question.populate("author", "firstName lastName email username");

    console.log("Question updated successfully");
    res.json(question);

  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a question (only author or admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    console.log("\n=== DELETING QUESTION ===");
    console.log("Question ID:", req.params.id);
    console.log("User ID:", req.userId);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    if (question.author.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this question" });
    }

    await Question.findByIdAndDelete(req.params.id);
    
    // Also delete all answers for this question
    await Answer.deleteMany({ question: req.params.id });
    
    console.log("Question and related answers deleted successfully");
    res.json({ message: "Question deleted successfully" });

  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;