import React, { useState, useRef } from "react";
import TextEditor from "./TextEditor";
import { useNavigate } from "react-router-dom";


const AskQuestion = ({ onPost }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiTags, setAiTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTags, setCustomTags] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Keep the ref for backwards compatibility, but sync it with state
  const editorContentRef = useRef("");

  const handleEditorChange = (content) => {
    setDescription(content);
    editorContentRef.current = content;
  };

  const handleTagCheckbox = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const generateTags = async () => {
    setShowTags(true);
    setLoadingTags(true);

    // Use both state and ref to ensure we get the latest content
    const currentDescription = description || editorContentRef.current;
    const question = `Title: ${title}\n\nDescription: ${currentDescription}`;
    const prompt = `Suggest 3 concise and relevant tags (1-3 words each) for the following question without numbering or extra text:\n\n${question}`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "HTTP-Referer": "<YOUR_SITE_URL>",
          "X-Title": "<YOUR_SITE_NAME>",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";

      const extractedTags = aiResponse
        .replace(/[\d\.\-]+/g, "")
        .split(/[,|\n]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      setAiTags(extractedTags);
    } catch (error) {
      console.error("Failed to generate tags:", error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSubmit = async () => {
    // Get the most current description content
    const currentDescription = description || editorContentRef.current;
    
    // Validate required fields
    if (!title.trim()) {
      alert("Please enter a title for your question.");
      return;
    }

    if (!currentDescription.trim()) {
      alert("Please enter a description for your question.");
      return;
    }

    const finalTags = [
      ...selectedTags,
      ...customTags.split(",").map((t) => t.trim()).filter((t) => t),
    ];

    const questionData = {
      title: title.trim(),
      description: currentDescription.trim(),
      tags: finalTags,
    };

    console.log("Question payload:", questionData);

    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // include HTTP-only cookie
        body: JSON.stringify(questionData),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to post question:", error);
        alert(`Error: ${error.error || 'Failed to post question'}`);
        return;
      }

      let data = {};
      try {
        data = await res.json(); // Try parsing only if you expect a JSON
        console.log("Submitted Question:", data.question);
        if (onPost) onPost(data.question);
      } catch (err) {
        console.warn("No JSON response body, or failed to parse.");
      }

      // Clear the form
      setTitle("");
      setDescription("");
      setAiTags([]);
      setSelectedTags([]);
      setCustomTags("");
      setShowTags(false);
      editorContentRef.current = "";

      alert("Question posted successfully!");
      navigate("/");

    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Ask a Question</h1>
      <p className="text-gray-600 mb-6">
        Get help from the community by asking a detailed question about your coding problem.
      </p>

      <section className="mb-8">
        {/* Title */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
            <span className="font-bold">Title</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Be specific and imagine you're asking a question to another person"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
            <span className="font-bold">Description</span>
          </label>
          <TextEditor onChange={handleEditorChange} />
        </div>
      </section>

      {/* See Tags Button */}
      {!showTags && (
        <div className="mb-6">
          <button
            onClick={generateTags}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            See Tags
          </button>
        </div>
      )}

      {/* Tags Section */}
      {showTags && (
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="tags">
            <span className="font-bold">Tags</span>
          </label>

          {loadingTags ? (
            <p className="text-sm text-gray-500">Generating tags...</p>
          ) : (
            <>
              {/* AI Suggested Tags as Checkboxes */}
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {aiTags.map((tag, idx) => (
                    <label key={idx} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={tag}
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagCheckbox(tag)}
                        className="accent-blue-500"
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Custom Tag Input */}
              <input
                type="text"
                id="tags"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder="Add your own tags (comma separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      )}

      {/* Post Button */}
      <div className="flex justify-center">
        <button
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleSubmit}
        >
          Post Question
        </button>
      </div>
    </div>
  );
};

export default AskQuestion;