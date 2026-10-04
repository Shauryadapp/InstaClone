import { useState } from "react";
import "./signup.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      username: username,
      email: email,
      password: password,
    };

    console.log("Sending:", userData);

    try {
      const response = await fetch("http://192.168.1.12:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      alert("Account created successfully!");

      console.log("Registered user:", data);

    } catch (error) {
      console.error("Error:", error);
      alert("Could not connect to the backend");
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-box">

        <div className="meta-logo">
          ∞ Meta
        </div>

        <h1>Get started on Instagram</h1>

        <p className="signup-subtitle">
          Sign up to see photos and videos from your friends.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Username</label>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <p className="signup-info">
            By signing up, you agree to our{" "}
            <a href="#">Terms</a>,{" "}
            <a href="#">Privacy Policy</a> and{" "}
            <a href="#">Cookies Policy</a>.
          </p>

          <button type="submit">
            Sign up
          </button>

        </form>

      </div>

    </div>
  );
};

export default Signup;