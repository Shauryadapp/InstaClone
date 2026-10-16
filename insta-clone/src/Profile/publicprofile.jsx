import { useEffect, useState } from "react";
import "./publicprofile.css";
import { API_BASE_URL, API_ENDPOINTS } from "../api/api.js";
import PostViewer from "../Component/PostViewer.jsx";
import Leftside from "../Component/Leftside/leftside";

const PublicProfile = ({ 
  userId, 
  onHome, 
  onSearch, 
  onMessages, 
  onNotifications, 
  onProfile, 
  onCreateClick, 
  onUserClick 
}) => {
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  // Followers/following popup state
  const [followListType, setFollowListType] = useState(null);
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListError, setFollowListError] = useState("");

  // =====================================
  // FETCH PUBLIC PROFILE DATA
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const fetchProfileData = async () => {
      setLoading(true);
      setError("");

      try {
        if (userId == null) {
          throw new Error("No user selected.");
        }

        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [profileResponse, countsResponse, postsResponse] =
          await Promise.all([
            fetch(API_ENDPOINTS.PUBLIC_USER_PROFILE(userId), { headers }),
            fetch(API_ENDPOINTS.USER_FOLLOW_COUNTS(userId), { headers }),
            fetch(API_ENDPOINTS.POSTS),
          ]);

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.detail || "Could not load profile."
          );
        }

        // Follower/following counts
        let countsData = {
          followers_count: 0,
          following_count: 0,
        };

        if (countsResponse.ok) {
          countsData = await countsResponse.json();
        }

        // Posts belonging to this user
        let userPosts = [];
        if (postsResponse.ok) {
          const allPosts = await postsResponse.json();
          const postsArray = Array.isArray(allPosts)
            ? allPosts
            : allPosts.posts || [];

          userPosts = postsArray.filter(
            (post) => String(post.user_id) === String(userId)
          );
        }

        // Identify logged-in user
        let loggedInUserId = null;
        if (token) {
          try {
            const meResponse = await fetch(API_ENDPOINTS.MY_PROFILE, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (meResponse.ok) {
              const meData = await meResponse.json();
              loggedInUserId = meData.id;
            }
          } catch (err) {
            console.error("Could not identify current user:", err);
          }
        }

        // Get follow status
        let following = false;
        if (
          token &&
          loggedInUserId !== null &&
          String(loggedInUserId) !== String(userId)
        ) {
          try {
            const followResponse = await fetch(
              API_ENDPOINTS.USER_FOLLOW_STATUS(userId),
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (followResponse.ok) {
              const followData = await followResponse.json();
              following = followData.is_following;
            }
          } catch (err) {
            console.error("Could not fetch follow status:", err);
          }
        }

        if (!cancelled) {
          setUser(profileData);
          setCurrentUserId(loggedInUserId);
          setPosts(userPosts);
          setFollowersCount(countsData.followers_count ?? 0);
          setFollowingCount(countsData.following_count ?? 0);
          setIsFollowing(following);
        }
      } catch (err) {
        console.error("Public profile error:", err);
        if (!cancelled) {
          setError(err.message || "Could not load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // =====================================
  // FOLLOW / UNFOLLOW
  // =====================================

  const handleToggleFollow = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in to follow users.");
      return;
    }

    if (followLoading) return;

    const method = isFollowing ? "DELETE" : "POST";

    try {
      setFollowLoading(true);

      const response = await fetch(API_ENDPOINTS.USER_FOLLOW(userId), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update follow status.");
      }

      setIsFollowing(data.is_following);
      setFollowersCount(data.followers_count ?? followersCount);
    } catch (err) {
      console.error("Follow error:", err);
      alert(err.message || "Could not update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  // =====================================
  // OPEN FOLLOWERS / FOLLOWING LIST
  // =====================================

  const openFollowList = async (type) => {
    if (!userId) return;

    setFollowListType(type);
    setFollowList([]);
    setFollowListError("");
    setFollowListLoading(true);

    const endpoint =
      type === "followers"
        ? API_ENDPOINTS.USER_FOLLOWERS(userId)
        : API_ENDPOINTS.USER_FOLLOWING(userId);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Could not load ${type}.`);
      }

      setFollowList(data);
    } catch (error) {
      console.error(`Could not load ${type}:`, error);
      setFollowListError(error.message || `Could not load ${type}.`);
    } finally {
      setFollowListLoading(false);
    }
  };

  if (loading) {
    return <p className="profile-status">Loading profile...</p>;
  }

  if (error) {
    return (
      <div className="profile-status">
        <p>{error}</p>
        <button type="button" onClick={onHome}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!user) {
    return <p className="profile-status">User not found.</p>;
  }

  const isOwnProfile =
    currentUserId !== null && String(currentUserId) === String(userId);

  return (
    <div className="profile-page">
      {/* LEFT SIDEBAR */}
      <Leftside
        onHome={onHome}
        onSearch={onSearch}
        onMessages={onMessages}
        onNotifications={onNotifications}
        onProfile={onProfile}
        onCreateClick={onCreateClick}
      />

      {/* MAIN PROFILE */}
      <main className="profile-content">
        {/* PROFILE HEADER */}
        <section className="profile-header">
          <div className="profile-image-container">
            <div className="profile-image">
              <img
                src={
                  user.profile_picture
                    ? `${API_BASE_URL}${user.profile_picture}`
                    : "/profile-icon.png"
                }
                alt={`${user.username}'s profile`}
              />
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-username-row">
              <h1>{user.username}</h1>
            </div>

            <p className="profile-display-name">
              {user.full_name || user.name || ""}
            </p>

            <p className="profile-email">
              {user.email || user.gmail || user.email_address || ""}
            </p>

            <div className="profile-stats">
              <div>
                <strong>{posts.length}</strong> posts
              </div>

              <button
                type="button"
                className="profile-stat-button"
                onClick={() => openFollowList("followers")}
              >
                <strong>{followersCount}</strong> followers
              </button>

              <button
                type="button"
                className="profile-stat-button"
                onClick={() => openFollowList("following")}
              >
                <strong>{followingCount}</strong> following
              </button>
            </div>
          </div>
        </section>

        {/* ACTION BUTTONS (Matches Profile.jsx layout size) */}
        {!isOwnProfile && (
          <div className="profile-buttons">
            <button
              type="button"
              className={`public-follow-btn ${isFollowing ? "following" : ""}`}
              onClick={handleToggleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? "Please wait..."
                : isFollowing
                ? "Following"
                : "Follow"}
            </button>
          </div>
        )}

        {/* PROFILE TABS */}
        <div className="profile-tabs">
          <button
            type="button"
            className={activeTab === "posts" ? "active" : ""}
            onClick={() => setActiveTab("posts")}
            aria-label="Posts"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="10" y="3" width="5" height="5" rx="1" />
              <rect x="17" y="3" width="4" height="5" rx="1" />
              <rect x="3" y="10" width="5" height="5" rx="1" />
              <rect x="10" y="10" width="5" height="5" rx="1" />
              <rect x="17" y="10" width="4" height="5" rx="1" />
              <rect x="3" y="17" width="5" height="4" rx="1" />
              <rect x="10" y="17" width="5" height="4" rx="1" />
              <rect x="17" y="17" width="4" height="4" rx="1" />
            </svg>
          </button>

          <button
            type="button"
            className={activeTab === "saved" ? "active" : ""}
            onClick={() => setActiveTab("saved")}
            aria-label="Saved"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4V3Z" />
            </svg>
          </button>

          <button
            type="button"
            className={activeTab === "tagged" ? "active" : ""}
            onClick={() => setActiveTab("tagged")}
            aria-label="Tagged photos"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="6" width="16" height="15" rx="3" />
              <path d="M9 6l1.5-3h3L15 6" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          </button>
        </div>

        {/* POSTS GRID OR EMPTY STATE */}
        {activeTab === "posts" && posts.length > 0 ? (
          <section className="profile-post-grid">
            {posts.map((post) => (
              <button
                type="button"
                className="profile-post-card"
                key={post.id}
                onClick={() => setSelectedPost(post)}
                aria-label={`Open post ${post.id}`}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || "User post"}
                  loading="lazy"
                />
              </button>
            ))}
          </section>
        ) : (
          <section className="empty-profile">
            <div className="empty-camera">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M8 15h7l3-4h12l3 4h7a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V18a3 3 0 0 1 3-3Z" />
                <circle cx="24" cy="26" r="9" />
              </svg>
            </div>

            <h2>No Posts Yet</h2>
            <p>When this user shares photos, they will appear here.</p>
          </section>
        )}
      </main>

      {/* FOLLOWERS / FOLLOWING POPUP */}
      {followListType && (
        <div
          className="follow-list-overlay"
          onClick={() => setFollowListType(null)}
        >
          <section
            className="follow-list-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              followListType === "followers" ? "Followers" : "Following"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <header className="follow-list-header">
              <h2>
                {followListType === "followers" ? "Followers" : "Following"}
              </h2>

              <button
                type="button"
                onClick={() => setFollowListType(null)}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            {followListLoading && (
              <p className="follow-list-message">Loading users...</p>
            )}

            {!followListLoading && followListError && (
              <p className="follow-list-message">{followListError}</p>
            )}

            {!followListLoading &&
              !followListError &&
              followList.length === 0 && (
                <p className="follow-list-message">
                  {followListType === "followers"
                    ? "No followers yet."
                    : "Not following anyone yet."}
                </p>
              )}

            {!followListLoading &&
              !followListError &&
              followList.map((person) => (
                <button
                  type="button"
                  className="follow-list-user"
                  key={person.id}
                  onClick={() => {
                    setFollowListType(null);
                    onUserClick?.(person.id);
                  }}
                >
                  <span className="follow-list-avatar">
                    {person.username?.charAt(0).toUpperCase() || "U"}
                  </span>

                  <span>{person.username}</span>
                </button>
              ))}
          </section>
        </div>
      )}

      {/* POST VIEWER */}
      {selectedPost && (
        <PostViewer
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* MESSAGES PILL */}
      <button className="profile-messages" type="button" onClick={onMessages}>
        <div className="messages-icon">
          <img src="message-icons.png" alt="Messages" />
        </div>

        <strong>Messages</strong>
        <img src="/profile-icon.png" alt="" />
      </button>
    </div>
  );
};

export default PublicProfile;