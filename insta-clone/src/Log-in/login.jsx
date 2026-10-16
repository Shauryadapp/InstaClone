import { useState } from "react";
import "./login.css";
import { API_ENDPOINTS } from "../api/api.js";

const Login = ({ onSignup, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage("Please enter your username/email and password.");
      setMessageType("error");
      return;
    }


    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username_or_email: username,
          password: password,
        }),
      });


      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed.");
        setMessageType("error");
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      setMessage("Login successful! Welcome to Instagram.");
      setMessageType("success");

      setTimeout(() => {
        onLogin();
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);

      setMessage("Could not connect to the server.");
      setMessageType("error");
    }
  };
  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = () => {
    if (!username) {
      setMessage("Please enter your email or username first.");
      setMessageType("error");
      return;
    }

    setMessage(
      `Password reset instructions have been sent for "${username}".`
    );
    setMessageType("success");
  };

  // ================= FACEBOOK =================
  const handleFacebookLogin = () => {
    setMessage("Facebook login selected.");
    setMessageType("success");
  };

  // ================= META =================
  const handleMetaClick = () => {
    setMessage("You clicked Meta.");
    setMessageType("success");
  };

  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}

      <div className="login-left">

        {/* Instagram Logo */}
        <div className="instagram-logo">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
            alt="Instagram"
          />
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>
            See everyday moments from your
          </h1>

          <h1 className="gradient-text">
            close friends.
          </h1>
        </div>

        {/* Instagram Images */}
        <div className="promo-images">

          <div className="promo-card card-left">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
              alt="Instagram"
            />
          </div>

          <div className="promo-card card-middle">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9"
              alt="Instagram"
            />
          </div>

          <div className="promo-card card-right">
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce"
              alt="Instagram"
            />
          </div>

          {/* Heart */}
          <div className="heart">
            ❤️
          </div>

          {/* Reaction */}
          <div className="reaction">
            🥰👀😍
          </div>

        </div>
      </div>


      {/* ================= RIGHT SIDE ================= */}

      <div className="login-right">

        <div className="login-form">

          <h2>
            Log into Instagram
          </h2>

          {/* Login Form */}
          <form onSubmit={handleLogin}>

            {/* Username */}
            <input
              type="text"
              placeholder="Mobile number, username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Login */}
            <button
              type="submit"
              className="login-button"
            >
              Log in
            </button>

          </form>


          {/* ================= MESSAGE ================= */}

          {message && (
            <div className={`login-message ${messageType}`}>
              {message}
            </div>
          )}


          {/* Forgot Password */}
          <button
            type="button"
            className="forgot-password"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>


          {/* Facebook */}
          <button
            type="button"
            className="facebook-login"
            onClick={handleFacebookLogin}
          >
            <span className="facebook-icon">
              f
            </span>

            Log in with Facebook
          </button>


          {/* Create Account */}
          <button
            type="button"
            className="create-account"
            onClick={onSignup}
          >
            Create new account
          </button>


          {/* Meta */}
          <button
            type="button"
            className="meta-logo"
            onClick={handleMetaClick}
          >
            ∞ Meta
          </button>

        </div>
      </div>


      {/* ================= FOOTER ================= */}

      <div className="login-footer">

        <span>Meta</span>
        <span>About</span>
        <span>Blog</span>
        <span>Jobs</span>
        <span>Help</span>
        <span>API</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>Locations</span>
        <span>Popular</span>
        <span>Instagram Lite</span>
        <span>Meta AI</span>
        <span>Muse</span>
        <span>Threads</span>
        <span>Contact Uploading & Non-Users</span>
        <span>Meta Verified</span>

      </div>

    </div>
  );
};

export default Login;