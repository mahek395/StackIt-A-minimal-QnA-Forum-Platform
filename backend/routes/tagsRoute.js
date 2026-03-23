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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(500).json({ error: "Failed to generate tags" });
    }

    const aiResponse = data.choices?.[0]?.message?.content || "";
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