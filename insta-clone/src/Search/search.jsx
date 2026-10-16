import { useState } from "react";
import "./search.css";
import { API_ENDPOINTS } from "../api/api.js";
import Leftside from "../Component/Leftside/leftside";

const Search = ({ 
  onHome, 
  onSearch, 
  onMessages, 
  onNotifications, 
  onProfile, 
  onCreateClick, 
  onUserClick 
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const searchTerm = query.trim();

    if (!searchTerm) {
      setResults([]);
      setError("Enter a username to search.");
      setSearched(false);
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please log in to search for users.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(
        API_ENDPOINTS.USER_SEARCH(searchTerm),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not search users."
        );
      }

      setResults(data);
    } catch (err) {
      console.error("User search error:", err);
      setResults([]);
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-layout-wrapper" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* LEFT SIDEBAR */}
      <Leftside
        onHome={onHome}
        onSearch={onSearch}
        onMessages={onMessages}
        onNotifications={onNotifications}
        onProfile={onProfile}
        onCreateClick={onCreateClick}
      />

      {/* SEARCH MAIN CONTENT */}
      <div 
        className="search-main-container" 
        style={{ 
          marginLeft: "100px", 
          width: "calc(100% - 100px)", 
          display: "flex", 
          justifyContent: "center",
          padding: "20px" 
        }}
      >
        <main className="search-page" style={{ width: "100%", maxWidth: "700px" }}>
          <header className="search-header">
            <h1>Search users</h1>
          </header>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={50}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <p className="search-message">{error}</p>}

          {!error && !loading && searched && results.length === 0 && (
            <p className="search-message">
              No matching users found.
            </p>
          )}

          <section className="search-results">
            {results.map((user) => (
              <button
                type="button"
                className="search-user"
                key={user.id}
                onClick={() => onUserClick(user.id)}
              >
                <span className="search-avatar">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </span>

                <span className="search-username">
                  {user.username}
                </span>

                <span className="search-view-profile">
                  View profile
                </span>
              </button>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Search;