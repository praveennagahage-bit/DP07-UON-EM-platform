// Import React's useState hook to store and update component state
import { useState } from "react";

// Import the CSS file that styles this auth page
import "./auth.css";

// Main auth page component
// This page contains BOTH Sign Up and Login in one screen
export default function AuthPage() {
  // mode decides which form is visible:
  // "signup" -> Sign Up form
  // "login"  -> Login form
  const [mode, setMode] = useState("signup");

  // Stores currently selected social sign up option for UI highlighting only
  const [selectedProvider, setSelectedProvider] = useState("google");

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
    password: "",
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
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  // Handles typing inside the sign up form
  // It updates the specific field that changed
  function handleSignupChange(e) {
    const { name, value } = e.target;

    // Copy previous form values and update the changed input
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  // Handles login form submission
  async function handleLoginSubmit(e) {
    // Prevent the browser from refreshing the page
    e.preventDefault();

    // Clear old messages before new request
    setError("");
    setMessage("");

    try {
      // Send login data to backend
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          // Tell backend we are sending JSON
          "Content-Type": "application/json"
        },
        // Send the login form object as JSON
        body: JSON.stringify(loginForm)
      });

      // Convert backend response into JavaScript object
      const data = await response.json();

      // If backend returns an error status, show error message
      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // If successful, show success message
      setMessage("Login successful");

      // Save logged-in user info in browser local storage
      // This can be used later for session-like behavior on frontend
      localStorage.setItem("uonUser", JSON.stringify(data.user));
    } catch (err) {
      // If request fails completely (server down, network issue, etc.)
      setError("Could not connect to server");
    }
  }

  // Handles sign up form submission
  async function handleSignupSubmit(e) {
    // Prevent page refresh
    e.preventDefault();

    // Clear old messages
    setError("");
    setMessage("");

    try {
      // Backend now supports:
      // firstName, lastName, email, role, and password
      //
      // Social buttons are currently UI-only and are not sent to backend.

      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          // Tell backend the request body is JSON
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: signupForm.firstName,
          lastName: signupForm.lastName,
          email: signupForm.email,
          role: signupForm.role,
          password: signupForm.password,
        })
      });

      // Convert backend response to object
      const data = await response.json();

      // If registration fails, show backend error message
      if (!response.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      // If successful, show success message
      setMessage("Account created successfully");
    } catch (err) {
      // If request fails completely
      setError("Could not connect to server");
    }
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
              {mode === "signup" ? "Get Started with Us" : "Welcome Back"}
            </h1>

            {/* Supporting paragraph also changes depending on mode */}
            <p className="auth-left-sub">
              {mode === "signup"
                ? "Complete these easy steps to register your account."
                : "Login to access your account and manage your event activity."}
            </p>

            {/* Step cards shown on left side */}
            <div className="auth-steps">
              <div className={`step-card ${mode === "signup" ? "active" : ""}`}>
                <span>1</span>
                <p>{mode === "signup" ? "Sign up your account" : "Log into account"}</p>
              </div>

              <div className="step-card">
                <span>2</span>
                <p>{mode === "signup" ? "Set up your role" : "Access dashboard"}</p>
              </div>

              <div className="step-card">
                <span>3</span>
                <p>{mode === "signup" ? "Set up your profile" : "Manage events"}</p>
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
                  // Switch to sign up form
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
            <h2>{mode === "signup" ? "Sign Up Account" : "Login Account"}</h2>

            {/* Form subtext changes with mode */}
            <p className="form-subtext">
              {mode === "signup"
                ? "Enter your personal data to create your account."
                : "Enter your credentials to access your account."}
            </p>

            {/* Social auth buttons - UI only for now */}
            <div className="social-buttons">
              <button
                type="button"
                className={selectedProvider === "google" ? "active" : ""}
                onClick={() => setSelectedProvider("google")}
              >
                G Google
              </button>
              <button
                type="button"
                className={selectedProvider === "github" ? "active" : ""}
                onClick={() => setSelectedProvider("github")}
              >
                 GitHub
              </button>
            </div>

            {/* Divider between social login and form */}
            <div className="divider">
              <span>Or</span>
            </div>

            {/* If mode is signup, show sign up form */}
            {mode === "signup" ? (
              <form className="auth-form" onSubmit={handleSignupSubmit}>

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
                      required
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
                      required
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
                    required
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
                    <option value="attendee">Attendee</option>
                    <option value="organizer">Organizer</option>
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
                    required
                  />
                </label>

                {/* Show error if present */}
                {error && <p className="form-error">{error}</p>}

                {/* Show success message if present */}
                {message && <p className="form-success">{message}</p>}

                {/* Submit button */}
                <button className="submit-btn" type="submit">
                  Sign Up
                </button>
              </form>
            ) : (
              // Otherwise show login form
              <form className="auth-form" onSubmit={handleLoginSubmit}>

                {/* Email field */}
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    required
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
                    required
                  />
                </label>

                {/* Show error if present */}
                {error && <p className="form-error">{error}</p>}

                {/* Show success message if present */}
                {message && <p className="form-success">{message}</p>}

                {/* Submit button */}
                <button className="submit-btn" type="submit">
                  Login
                </button>
              </form>
            )}

            {/* Bottom text to switch between login and signup */}
            <p className="bottom-switch">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")}>
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don’t have an account?{" "}
                  <button type="button" onClick={() => setMode("signup")}>
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