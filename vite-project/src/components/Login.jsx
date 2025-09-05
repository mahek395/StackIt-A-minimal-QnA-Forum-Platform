import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const initialState = {
  email: "",
  password: "",
};

export default function Login() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email))
      errs.email = "Invalid email format.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined, api: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        }
        else {
          setErrors({ api: data.error || "Login failed." });
        }
      } catch {
        setErrors({ api: "Network error. Please try again." });
      }
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    alert("🔒 Google sign-in not implemented yet.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8"> {/* Adjusted background and padding */}
      <div className="w-full max-w-md p-8 rounded-lg shadow-md bg-white relative"> {/* Adjusted padding and shadow */}
        <div className="text-center mb-6"> {/* Centered heading and description */}
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2> {/* Darker text */}
        </div>

        {errors.api && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4"> {/* Increased space-y */}
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com" // Added placeholder
          />

          <FormInput
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            showToggle
            showPassword={showPassword}
            toggleShow={() => setShowPassword((v) => !v)}
          />



          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50 text-base" // Adjusted padding and font-weight
          >
            {submitting ? "Signing In..." : "Sign In"} {/* Changed text */}
          </button>

        </form>
        <div className="text-center">

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-blue-600 hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Reusable input component
function FormInput({ label, name, type, value, onChange, error, showToggle, showPassword, toggleShow, placeholder, // Added placeholder prop
}) {
  return (
    <div className="relative">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"> {/* Darker label text, added mb-1 */}
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`block w-full rounded-md border-gray-300 shadow-sm placeholder-gray-400
                  focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-base transition ${ // Adjusted padding and text size
          error ? "border-red-500" : "" // Only apply red border on error
          }`}
        placeholder={placeholder} // Pass placeholder to input
      />
      {showToggle && (
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={toggleShow}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none" // Adjusted position and colors
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Eye Icons (no changes needed here)
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 
        7.523 5 12 5s8.268 2.943 9.542 7c-1.274 
        4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 
        9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 
        3 3 0 016 0zm6.825 6.825A9.96 9.96 0 
        0022 12c0-5.523-4.477-10-10-10a10.05 
        10.05 0 00-1.875.175M4.5 4.5l15 15" />
    </svg>
  );
}