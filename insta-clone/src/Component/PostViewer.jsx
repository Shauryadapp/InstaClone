import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../api/api.js";
import "./postviewer.css";


const PostViewer = ({ post, onClose }) => {
  const [postDetails, setPostDetails] = useState(post);
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(
    post.likes_count ?? 0
  );
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      try {
        // Load the latest version of the post.
        const postResponse = await fetch(
          API_ENDPOINTS.POST_BY_ID(post.id)
        );

        const postData = await postResponse.json();

        if (!postResponse.ok) {
          throw new Error(
            postData.detail || "Could not load this post."
          );
        }

        if (cancelled) return;

        setPostDetails({
          ...post,
          ...postData,
          username: postData.username || post.username,
        });

        // Load comments and like status independently.
        const requests = [
          fetch(API_ENDPOINTS.POST_COMMENTS(post.id)),
          token
            ? fetch(API_ENDPOINTS.POST_LIKE_STATUS(post.id), {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
            : Promise.resolve(null),
        ];

        const [commentsResult, likeResult] = await Promise.allSettled(
          requests
        );

        if (cancelled) return;

        if (
          commentsResult.status === "fulfilled" &&
          commentsResult.value.ok
        ) {
          setComments(await commentsResult.value.json());
        }

        if (
          likeResult.status === "fulfilled" &&
          likeResult.value?.ok
        ) {
          const likeData = await likeResult.value.json();

          setLiked(likeData.liked);
          setLikesCount(likeData.likes_count);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Post viewer error:", err);
          setError(err.message || "Could not load this post.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [post, post.id]);

  // Like / Unlike

<button
  type="button"
  className="public-profile-post"
  key={post.id}
  onClick={() => setSelectedPost(post)}
  title={post.caption || "Open post"}
>
  <img
    src={post.image_url}
    alt={post.caption || "User post"}
    loading="lazy"
  />

  {post.caption && (
    <div className="public-post-caption">
      {post.caption}
    </div>
  )}
</button>




{selectedPost && (
  <PostViewer
    post={selectedPost}
    onClose={() => setSelectedPost(null)}
  />
)}




const handleToggleLike = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("Please log in to like posts.");
    return;
  }

  const wasLiked = liked;
  const method = wasLiked ? "DELETE" : "POST";

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not update like.");
    }

    setLiked(!wasLiked);
    setLikesCount(data.likes_count);
  } catch (err) {
    console.error("Like error:", err);
    alert(err.message || "Could not update like.");
  }
};

  return (
    <div
      className="post-viewer-overlay"
      onClick={onClose}
    >
      <button
        type="button"
        className="post-viewer-close"
        onClick={onClose}
        aria-label="Close post"
      >
        ×
      </button>

      <section
        className="post-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Post details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="post-viewer-image">
          <img
            src={postDetails.image_url}
            alt={postDetails.caption || "Post image"}
          />
        </div>

        <div className="post-viewer-details">
          <header className="post-viewer-header">
            <strong>
              {postDetails.username ||
                `User ${postDetails.user_id}`}
            </strong>
          </header>

          {loading && <p>Loading post details...</p>}
          {error && <p className="post-viewer-error">{error}</p>}

          {!loading && !error && (
            <>
              <div className="post-viewer-caption">
                <strong>
                  {postDetails.username ||
                    `User ${postDetails.user_id}`}
                </strong>{" "}
                {postDetails.caption || ""}
              </div>

              <div className="post-viewer-comments">
                {comments.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <p key={comment.id}>
                      <strong>{comment.username} </strong>
                      {comment.content}
                    </p>
                  ))
                )}
              </div>

              <div className="post-viewer-actions">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  aria-label={liked ? "Unlike post" : "Like post"}
                >
                  {liked ? "♥" : "♡"}
                </button>

                <strong>{likesCount} likes</strong>
              </div>

              <p className="post-viewer-date">
                {postDetails.created_at
                  ? new Date(
                      postDetails.created_at
                    ).toLocaleDateString()
                  : ""}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PostViewer;