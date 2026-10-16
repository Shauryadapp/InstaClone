import { useEffect, useState } from "react";
import "./middle.css";
import { API_ENDPOINTS } from "../../api/api.js";

const Middle = ({ refreshTrigger, onUserClick }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  // Edit/Delete post state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Follow state
  const [followLoadingId, setFollowLoadingId] = useState(null);

  // Current user and comment deletion state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // =====================================
  // FETCH CURRENT LOGGED-IN USER
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setCurrentUserId(null);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.MY_PROFILE, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not identify current user."
          );
        }

        if (!cancelled) {
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error("Could not fetch current user:", err);

        if (!cancelled) {
          setCurrentUserId(null);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================
  // FETCH POSTS, LIKES, COMMENTS, FOLLOWS
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_ENDPOINTS.POSTS);

        if (!response.ok) {
          throw new Error("Could not load posts.");
        }

        const data = await response.json();
        const token = localStorage.getItem("access_token");

        const postsWithDetails = await Promise.all(
          data.map(async (post) => {
            let liked = false;
            let likes_count = 0;
            let comments = [];
            let is_following = false;
            let followers_count = 0;

            // Fetch like status
            if (token) {
              try {
                const likeResponse = await fetch(
                  API_ENDPOINTS.POST_LIKE_STATUS(post.id),
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (likeResponse.ok) {
                  const likeStatus = await likeResponse.json();
                  liked = likeStatus.liked;
                  likes_count = likeStatus.likes_count;
                }
              } catch (err) {
                console.error("Could not fetch like status:", err);
              }
            }

            // Fetch comments
            try {
              const commentsResponse = await fetch(
                API_ENDPOINTS.POST_COMMENTS(post.id)
              );

              if (commentsResponse.ok) {
                comments = await commentsResponse.json();
              }
            } catch (err) {
              console.error("Could not fetch comments:", err);
            }

            // Fetch follow status
            if (token) {
              try {
                const followResponse = await fetch(
                  API_ENDPOINTS.USER_FOLLOW_STATUS(post.user_id),
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (followResponse.ok) {
                  const followData = await followResponse.json();
                  is_following = followData.is_following;
                }
              } catch (err) {
                console.error("Could not fetch follow status:", err);
              }
            }

            // Fetch author's follower count
            try {
              const countsResponse = await fetch(
                API_ENDPOINTS.USER_FOLLOW_COUNTS(post.user_id)
              );

              if (countsResponse.ok) {
                const countsData = await countsResponse.json();
                followers_count = countsData.followers_count;
              }
            } catch (err) {
              console.error("Could not fetch follower counts:", err);
            }

            return {
              ...post,
              liked,
              likes_count,
              comments,
              is_following,
              followers_count,
            };
          })
        );

        if (!cancelled) {
          setPosts(postsWithDetails);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);

        if (!cancelled) {
          setError("Unable to load posts. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  // =====================================
  // LIKE / UNLIKE
  // =====================================

  const handleToggleLike = async (post) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in to like posts.");
      return;
    }

    const method = post.liked ? "DELETE" : "POST";

    try {
      const response = await fetch(
        API_ENDPOINTS.POST_LIKE(post.id),
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to update like."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                liked: method === "POST",
                likes_count: result.likes_count,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Like error:", err);
      alert(err.message || "Could not update like.");
    }
  };

  // =====================================
  // ADD COMMENT
  // =====================================

  const handleAddComment = async (post) => {
    const token = localStorage.getItem("access_token");
    const content = (commentDrafts[post.id] || "").trim();

    if (!token) {
      alert("Please log in to comment.");
      return;
    }

    if (!content) {
      alert("Please write a comment first.");
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.POST_COMMENTS(post.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not add comment."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                comments: [...(item.comments || []), data],
              }
            : item
        )
      );

      setCommentDrafts((previous) => ({
        ...previous,
        [post.id]: "",
      }));
    } catch (err) {
      console.error("Comment error:", err);
      alert(err.message || "Could not add comment.");
    }
  };

  // =====================================
  // DELETE YOUR OWN COMMENT
  // =====================================

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      setDeletingCommentId(commentId);

      const response = await fetch(
        API_ENDPOINTS.DELETE_COMMENT(commentId),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not delete comment."
        );
      }

      // Remove deleted comment from the feed immediately
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: (post.comments || []).filter(
                  (comment) => comment.id !== commentId
                ),
              }
            : post
        )
      );
    } catch (err) {
      console.error("Delete comment error:", err);
      alert(err.message || "Could not delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  // =====================================
  // START EDITING CAPTION
  // =====================================

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption || "");
    setOpenMenuPostId(null);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditCaption("");
  };

  // =====================================
  // SAVE EDITED CAPTION
  // =====================================

  const handleSaveEdit = async (e, post) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in again.");
      return;
    }

    const updatedCaption = editCaption.trim();

    try {
      setActionLoadingId(post.id);

      const response = await fetch(
        API_ENDPOINTS.POST_BY_ID(post.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            caption: updatedCaption || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not update post."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                caption: data.caption ?? null,
              }
            : item
        )
      );

      setEditingPostId(null);
      setEditCaption("");
      setOpenMenuPostId(null);
    } catch (err) {
      console.error("Edit post error:", err);
      alert(err.message || "Could not update the caption.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =====================================
  // DELETE POST
  // =====================================

  const handleDeletePost = async (post) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This cannot be undone."
    );

    if (!confirmed) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in again.");
      return;
    }

    try {
      setActionLoadingId(post.id);

      const response = await fetch(
        API_ENDPOINTS.POST_BY_ID(post.id),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not delete post."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.filter((item) => item.id !== post.id)
      );

      setOpenMenuPostId(null);

      if (editingPostId === post.id) {
        setEditingPostId(null);
        setEditCaption("");
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert(err.message || "Could not delete post.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =====================================
  // FOLLOW / UNFOLLOW
  // =====================================

  const handleToggleFollow = async (post) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in to follow users.");
      return;
    }

    const method = post.is_following ? "DELETE" : "POST";

    try {
      setFollowLoadingId(post.user_id);

      const response = await fetch(
        API_ENDPOINTS.USER_FOLLOW(post.user_id),
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not update follow status."
        );
      }

      const isFollowing = method === "POST";

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.user_id === post.user_id
            ? {
                ...item,
                is_following: isFollowing,
                followers_count:
                  data.followers_count ?? item.followers_count,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Follow error:", err);
      alert(err.message || "Could not update follow status.");
    } finally {
      setFollowLoadingId(null);
    }
  };

  // =====================================
  // HOME FEED UI
  // =====================================

  return (
    <div className="middle">

      {/* STORIES */}
      <div className="stories">
        <div className="story">
          <img src="utkarsh.png" alt="story" />
          <p>Your story</p>
        </div>

        <div className="story">
          <img src="atul-image-1.jpeg" alt="story" />
          <p>atulkumar12</p>
        </div>

        <div className="story">
          <img src="atul-image-1.jpeg" alt="story" />
          <p>Shaurya</p>
        </div>

        <div className="story">
          <img src="atul-image-1.jpeg" alt="story" />
          <p>harsh</p>
        </div>
      </div>

      {loading && <p>Loading posts...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p>No posts yet. Create the first post!</p>
      )}

      {!loading &&
        !error &&
        posts.map((post) => {
          const isOwner =
            currentUserId !== null &&
            String(currentUserId) === String(post.user_id);

          return (
            <div className="post" key={post.id}>

              {/* POST HEADER */}
              <div className="post-header">
                <div className="post-user">
                  <img src="utkarsh.png" alt="profile" />

                  <div>
                    <button
                      type="button"
                      className="post-username-link"
                      onClick={() => onUserClick?.(post.user_id)}
                    >
                      {post.username || `User ${post.user_id}`}
                    </button>

                    <span>
                      {" "}•{" "}
                      {post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>

                {!isOwner && (
                  <button
                    className="follow-button"
                    type="button"
                    onClick={() => handleToggleFollow(post)}
                    disabled={followLoadingId === post.user_id}
                  >
                    {followLoadingId === post.user_id
                      ? "Please wait..."
                      : post.is_following
                      ? "Following"
                      : "Follow"}
                  </button>
                )}

                {/* OWNER OPTIONS */}
                {isOwner && (
                  <div style={{ position: "relative", border: "none" }}>
                    <button
                      type="button"
                      className="three-dot"
                      aria-label="Post options"
                      title="Post options"
                      onClick={() =>
                        setOpenMenuPostId(
                          openMenuPostId === post.id ? null : post.id
                        )
                      }
                    >
                      <img src="three-icon.png" alt="" />
                    </button>

                    {openMenuPostId === post.id && (
                      <div
                        className="post-menu"
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          zIndex: 10,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          minWidth: "130px",
                          padding: "8px",
                          background: "#ffffff",
                          border: "1px solid #dddddd",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleStartEdit(post)}
                          disabled={actionLoadingId === post.id}
                        >
                          Edit caption
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post)}
                          disabled={actionLoadingId === post.id}
                        >
                          Delete post
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isOwner && (
                  <div className="three-dot">
                    <img src="three-icon.png" alt="More options" />
                  </div>
                )}
              </div>

              {/* POST IMAGE */}
              <div className="post-image">
                <img
                  src={post.image_url}
                  alt={post.caption || "Post image"}
                />
              </div>

              {/* POST ACTIONS */}
              <div className="post-actions">
                <div className="left-actions">

                  <button
                    type="button"
                    onClick={() => handleToggleLike(post)}
                    aria-label={post.liked ? "Unlike post" : "Like post"}
                    title={post.liked ? "Unlike post" : "Like post"}
                  >
                    <img src="like-icon.png" alt="" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(`comment-input-${post.id}`)
                        ?.focus()
                    }
                    aria-label="Write a comment"
                    title="Write a comment"
                  >
                    <img src="comment-icon.png" alt="" />
                  </button>

                  <button type="button">
                    <img src="repost-icon.png" alt="Repost" />
                  </button>

                  <button type="button">
                    <img src="share-icon.png" alt="Share" />
                  </button>
                </div>

                <button type="button">
                  <img src="save-icon.png" alt="Save" />
                </button>
              </div>

              {/* LIKE COUNT */}
              <div className="post-likes">
                {post.likes_count ?? 0} likes
              </div>

              {/* CAPTION EDITOR OR DISPLAY */}
              {editingPostId === post.id ? (
                <form
                  className="caption-edit-form"
                  onSubmit={(e) => handleSaveEdit(e, post)}
                  style={{ padding: "8px" }}
                >
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Write a caption..."
                    maxLength={2200}
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "6px",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={actionLoadingId === post.id}
                    >
                      {actionLoadingId === post.id
                        ? "Saving..."
                        : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={actionLoadingId === post.id}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                post.caption && (
                  <div className="caption">
                    <button
                      type="button"
                      className="post-username-link"
                      onClick={() => onUserClick?.(post.user_id)}
                    >
                      {post.username || `User ${post.user_id}`}
                    </button>{" "}
                    <span>{post.caption}</span>
                  </div>
                )
              )}

              {/* COMMENTS SECTION */}
              <div 
                className="comments" 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "8px",
                  alignItems: "stretch"
                }}
              >
                {post.comments?.length > 0 ? (
                  post.comments.map((comment) => {
                    const isCommentOwner =
                      currentUserId !== null &&
                      String(currentUserId) === String(comment.user_id);

                    return (
                      <p key={comment.id} style={{ margin: 0, textAlign: "left" }}>
                        <strong>{comment.username} </strong>
                        {comment.content}

                        {isCommentOwner && (
                          <button
                            type="button"
                            className="delete-comment-button"
                            disabled={deletingCommentId === comment.id}
                            onClick={() =>
                              handleDeleteComment(post.id, comment.id)
                            }
                            style={{ marginLeft: "8px" }}
                          >
                            {deletingCommentId === comment.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </p>
                    );
                  })
                ) : (
                  <p style={{ margin: 0, textAlign: "left", color: "#8e8e8e" }}>
                    No comments yet
                  </p>
                )}

                {/* ADD COMMENT FORM */}
                <form
                  className="comment-form"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    marginTop: "4px"
                  }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddComment(post);
                  }}
                >
                  <input
                    id={`comment-input-${post.id}`}
                    type="text"
                    placeholder="Add a comment..."
                    style={{ flex: 1, paddingLeft: 0 }}
                    value={commentDrafts[post.id] || ""}
                    onChange={(e) =>
                      setCommentDrafts((previous) => ({
                        ...previous,
                        [post.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="submit"
                    disabled={!(commentDrafts[post.id] || "").trim()}
                  >
                    Post
                  </button>
                </form>
              </div>

            </div>
          );
        })}
    </div>
  );
};

export default Middle;