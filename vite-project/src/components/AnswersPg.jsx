import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, ThumbsUp, ThumbsDown, Check } from "lucide-react";

import {
  MessageSquareText,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import TextEditor from "../components/TextEditor";

export default function QuestionPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();

  // ...existing code...

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [newComments, setNewComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingComments, setSubmittingComments] = useState({});
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [voteLoading, setVoteLoading] = useState({});
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Get current user data
  // Get current user data from localStorage
  const userStr = localStorage.getItem("user");
  let user = undefined;
  let currentUserId = undefined;
  try {
    user = userStr ? JSON.parse(userStr) : undefined;
    currentUserId = user?._id || user?.id;
  } catch (e) {}
  const token = localStorage.getItem("token");

  // Better user ID comparison function
  const compareUserIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    // Convert both to strings and trim whitespace for comparison
    return String(id1).trim() === String(id2).trim();
  };

  // Check if current user is the question owner - moved inside component with better comparison
  const isQuestionOwner = question && currentUserId && compareUserIds(question.author?._id, currentUserId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

  // ...existing code...

        if (!questionId) {
          throw new Error("No question ID provided");
        }

        // Fetch question with better error handling
        const questionUrl = `http://localhost:5000/api/questions/${questionId}`;
  // ...existing code...

        const qRes = await fetch(questionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

  // ...existing code...

        if (!qRes.ok) {
          if (qRes.status === 404) {
            throw new Error("Question not found");
          }
          const errorData = await qRes.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Failed to fetch question: ${qRes.status}`);
        }

        const qData = await qRes.json();
  // ...existing code...
        setQuestion(qData);

        // Fetch answers
        const answersUrl = `http://localhost:5000/api/answers/${questionId}`;
  // ...existing code...

        const aRes = await fetch(answersUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

  // ...existing code...

        if (!aRes.ok) {
          const errorData = await aRes.json().catch(() => ({ error: "Unknown error" }));
          console.error("Answers fetch error:", errorData);
          throw new Error(errorData.error || `Failed to fetch answers: ${aRes.status}`);
        }

        const aData = await aRes.json();
  // ...existing code...
        setAnswers(aData);

        // Initialize comment states
        const commentStates = Object.fromEntries(aData.map((ans) => [ans._id, ""]));
        const expandedStates = Object.fromEntries(aData.map((ans) => [ans._id, false]));

        setNewComments(commentStates);
        setExpandedComments(expandedStates);

  // ...existing code...
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchData();
    } else {
      console.error("No questionId found in URL params");
      setError("No question ID provided");
      setLoading(false);
    }
  }, [questionId, token]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    if (!token) {
      alert("Please log in to post an answer");
      return;
    }

    try {
      setSubmittingAnswer(true);
  // ...existing code...

      const res = await fetch(`http://localhost:5000/api/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ questionId, text: newAnswer }),
      });

  // ...existing code...

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
  // ...existing code...
        throw new Error(errorData.error || `Failed to post answer: ${res.status}`);
      }

      const savedAnswer = await res.json();
      setAnswers((prev) => [...prev, savedAnswer]);
      setNewAnswer("");

      // Initialize states for new answer
      setNewComments((prev) => ({ ...prev, [savedAnswer._id]: "" }));
      setExpandedComments((prev) => ({ ...prev, [savedAnswer._id]: false }));
    } catch (err) {
  // ...existing code...
      alert(err.message || "Could not post your answer. Please try again.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSubmitComment = async (answerId) => {
    const commentText = newComments[answerId]?.trim();
    if (!commentText) return;

    if (!token) {
      alert("Please log in to post a comment");
      return;
    }

    try {
      setSubmittingComments((prev) => ({ ...prev, [answerId]: true }));
  // ...existing code...

      const res = await fetch(`http://localhost:5000/api/answers/${answerId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ text: commentText }),
      });

  // ...existing code...

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
  // ...existing code...
        throw new Error(errorData.error || "Failed to post comment");
      }

      const newComment = await res.json();

      setAnswers((prev) =>
        prev.map((answer) =>
          answer._id === answerId
            ? { ...answer, comments: [...(answer.comments || []), newComment] }
            : answer
        )
      );

      setNewComments((prev) => ({ ...prev, [answerId]: "" }));
    } catch (err) {
  // ...existing code...
      alert(err.message || "Could not post your comment. Please try again.");
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  const handleVote = async (answerId, type) => {
    if (!token) {
      alert("Please log in to vote");
      return;
    }

    try {
      setVoteLoading((prev) => ({ ...prev, [answerId]: true }));

      const res = await fetch(`http://localhost:5000/api/answers/${answerId}/vote`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to vote");
      }

      const updatedAnswer = await res.json();

      setAnswers((prev) =>
        prev.map((a) => (a._id === answerId ? updatedAnswer : a))
      );
    } catch (err) {
      console.error("Vote error:", err);
      alert(err.message || "Failed to vote");
    } finally {
      setVoteLoading((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  const handleAccept = async (answerId) => {
    if (!token) {
      alert("Please log in to accept answers");
      return;
    }

    // Check if current user is the question owner with better comparison
    if (!isQuestionOwner) {
      alert("Only the question owner can accept answers");
  // ...existing code...
      return;
    }

    try {
      setAcceptLoading(true);

      const res = await fetch(`http://localhost:5000/api/answers/${answerId}/accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to accept answer");
      }

      // Refresh answers to get updated acceptance status
      const answersUrl = `http://localhost:5000/api/answers/${questionId}`;
      const aRes = await fetch(answersUrl, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: "include",
      });

      if (aRes.ok) {
        const updatedAnswers = await aRes.json();
        setAnswers(updatedAnswers);
      }

    } catch (err) {
  // ...existing code...
      alert(err.message || "Failed to accept answer");
    } finally {
      setAcceptLoading(false);
    }
  };

  const toggleComments = (answerId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [answerId]: !prev[answerId],
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Enhanced debug section
  console.log("=== ACCEPTANCE FEATURE DEBUG ===");
  console.log("Current User ID:", currentUserId, typeof currentUserId);
  console.log("Question Author:", question?.author);
  console.log("Question Author ID:", question?.author?._id, typeof question?.author?._id);
  console.log("String comparison result:", compareUserIds(question?.author?._id, currentUserId));
  console.log("Is Question Owner:", isQuestionOwner);
  console.log("Token exists:", !!token);
  console.log("Question loaded:", !!question);
  console.log("=================================");

  console.log("Component render - Loading:", loading, "Error:", error, "Question:", question);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading question...</p>
          <p className="text-sm text-gray-400">Question ID: {questionId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Question ID: {questionId}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Question not found</h2>
          <p className="text-gray-600 mb-2">The question you're looking for doesn't exist.</p>
          <p className="text-sm text-gray-500 mb-4">Question ID: {questionId}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Questions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto pt-6 px-4 text-sm text-gray-500">
        <Link to="/" className="hover:underline hover:text-blue-600">
          Questions
        </Link>{" "}
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700">
          {question.title.length > 50 ? `${question.title.substring(0, 50)}...` : question.title}
        </span>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Question */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">{question.title}</h1>
          <div className="prose max-w-none mb-4">
            <div dangerouslySetInnerHTML={{ __html: question.description }} />
          </div>

          {/* Question metadata */}
          <div className="flex items-center text-sm text-gray-500 space-x-4 pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>Asked by {question.author?.username || question.author?.firstName || "Anonymous"}</span>
            </div>
            {question.createdAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(question.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

  {/* Answers Section */}

        {/* Answers Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquareText className="w-5 h-5 mr-2 text-gray-600" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>

          {answers.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <MessageSquareText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
              <p className="text-gray-600 mb-4">Be the first to answer this question!</p>
            </div>
          ) : (
            answers.map((answer) => (
              <div key={answer._id} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${answer.isAccepted ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}>
                <div className="p-6">
                  <div className="flex">
                    {/* Voting sidebar */}
                    <div className="flex flex-col items-center mr-6 space-y-2">
                      <button
                        onClick={() => handleVote(answer._id, 'up')}
                        disabled={voteLoading[answer._id] || !token}
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ThumbsUp className="w-4 h-4 text-gray-600 hover:text-green-600" />
                      </button>

                      <span className="text-lg font-semibold text-gray-700">
                        {answer.votes || 0}
                      </span>

                      <button
                        onClick={() => handleVote(answer._id, 'down')}
                        disabled={voteLoading[answer._id] || !token}
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ThumbsDown className="w-4 h-4 text-gray-600 hover:text-red-600" />
                      </button>

                      {/* Accept answer button (only for question owner) */}
                      {isQuestionOwner && (
                        <button
                          onClick={() => handleAccept(answer._id)}
                          disabled={acceptLoading || !token}
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${answer.isAccepted
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                            }`}
                          title={answer.isAccepted ? 'Accepted answer' : 'Accept this answer'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Accepted indicator for non-owners */}
                      {!isQuestionOwner && answer.isAccepted && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-green-500 bg-green-500 text-white" title="Accepted answer">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Answer content */}
                    <div className="flex-1">
                      {/* Accepted answer badge */}
                      {answer.isAccepted && (
                        <div className="flex items-center mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            ✓ Accepted Answer
                          </span>
                        </div>
                      )}

                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: answer.text }} />
                      </div>

                      {/* Answer metadata */}
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>Answered by {answer.author?.username || answer.author?.firstName || "Anonymous"}</span>
                        </div>
                        {answer.createdAt && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(answer.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments section */}
                <div className="bg-gray-50 px-6 py-3 border-t">
                  <button
                    type="button"
                    onClick={() => toggleComments(answer._id)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {answer.comments?.length || 0} comments
                  </button>

                  {expandedComments[answer._id] && (
                    <div className="mt-3 space-y-3">
                      {/* Existing comments */}
                      {answer.comments?.map((comment) => (
                        <div key={comment._id} className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-800">{comment.text}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
                            <span>{comment.author?.username || comment.author?.firstName || "Anonymous"}</span>
                            {comment.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(comment.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add comment form */}
                      <div className="mt-4 flex space-x-2">
                        <input
                          type="text"
                          value={newComments[answer._id] || ""}
                          onChange={(e) =>
                            setNewComments((prev) => ({
                              ...prev,
                              [answer._id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(answer._id);
                            }
                          }}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={submittingComments[answer._id]}
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitComment(answer._id)}
                          disabled={!newComments[answer._id]?.trim() || submittingComments[answer._id]}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingComments[answer._id] ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Answer Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Answer</h2>
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <TextEditor
              value={newAnswer}
              onChange={(htmlContent, textContent) => {
                setNewAnswer(htmlContent);
              }}
              placeholder="Write your answer here..."
            />

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!newAnswer.trim() || submittingAnswer || !token}
              >
                {submittingAnswer ? "Posting..." : "Post Your Answer"}
              </button>
              <p className="text-sm text-gray-500">
                {!token ? "Please log in to post an answer." : "Make sure your answer is helpful and well-formatted."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}