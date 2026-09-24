import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../api";
// Import React's useState hook to store and update component state
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import the CSS file that styles this auth page
import "./auth.css";

// Main auth page component
// This page contains BOTH Sign Up and Login in one screen
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);

  // mode decides which form is visible:
  // "signup" -> Sign Up form
  // "login"  -> Login form
  const [mode, setMode] = useState("login");

  // Stores login form input values
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Stores sign up form input values
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    role: "attendee",
  });

  // Stores success message shown to the user
  const [message, setMessage] = useState("");

  // Stores error message shown to the user
  const [error, setError] = useState("");

  // Handles typing inside the login form
  // It updates the specific field that changed
  function handleLoginChange(e) {
    const { name, value } = e.target;

    // Copy previous form values and update the changed input
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handles typing inside the sign up form
  // It updates the specific field that changed
  function handleSignupChange(e) {
    const { name, value } = e.target;

    // Copy previous form values and update the changed input
    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handles login form submission
  async function handleLoginSubmit(e) {
    // Prevent the browser from refreshing the page
    e.preventDefault();
    if (busy) return;

    // Clear old messages before new request
    setError("");
    setMessage("");

    // Check whether email is empty
    if (!loginForm.email.trim()) {
      setError("Email is required");
      return;
    }

    // Check whether password is empty
    if (!loginForm.password) {
      setError("Password is required");
      return;
    }

    setBusy(true);
    try {
      await login(loginForm);
      const destination = location.state?.from;
      navigate(typeof destination === 'string' && destination.startsWith('/') && !destination.startsWith('//') ? destination : '/');
    } catch (err) {
      setError(err.message || 'Could not connect to server');
    } finally { setBusy(false); }
  }

  // Handles sign up form submission
  async function handleSignupSubmit(e) {
    // Prevent page refresh
    e.preventDefault();
    if (busy) return;

    // Clear old messages
    setError("");
    setMessage("");

    // Check whether first name is empty
    if (!signupForm.firstName.trim()) {
      setError("First name is required");
      return;
    }

    // Check whether last name is empty
    if (!signupForm.lastName.trim()) {
      setError("Last name is required");
      return;
    }

    // Check whether email is empty
    if (!signupForm.email.trim()) {
      setError("Email is required");
      return;
    }

    // Check whether confirm email is empty
    if (!signupForm.confirmEmail.trim()) {
      setError("Please confirm your email");
      return;
    }

    // Check whether both email fields match
    if (
      signupForm.email.trim().toLowerCase() !==
      signupForm.confirmEmail.trim().toLowerCase()
    ) {
      setError("Email addresses do not match");
      return;
    }

    // Check whether password is empty
    if (!signupForm.password) {
      setError("Password is required");
      return;
    }

    // Check whether confirm password is empty
    if (!signupForm.confirmPassword) {
      setError("Please confirm your password");
      return;
    }

    // Check whether both password fields match
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      // Backend now supports:
      // firstName, lastName, email, role, and password
      //
      // Social buttons are currently UI-only and are not sent to backend.

      const response = await apiFetch("/register", {
        method: "POST",
        headers: {
          // Tell backend the request body is JSON
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          firstName: signupForm.firstName,
          lastName: signupForm.lastName,
          email: signupForm.email,
          role: signupForm.role,
          password: signupForm.password,
        }),
      });

      // Convert backend response to object
      const data = await response.json();

      // If registration fails, show backend error message
      if (!response.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      // If successful, show success message
      setMessage("Account created successfully. Please log in.");
      setLoginForm({ email: signupForm.email.trim(), password: "" });
      setSignupForm(previous => ({ ...previous, password: "", confirmPassword: "" }));
      setMode("login");
    } catch (err) {
      // If request fails completely
      setError(err.message || "Could not connect to server");
    } finally { setBusy(false); }
  }

  // UI rendered by the component
  return (
    <div className="auth-page">
      <div className="auth-shell">

        {/* Left design / marketing panel */}
        <div className="auth-left">
          <div className="auth-left-content">

            {/* Main heading changes depending on current mode */}
            <h1>
              {mode === "signup"
                ? "Get Started with Us"
                : "Welcome Back"}
            </h1>

            {/* Supporting paragraph also changes depending on mode */}
            <p className="auth-left-sub">
              {mode === "signup"
                ? "Complete these easy steps to register your account."
                : "Login to access your account and manage your event activity."}
            </p>

            {/* Step cards shown on left side */}
            <div className="auth-steps">

              <div
                className={`step-card ${
                  mode === "signup" ? "active" : ""
                }`}
              >
                <span>1</span>
                <p>
                  {mode === "signup"
                    ? "Sign up your account"
                    : "Log into account"}
                </p>
              </div>

              <div className="step-card">
                <span>2</span>
                <p>
                  {mode === "signup"
                    ? "Set up your role"
                    : "Access dashboard"}
                </p>
              </div>

              <div className="step-card">
                <span>3</span>
                <p>
                  {mode === "signup"
                    ? "Set up your profile"
                    : "Manage events"}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Right side form panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">

            {/* Toggle buttons to switch between login and sign up */}
            <div className="auth-toggle">

              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  // Switch to login form
                  setMode("login");

                  // Clear messages when switching form
                  setError("");
                  setMessage("");
                }}
                type="button"
              >
                Login
              </button>

              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  // Switch to signup form
                  setMode("signup");

                  // Clear messages when switching form
                  setError("");
                  setMessage("");
                }}
                type="button"
              >
                Sign Up
              </button>

            </div>

            {/* Form heading changes with mode */}
            <h2>
              {mode === "signup"
                ? "Sign Up Account"
                : "Login Account"}
            </h2>

            {/* Form subtext changes with mode */}
            <p className="form-subtext">
              {mode === "signup"
                ? "Enter your personal data to create your account."
                : "Enter your credentials to access your account."}
            </p>

            {/* If mode is signup, show sign up form */}
            {mode === "signup" ? (

              <form
                className="auth-form"
                onSubmit={handleSignupSubmit}
                noValidate
              >

                {/* First name + last name row */}
                <div className="row-two">

                  <label>
                    First Name
                    <input
                      type="text"
                      name="firstName"
                      placeholder="eg. John"
                      value={signupForm.firstName}
                      onChange={handleSignupChange}
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      type="text"
                      name="lastName"
                      placeholder="eg. Smith"
                      value={signupForm.lastName}
                      onChange={handleSignupChange}
                    />
                  </label>

                </div>

                {/* Email field */}
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="eg. john@email.com"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                  />
                </label>

                {/* Confirm email field */}
                <label>
                  Confirm Email
                  <input
                    type="email"
                    name="confirmEmail"
                    placeholder="Re-enter your email"
                    value={signupForm.confirmEmail}
                    onChange={handleSignupChange}
                  />
                </label>

                {/* Role select field */}
                <label>
                  Sign Up As
                  <select
                    name="role"
                    value={signupForm.role}
                    onChange={handleSignupChange}
                  >
                    <option value="attendee">
                      Attendee
                    </option>

                    <option value="organizer">
                      Organizer
                    </option>
                  </select>
                </label>

                {/* Password field */}
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                  />
                </label>

                {/* Confirm password field */}
                <label>
                  Confirm Password
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                  />
                </label>

                {/* Show error if present */}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {/* Show success message if present */}
                {message && (
                  <p className="form-success" role="status">
                    {message}
                  </p>
                )}

                {/* Submit button */}
                <button
                  className="submit-btn"
                  disabled={busy}
                  type="submit"
                >
                  Sign Up
                </button>

              </form>

            ) : (

              // Otherwise show login form
              <form
                className="auth-form"
                onSubmit={handleLoginSubmit}
                noValidate
              >

                {/* Email field */}
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                  />
                </label>

                {/* Password field */}
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                  />
                </label>

                {/* Show error if present */}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {/* Show success message if present */}
                {message && (
                  <p className="form-success" role="status">
                    {message}
                  </p>
                )}

                {/* Submit button */}
                <button
                  className="submit-btn"
                  disabled={busy}
                  type="submit"
                >
                  Login
                </button>

              </form>

            )}

            {/* Bottom text to switch between login and signup */}
            <p className="bottom-switch">

              {mode === "signup" ? (

                <>
                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Log in
                  </button>
                </>

              ) : (

                <>
                  Don’t have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Sign up
                  </button>
                </>

              )}

            </p>

          </div>
        </div>

      </div>
    </div>
  );
}