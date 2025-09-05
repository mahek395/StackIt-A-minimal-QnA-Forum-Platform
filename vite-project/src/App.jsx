import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages without layout */}
        <Route path="/signin" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Pages with layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* Add more protected routes here */}
        </Route>
      </Routes>
    </Router>
  );
}
