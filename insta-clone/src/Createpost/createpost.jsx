
import { useRef, useState } from "react";
import "./createpost.css";
import { API_ENDPOINTS } from "../api/api.js";

const CreatePost = ({ onClose, onPostCreated }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please select an image or video.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    onClose();
  };

  const handleNext = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("caption", caption);

    try {
      setUploading(true);


      const response = await fetch(API_ENDPOINTS.CREATE_POST, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create post."
        );
      }
      onPostCreated();
      alert("Post created successfully!");
      onClose();
    } catch (error) {
      console.error("Post upload error:", error);
      alert(error.message || "Could not connect to the backend.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="createpost-overlay" onClick={handleClose}>
      <button
        className="createpost-close"
        onClick={handleClose}
        aria-label="Close"
      >

      </button>

      <div
        className={`createpost-modal ${selectedFile ? "has-preview" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="createpost-header">
          <h2>Create new post</h2>

          {selectedFile && (
            <button
              className="createpost-next"
              onClick={handleNext}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Share"}
            </button>
          )}
        </div>

        <div
          className={`createpost-content ${selectedFile ? "selected" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <div className="createpost-empty">
              <svg
                width="110"
                height="90"
                viewBox="0 0 110 90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="9" y="12" width="61" height="60" rx="10"
                  transform="rotate(-3 9 12)" />
                <circle cx="28" cy="28" r="4" />
                <path d="M14 60 L29 44 L41 54 L52 43" />
                <rect x="51" y="28" width="60" height="60" rx="11"
                  transform="rotate(5 51 28)" fill="white" />
                <path d="M72 43 Q69 41 69 47 L68 67 Q68 72 73 69 L91 59 Q96 56 91 53 Z"
                  fill="white" />
              </svg>

              <p>Drag photos and videos here</p>

              <button
                className="select-media-btn"
                onClick={() => fileInputRef.current.click()}
              >
                Select from computer
              </button>
            </div>
          ) : (
            <div className="createpost-preview">
              {selectedFile.type.startsWith("video/") ? (
                <video src={preview} controls />
              ) : (
                <img src={preview} alt="Selected media preview" />
              )}

              <button
                className="change-media-btn"
                onClick={() => fileInputRef.current.click()}
              >
                Change media
              </button>

              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
