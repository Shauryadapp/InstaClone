import { useState, useEffect } from "react";
import "./App.css";

import Leftside from "./Component/Leftside/leftside";
import Middle from "./Component/MIddle/middle";
import Rightside from "./Component/RIghtside/Rightside";

import Login from "./Log-in/login";
import Signup from "./Log-in/signup";

import Search from "./Search/search";
import Profile from "./Profile/profile";
import PublicProfile from "./Profile/publicprofile";
import Createpost from "./Createpost/createpost";
import Messages from "./Messages/message";
import Notifications from "./Notifications/notifications";

const App = () => {
  // Initialize page from localStorage if token exists, otherwise default to "login"
  const [page, setPage] = useState(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return "login";
    return localStorage.getItem("current_page") || "home";
  });

  const [showCreatepost, setShowCreatepost] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);

  const [selectedUserId, setSelectedUserId] = useState(() => {
    return localStorage.getItem("selected_user_id") || null;
  });

  // Remember current page in localStorage whenever it changes
  useEffect(() => {
    if (page !== "login" && page !== "signup") {
      localStorage.setItem("current_page", page);
    }
  }, [page]);

  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem("selected_user_id", selectedUserId);
    }
  }, [selectedUserId]);

  // LOGIN
  if (page === "login") {
    return (
      <Login
        onSignup={() => setPage("signup")}
        onLogin={() => {
          setPage("home");
          localStorage.setItem("current_page", "home");
        }}
      />
    );
  }

  // SIGNUP
  if (page === "signup") {
    return <Signup onLogin={() => setPage("login")} />;
  }

  // PROFILE
  if (page === "profile") {
    return (
      <Profile
        onHome={() => setPage("home")}
        onSearch={() => setPage("search")}
        onMessages={() => setPage("messages")}
        onNotifications={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
        onCreateClick={() => setShowCreatepost(true)}
        onLogout={() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("current_page");
          localStorage.removeItem("selected_user_id");
          setPage("login");
        }}
        onUserClick={(userId) => {
          setSelectedUserId(userId);
          setPage("publicProfile");
        }}
      />
    );
  }

  // PUBLIC PROFILE
  if (page === "publicProfile") {
    return (
      <PublicProfile
        userId={selectedUserId}
        onHome={() => setPage("home")}
        onSearch={() => setPage("search")}
        onMessages={() => setPage("messages")}
        onNotifications={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
        onCreateClick={() => setShowCreatepost(true)}
      />
    );
  }

// MESSAGES
  if (page === "messages") {
    return (
      <Messages
        onHome={() => setPage("home")}
        onSearch={() => setPage("search")}
        onMessages={() => setPage("messages")}
        onNotifications={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
        onCreateClick={() => setShowCreatepost(true)}
      />
    );
  }

  // NOTIFICATIONS
  if (page === "notifications") {
    return (
      <Notifications
        onHome={() => setPage("home")}
        onSearch={() => setPage("search")}
        onMessages={() => setPage("messages")}
        onNotifications={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
        onCreateClick={() => setShowCreatepost(true)}
      />
    );
  }

  // SEARCH
  if (page === "search") {
    return (
      <Search
        onHome={() => setPage("home")}
        onSearch={() => setPage("search")}
        onMessages={() => setPage("messages")}
        onNotifications={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
        onCreateClick={() => setShowCreatepost(true)}
        onUserClick={(userId) => {
          setSelectedUserId(userId);
          setPage("publicProfile");
        }}
      />
    );
  }

  // HOME
  if (page === "home") {
    return (
      <div className="App">
        <div className="leftsidehome">
          <Leftside
            onHome={() => setPage("home")}
            onSearch={() => setPage("search")}
            onMessages={() => setPage("messages")}
            onNotifications={() => setPage("notifications")}
            onProfile={() => setPage("profile")}
            onCreateClick={() => setShowCreatepost(true)}
          />
        </div>

        <div className="middleside">
          <Middle
            refreshTrigger={refreshPosts}
            onUserClick={(userId) => {
              setSelectedUserId(userId);
              setPage("publicProfile");
            }}
          />
        </div>

        <div className="rightside">
          <Rightside />
        </div>

        {/* FLOATING MESSAGES BUTTON */}
        <button
          className="floating-messages"
          type="button"
          onClick={() => setPage("messages")}
        >
          <span className="messages-icon">➤</span>
          <strong>Messages</strong>
          <img src="/atul-image-1.jpeg" alt="Profile" />
        </button>

        {/* CREATE POST MODAL */}
        {showCreatepost && (
          <Createpost
            onClose={() => setShowCreatepost(false)}
            onPostCreated={() => {
              setRefreshPosts((previous) => previous + 1);
              setShowCreatepost(false);
            }}
          />
        )}
      </div>
    );
  }

  return null;
};

export default App;