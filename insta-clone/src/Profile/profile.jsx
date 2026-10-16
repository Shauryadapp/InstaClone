import { useEffect, useState } from "react";
import "./profile.css";
import { API_BASE_URL, API_ENDPOINTS } from "../api/api.js";
import PostViewer from "../Component/PostViewer.jsx";

const Profile = ({ onHome, onLogout, onCreateClick, onUserClick }) => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [selectedPost, setSelectedPost] = useState(null);

  // Profile picture upload
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureNotice, setPictureNotice] = useState("");

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  // Profile data
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);

  // Followers/following popup
  const [followListType, setFollowListType] = useState(null);
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListError, setFollowListError] = useState("");

  // =====================================
  // FETCH PROFILE, COUNTS, AND POSTS
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const fetchProfileData = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("You are not logged in.");
        return;
      }

      try {
        const profileResponse = await fetch(API_ENDPOINTS.MY_PROFILE, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.detail || "Could not load profile."
          );
        }

        if (cancelled) return;

        setUser(profileData);
        setEditUsername(profileData.username || "");
        setEditEmail(profileData.email || "");

        const [countsResult, postsResult] = await Promise.allSettled([
          fetch(API_ENDPOINTS.USER_FOLLOW_COUNTS(profileData.id)),
          fetch(API_ENDPOINTS.POSTS),
        ]);

        if (cancelled) return;

        // Follower and following counts
        if (countsResult.status === "fulfilled") {
          const response = countsResult.value;

          if (response.ok) {
            const countsData = await response.json();

            if (cancelled) return;

            setFollowersCount(countsData.followers_count ?? 0);
            setFollowingCount(countsData.following_count ?? 0);
          } else {
            console.error("Could not load follow counts.");
          }
        } else {
          console.error(
            "Follow counts request failed:",
            countsResult.reason
          );
        }

        // Only display the logged-in user's posts
        if (postsResult.status === "fulfilled") {
          const response = postsResult.value;

          if (response.ok) {
            const postsData = await response.json();

            if (cancelled) return;

            const ownPosts = postsData.filter(
              (post) =>
                String(post.user_id) === String(profileData.id)
            );

            setUserPosts(ownPosts);
          } else {
            console.error("Could not load profile posts.");
          }
        } else {
          console.error(
            "Profile posts request failed:",
            postsResult.reason
          );
        }
      } catch (error) {
        console.error("Profile error:", error);

        if (!cancelled) {
          setMessage(
            error.message || "Could not connect to the server."
          );
        }
      }
    };

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================
  // UPLOAD PROFILE PICTURE
  // POST /users/me/profile-picture
  // =====================================

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPictureNotice("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPictureNotice("Image size must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setPictureNotice("Please log in again.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingPicture(true);
      setPictureNotice("");

      const response = await fetch(
        API_ENDPOINTS.UPLOAD_PROFILE_PICTURE,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not upload profile picture."
        );
      }

      setUser((previousUser) => ({
        ...previousUser,
        profile_picture: data.profile_picture,
      }));

      setPictureNotice("Profile picture updated successfully!");
    } catch (error) {
      console.error("Profile picture upload error:", error);

      setPictureNotice(
        error.message || "Could not upload profile picture."
      );
    } finally {
      setUploadingPicture(false);
      event.target.value = "";
    }
  };

  // =====================================
  // OPEN / CLOSE EDIT FORM
  // =====================================

  const handleToggleEdit = () => {
    if (!isEditing) {
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
      setProfileNotice("");
    } else {
      setProfileNotice("");
    }

    setIsEditing((previous) => !previous);
  };

  // =====================================
  // SAVE PROFILE CHANGES
  // PUT /users/me
  // =====================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      setProfileNotice("Please log in again.");
      return;
    }

    const username = editUsername.trim();
    const email = editEmail.trim();

    if (!username || !email) {
      setProfileNotice("Username and email cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileNotice("");

      const response = await fetch(API_ENDPOINTS.MY_PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;

        throw new Error(detail || "Could not update profile.");
      }

      setUser(data);
      setEditUsername(data.username || "");
      setEditEmail(data.email || "");
      setIsEditing(false);
      setProfileNotice("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileNotice(
        error.message || "Could not update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================
  // OPEN FOLLOWERS / FOLLOWING LIST
  // =====================================

  const openFollowList = async (type) => {
    if (!user?.id) return;

    setFollowListType(type);
    setFollowList([]);
    setFollowListError("");
    setFollowListLoading(true);

    const endpoint =
      type === "followers"
        ? API_ENDPOINTS.USER_FOLLOWERS(user.id)
        : API_ENDPOINTS.USER_FOLLOWING(user.id);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `Could not load ${type}.`
        );
      }

      setFollowList(data);
    } catch (error) {
      console.error(`Could not load ${type}:`, error);

      setFollowListError(
        error.message || `Could not load ${type}.`
      );
    } finally {
      setFollowListLoading(false);
    }
  };

  // =====================================
  // LOADING / ERROR STATES
  // =====================================

  if (message) {
    return <p className="profile-status">{message}</p>;
  }

  if (!user) {
    return <p className="profile-status">Loading profile...</p>;
  }

  // =====================================
  // PROFILE UI
  // =====================================

  return (
    <div className="profile-page">
      {/* LEFT SIDEBAR */}
      <aside className="profile-sidebar">
        <div className="profile-instagram-logo">
          <img src="/instagram-icon.png" alt="Instagram" />
        </div>

        <nav className="profile-nav">
          <div className="profile-nav-item" onClick={onHome}>
            <img src="home-icon.png" alt="" />
            <span>Home</span>
          </div>

          {/* <div className="profile-nav-item">
            <img src="reelicon.png" alt="" />
            <span>Reel</span>
          </div> */}

          <div className="profile-nav-item">
            <img src="message-icons.png" alt="" />
            <span>Messages</span>
          </div>

          <div className="profile-nav-item">
            <img src="search-icon.png" alt="" />
            <span>Search</span>
          </div>

          <div className="profile-nav-item">
            <img src="notification-icon.png" alt="" />
            <span>Notifications</span>
          </div>

          <div className="profile-nav-item" onClick={onCreateClick}>
            <img src="create-icon.png" alt="" />
            <span>Create</span>
          </div>

          <div className="profile-nav-item active-profile">
            <img src="/profile-icon.png" alt="Profile" />
            <span className="nav-label">Profile</span>
          </div>
        </nav>

        <div className="profile-bottom-nav">
          <div className="profile-nav-item">
            <span className="nav-symbol">☰</span>
            <span className="nav-label">More</span>
          </div>

          <div className="profile-nav-item">
            <span className="nav-symbol">▦</span>
            <span className="nav-label">More apps</span>
          </div>
        </div>
      </aside>

      {/* MAIN PROFILE */}
      <main className="profile-content">
        {/* PROFILE HEADER */}
        <section className="profile-header">
          <div className="profile-image-container">
            <div className="profile-note">Note...</div>

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

            <label
              htmlFor="profile-picture-upload"
              className="profile-picture-upload-button"
            >
              {uploadingPicture
                ? "Uploading..."
                : "Change profile picture"}
            </label>

            <input
              id="profile-picture-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePictureUpload}
              disabled={uploadingPicture}
              hidden
            />

            {pictureNotice && (
              <p className="profile-picture-notice" role="status">
                {pictureNotice}
              </p>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-username-row">
              <h1>{user.username}</h1>

              <div className="profile-settings">
                <img src="setting-icon.png" alt="Settings" />
              </div>
            </div>

            <p className="profile-display-name">
              {user.full_name || user.name || ""}
            </p>

            <p className="profile-email">
              {user.email ||
                user.gmail ||
                user.email_address ||
                "Email not available"}
            </p>

            <div className="profile-stats">
              <div>
                <strong>{userPosts.length}</strong> posts
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

        {/* PROFILE BUTTONS */}
        <div className="profile-buttons">
          <button type="button" onClick={handleToggleEdit}>
            {isEditing ? "Cancel editing" : "Edit profile"}
          </button>

          <button type="button">View archive</button>
        </div>

        {/* EDIT PROFILE FORM */}
        {isEditing && (
          <form
            className="profile-edit-form"
            onSubmit={handleSaveProfile}
          >
            <h2>Edit profile</h2>

            <label htmlFor="edit-username">Username</label>

            <input
              id="edit-username"
              type="text"
              value={editUsername}
              onChange={(event) =>
                setEditUsername(event.target.value)
              }
              minLength={3}
              maxLength={50}
              required
            />

            <label htmlFor="edit-email">Email</label>

            <input
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(event) =>
                setEditEmail(event.target.value)
              }
              required
            />

            {profileNotice && (
              <p role="status">{profileNotice}</p>
            )}

            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {!isEditing && profileNotice && (
          <p className="profile-notice" role="status">
            {profileNotice}
          </p>
        )}

        {/* STORY HIGHLIGHT */}
        <section className="profile-story-section">
          <button className="new-story" type="button">
            <span className="new-story-circle">+</span>
            <span>New</span>
          </button>
        </section>

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
        {activeTab === "posts" && userPosts.length > 0 ? (
          <section className="profile-post-grid">
            {userPosts.map((post) => (
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

            <h2>
              {activeTab === "posts"
                ? "Share Photos"
                : activeTab === "saved"
                  ? "Save"
                  : "Photos of you"}
            </h2>

            <p>
              {activeTab === "posts"
                ? "When you share photos, they will appear on your profile."
                : activeTab === "saved"
                  ? "Posts you save will appear here."
                  : "When people tag you in photos, they will appear here."}
            </p>
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
              followListType === "followers"
                ? "Followers"
                : "Following"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <header className="follow-list-header">
              <h2>
                {followListType === "followers"
                  ? "Followers"
                  : "Following"}
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
              <p className="follow-list-message">
                Loading users...
              </p>
            )}

            {!followListLoading && followListError && (
              <p className="follow-list-message">
                {followListError}
              </p>
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
      <button className="profile-messages" type="button">
        <div className="messages-icon">
          <img src="message-icons.png" alt="Messages" />
        </div>

        <strong>Messages</strong>
        <img src="/profile-icon.png" alt="" />
      </button>

      {/* LOGOUT */}
      <button
        className="logout-button"
        onClick={onLogout}
        type="button"
      >
        Log out
      </button>
    </div>
  );
};

export default Profile;