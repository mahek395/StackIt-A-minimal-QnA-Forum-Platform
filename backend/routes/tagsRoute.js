const express = require("express");
const router = express.Router();
const { verifyToken } = require("./auth");

router.post("/generate", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({ error: "Title or description required" });
    }

    const prompt = `Suggest exactly 3 concise and relevant tags (1-3 words each) for the following question. Return only the tags separated by commas, no numbering, no extra text:\n\nTitle: ${title}\n\nDescription: ${description}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({ error: "Failed to generate tags" });
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tags = aiResponse
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 3);

    res.json({ tags });
  } catch (err) {
    console.error("Tag generation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;