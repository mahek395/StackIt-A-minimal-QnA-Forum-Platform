// components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://stackit-a-minimal-qna-forum-platform-production.up.railway.app/api/auth/profile", {
          credentials: "include", // important for cookies
        });

        if (res.ok) {
          const user = await res.json();
          setIsAuthenticated(true);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        navigate("/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (checkingAuth) {
    return <div className="text-center mt-10 text-gray-500">Checking authentication...</div>;
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
