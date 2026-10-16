import { useEffect, useState } from "react";
import "./notifications.css";
import { API_BASE_URL } from "../api/api.js";
import Leftside from "../Component/Leftside/leftside.jsx";

const Notifications = ({
  onHome,
  onSearch,
  onMessages,
  onNotifications,
  onProfile,
  onCreateClick,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load notifications");
        }

        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark notification as read");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark notifications as read");
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="notifications-layout-wrapper" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* LEFT SIDEBAR */}
      <Leftside
        onHome={onHome}
        onSearch={onSearch}
        onMessages={onMessages}
        onNotifications={onNotifications}
        onProfile={onProfile}
        onCreateClick={onCreateClick}
      />

      {/* NOTIFICATIONS MAIN CONTENT */}
      <div 
        className="notifications-main-container" 
        style={{ 
          marginLeft: "100px", 
          width: "calc(100% - 100px)", 
          display: "flex", 
          justifyContent: "center",
          padding: "20px" 
        }}
      >
        <main className="notifications-page" style={{ width: "100%", maxWidth: "700px" }}>
          <header className="notifications-header">
            <h2>Notifications</h2>

            {notifications.some((item) => !item.is_read) && (
              <button onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </header>

          {loading && <p className="notifications-status">Loading notifications...</p>}
          {error && <p className="notifications-error">{error}</p>}

          {!loading && notifications.length === 0 ? (
            <p className="notifications-empty">You're all caught up!</p>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read ? "read" : "unread"
                  }`}
                >
                  <div className="notification-avatar">
                    {notification.type === "like"
                      ? "♥"
                      : notification.type === "comment"
                      ? "💬"
                      : "👤"}
                  </div>

                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                  </div>

                  {!notification.is_read && (
                    <button
                      className="notification-read-button"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark read
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;