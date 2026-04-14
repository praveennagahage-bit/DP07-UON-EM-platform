import { useState } from "react";
import "./auth.css";

export default function AuthPage() {
  const [mode, setMode] = useState("signup");
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "attendee",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleLoginChange(e) {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSignupChange(e) {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      setMessage("Login successful");
      localStorage.setItem("uonUser", JSON.stringify(data.user));
    } catch (err) {
      setError("Could not connect to server");
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // current backend only supports username + password
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: signupForm.email,
          password: signupForm.password,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      setMessage("Account created successfully");
    } catch (err) {
      setError("Could not connect to server");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-left-content">
            <h1>
              {mode === "signup" ? "Get Started with Us" : "Welcome Back"}
            </h1>
            <p className="auth-left-sub">
              {mode === "signup"
                ? "Complete these easy steps to register your account."
                : "Login to access your account and manage your event activity."}
            </p>

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

        <div className="auth-right">
          <div className="auth-form-wrap">
            <div className="auth-toggle">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
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
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                type="button"
              >
                Sign Up
              </button>
            </div>

            <h2>{mode === "signup" ? "Sign Up Account" : "Login Account"}</h2>
            <p className="form-subtext">
              {mode === "signup"
                ? "Enter your personal data to create your account."
                : "Enter your credentials to access your account."}
            </p>

            <div className="social-buttons">
              <button type="button">G Google</button>
              <button type="button">◉ GitHub</button>
            </div>

            <div className="divider">
              <span>Or</span>
            </div>

            {mode === "signup" ? (
              <form className="auth-form" onSubmit={handleSignupSubmit}>
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

                <p className="helper-text">Must be at least 8 characters.</p>

                {error && <p className="form-error">{error}</p>}
                {message && <p className="form-success">{message}</p>}

                <button className="submit-btn" type="submit">
                  Sign Up
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <label>
                  Username
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={handleLoginChange}
                    required
                  />
                </label>

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

                {error && <p className="form-error">{error}</p>}
                {message && <p className="form-success">{message}</p>}

                <button className="submit-btn" type="submit">
                  Login
                </button>
              </form>
            )}

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
