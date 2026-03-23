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

  const editorContentRef = useRef("");

  const handleEditorChange = (content) => {
    setDescription(content);
    editorContentRef.current = content;
  };

  const handleTagCheckbox = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const generateTags = async () => {
    setShowTags(true);
    setLoadingTags(true);

    const currentDescription = description || editorContentRef.current;

    try {
      const res = await fetch(
        "https://stackit-a-minimal-qna-forum-platform-production.up.railway.app/api/tags/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, description: currentDescription }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tags");
      setAiTags(data.tags);
    } catch (error) {
      console.error("Failed to generate tags:", error);
      alert("Could not generate tags. Please try again.");
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSubmit = async () => {
    const currentDescription = description || editorContentRef.current;

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

    try {
      const res = await fetch(
        "https://stackit-a-minimal-qna-forum-platform-production.up.railway.app/api/questions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(questionData),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to post question"}`);
        return;
      }

      const data = await res.json();
      if (onPost) onPost(data.question);

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

        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
            <span className="font-bold">Description</span>
          </label>
          <TextEditor onChange={handleEditorChange} />
        </div>
      </section>

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

      {showTags && (
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="tags">
            <span className="font-bold">Tags</span>
          </label>

          {loadingTags ? (
            <p className="text-sm text-gray-500">Generating tags...</p>
          ) : (
            <>
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