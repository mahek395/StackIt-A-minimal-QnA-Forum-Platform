const express = require("express");
const router = express.Router();
const { verifyToken } = require("./auth");
const Answer = require("../models/Answers");
const User = require("../models/User");

// CREATE an answer
router.post("/", verifyToken, async (req, res) => {
  try {
    const { questionId, text } = req.body;
    const userId = req.userId;

    if (!questionId || !text) {
      return res.status(400).json({ error: "questionId and text are required" });
    }

    const answer = new Answer({
      question: questionId,
      author: userId,
      text,
    });

    await answer.save();

    // Populate author and comments.author for complete data
    await answer.populate([
      { path: "author", select: "username firstName lastName" },
      { path: "comments.author", select: "username firstName lastName" }
    ]);


    // --- Notification logic ---
    try {
      const Question = require("../models/Questions");
      const Notification = require("../models/Notification");
      const question = await Question.findById(questionId).populate("author");
      if (question && question.author && question.author._id.toString() !== userId) {
        // Don't notify yourself
        await Notification.create({
          user: question.author._id,
          type: "answer",
          message: `Someone answered your question: "${question.title}"`,
          link: `/questions/${questionId}`,
        });
      }

      // --- @mention logic for answers ---
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      let match;
      const mentionedUsernames = new Set();
      while ((match = mentionRegex.exec(text)) !== null) {
        mentionedUsernames.add(match[1]);
      }
      if (mentionedUsernames.size > 0) {
        const users = await User.find({ username: { $in: Array.from(mentionedUsernames) } });
        for (const mentionedUser of users) {
          if (mentionedUser._id.toString() !== userId) {
            await Notification.create({
              user: mentionedUser._id,
              type: "mention",
              message: `You were mentioned in an answer`,
              link: `/questions/${questionId}`,
            });
          }
        }
      }
      // --- End @mention logic for answers ---
    } catch (notifyErr) {
      console.error("[Notification] Failed to create notification for answer or mention:", notifyErr);
    }
    // --- End notification logic ---

    res.status(201).json(answer);
  } catch (err) {
    console.error("Failed to post answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all answers for a specific question (updated route to match frontend)
router.get("/:questionId", async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate("author", "username firstName lastName")
      .populate("comments.author", "username firstName lastName")
      .sort({ createdAt: -1 });
    res.json(answers);
  } catch (err) {
    console.error("Failed to fetch answers:", err);
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

// GET single answer by ID
router.get("/single/:id", async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)
      .populate("author", "username firstName lastName")
      .populate("comments.author", "username firstName lastName");
    
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }
    res.json(answer);
  } catch (err) {
    console.error("Failed to get answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST comment to an answer
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const answerId = req.params.id;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const answer = await Answer.findById(answerId).populate("author");
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Add comment to the answer
    const newComment = {
      author: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    answer.comments.push(newComment);
    await answer.save();

    // Get the newly added comment with populated author
    await answer.populate("comments.author", "username firstName lastName");


    // --- Notification logic ---
    try {
      const Notification = require("../models/Notification");
      if (answer.author && answer.author._id.toString() !== userId) {
        // Don't notify yourself
        await Notification.create({
          user: answer.author._id,
          type: "comment",
          message: `Someone commented on your answer`,
          link: `/questions/${answer.question}`,
        });
      }

      // --- @mention logic for comments ---
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      let match;
      const mentionedUsernames = new Set();
      while ((match = mentionRegex.exec(text)) !== null) {
        mentionedUsernames.add(match[1]);
      }
      if (mentionedUsernames.size > 0) {
        const users = await User.find({ username: { $in: Array.from(mentionedUsernames) } });
        for (const mentionedUser of users) {
          if (mentionedUser._id.toString() !== userId) {
            await Notification.create({
              user: mentionedUser._id,
              type: "mention",
              message: `You were mentioned in a comment`,
              link: `/questions/${answer.question}`,
            });
          }
        }
      }
      // --- End @mention logic for comments ---
    } catch (notifyErr) {
      console.error("[Notification] Failed to create notification for comment or mention:", notifyErr);
    }
    // --- End notification logic ---

    // Return the newly added comment
    const addedComment = answer.comments[answer.comments.length - 1];
    res.status(201).json(addedComment);
    
  } catch (err) {
    console.error("Failed to post comment:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a comment from an answer
router.delete("/:answerId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const { answerId, commentId } = req.params;
    const userId = req.userId;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    const comment = answer.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the comment author or admin
    if (comment.author.toString() !== userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    comment.remove();
    await answer.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Failed to delete comment:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// PATCH update answer (only author can edit)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const answerId = req.params.id;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Answer text is required" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Check if user is the author
    if (answer.author.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this answer" });
    }

    answer.text = text.trim();
    answer.updatedAt = new Date();
    await answer.save();

    await answer.populate([
      { path: "author", select: "username firstName lastName" },
      { path: "comments.author", select: "username firstName lastName" }
    ]);

    res.json(answer);
  } catch (err) {
    console.error("Failed to update answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE an answer (only author or admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    if (answer.author.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this answer" });
    }

    await Answer.findByIdAndDelete(req.params.id);
    res.json({ message: "Answer deleted successfully" });
  } catch (err) {
    console.error("Failed to delete answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PATCH accept an answer (only question owner)
// PATCH vote with user tracking (KEEP THIS ONE, REMOVE THE SIMPLE ONE)
router.patch("/:id/vote", verifyToken, async (req, res) => {
  try {
    const { type } = req.body; // "up" or "down"
    if (!["up", "down"].includes(type)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    if (!answer.voters) answer.voters = new Map();

    const prevVote = answer.voters.get(req.userId);

    if (prevVote === type) {
      return res.status(400).json({ error: "You have already voted this way" });
    }

    if (!answer.votes) answer.votes = 0;

    if (!prevVote) {
      // First time voting
      answer.votes += type === "up" ? 1 : -1;
    } else {
      // Changing vote
      answer.votes += type === "up" ? 2 : -2;
    }

    answer.voters.set(req.userId, type);

    await answer.save();
    await answer.populate("author", "username firstName lastName");

    res.json(answer);
  } catch (err) {
    console.error("Failed to vote:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PATCH accept an answer (only question owner) - FIXED VERSION
router.patch("/:id/accept", verifyToken, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate("question");
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Only the owner of the question can accept an answer
    if (answer.question.author.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to accept this answer" });
    }

    // Unaccept all other answers for this question
    await Answer.updateMany(
      { question: answer.question._id },
      { $set: { isAccepted: false } }
    );

    // Accept this one
    answer.isAccepted = true;
    await answer.save();

    // Return all answers for this question with updated status
    const allAnswers = await Answer.find({ question: answer.question._id })
      .populate("author", "username firstName lastName")
      .populate("comments.author", "username firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ message: "Answer accepted successfully", answers: allAnswers });
  } catch (err) {
    console.error("Failed to accept answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;