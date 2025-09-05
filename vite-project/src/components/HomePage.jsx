import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // ✅ correct API base
  withCredentials: true
});

const stripHtmlTags = (html) => {
  if (!html) return '';
  // Remove HTML tags and decode HTML entities
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function HomePage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('user');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 2;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log("🔄 Fetching questions from API...");
        setLoading(true);

        const res = await axios.get('http://localhost:5000/api/questions');

        console.log("✅ API Response received:");
        console.log("Response status:", res.status);
        console.log("Response data type:", typeof res.data);
        console.log("Is array:", Array.isArray(res.data));
        console.log("Data length:", res.data?.length);

        if (res.data && res.data.length > 0) {
          console.log("📋 First question sample:");
          console.log("- ID:", res.data[0]._id);
          console.log("- Title:", res.data[0].title);
          console.log("- Author:", res.data[0].author);
          console.log("- AnswersCount:", res.data[0].answersCount);
        }

        if (Array.isArray(res.data)) {
          setQuestions(res.data);
          console.log(`✅ Set ${res.data.length} questions in state`);
        } else {
          console.error("❌ Expected array but got:", typeof res.data);
          console.error("Actual data:", res.data);
          setQuestions([]);
        }

      } catch (err) {
        console.error('❌ Failed to fetch questions:');
        console.error('Error message:', err.message);
        console.error('Response data:', err.response?.data);
        console.error('Response status:', err.response?.status);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);
  

  // Filter
  const filteredQuestions = questions.filter(question => {
    const query = searchQuery.toLowerCase();
    return (
      question.title?.toLowerCase().includes(query) ||
      question.description?.toLowerCase().includes(query) ||
      question.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      (question.author &&
        `${question.author.firstName} ${question.author.lastName}`
          .toLowerCase()
          .includes(query))
    );
  });

  // Sort
  // Improved sorting logic with better error handling
const sortedQuestions = [...filteredQuestions].sort((a, b) => {
  console.log(`🔄 Sorting by: ${sortBy}`); // Debug log
  
  switch (sortBy) {
    case 'Newest':
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Newest first
      
    case 'Most Answered':
      const answersA = Number(a.answersCount) || 0;
      const answersB = Number(b.answersCount) || 0;
      console.log(`Comparing answers: ${a.title} (${answersA}) vs ${b.title} (${answersB})`);
      return answersB - answersA; // Most answered first
      
    case 'Most Viewed':
      const viewsA = Number(a.views) || 0;
      const viewsB = Number(b.views) || 0;
      console.log(`Comparing views: ${a.title} (${viewsA}) vs ${b.title} (${viewsB})`);
      return viewsB - viewsA; // Most viewed first
      
    default:
      return 0;
  }
});

// Add this debug log after sorting
console.log(`📊 After sorting by ${sortBy}:`, 
  sortedQuestions.map(q => ({
    title: q.title,
    answers: q.answersCount || 0,
    views: q.views || 0,
    date: q.createdAt
  }))
);

  // Pagination
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = sortedQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(sortedQuestions.length / questionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleQuestionClick = (questionId) => {
    navigate(`/questions/${questionId}`);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading questions...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => {
                  if (isLoggedIn) navigate("/ask");
                  else alert("Please login first.");
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ask New Question
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search questions, tags, or authors..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Newest">Newest</option>
                <option value="Most Answered">Most Answered</option>
                <option value="Most Viewed">Most Viewed</option>
              </select>
            </div>

            {searchQuery && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredQuestions.length} results for "{searchQuery}"
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
              {currentQuestions.length > 0 ? (
                currentQuestions.map((question) => (
                  <div key={question._id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleQuestionClick(question._id)}
                        >
                          {question.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {stripHtmlTags(question.description)}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags?.map((tag, index) => (
                            <span key={index} className="px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {question.author
                              ? `${question.author.firstName} ${question.author.lastName}`
                              : 'Unknown'}
                          </span>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(question.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex-shrink-0 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {question.answersCount || 0}
                        </div>
                        <div className="text-sm text-gray-500">answers</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-600">
                  No questions found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {sortedQuestions.length > questionsPerPage && (
              <div className="mt-8 flex justify-center">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border bg-white text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-4 py-2 border-t border-b bg-white text-sm ${currentPage === number ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border bg-white text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            {/* Popular Tags / Recent Activity */}
          </div>
        </div>
      </main>
    </div>
  );
}