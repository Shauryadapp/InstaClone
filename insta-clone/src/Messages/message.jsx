import { useEffect, useRef, useState } from "react";
import "./message.css";
import { API_ENDPOINTS } from "../api/api.js";
import Leftside from "../Component/Leftside/leftside";

const getToken = () => localStorage.getItem("access_token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Messages = ({ 
  onHome, 
  onSearch, 
  onMessages, 
  onNotifications, 
  onProfile, 
  onCreateClick 
}) => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const bottomRef = useRef(null);

  // Fetch logged-in user and conversation list.
  const loadConversations = async () => {
    const response = await fetch(API_ENDPOINTS.DM_CONVERSATIONS, {
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not load conversations.");
    }

    setConversations(data);
    return data;
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        const token = getToken();

        if (!token) {
          throw new Error("Please log in to use messages.");
        }

        const [profileResponse, conversationsResponse] = await Promise.all([
          fetch(API_ENDPOINTS.MY_PROFILE, {
            headers: authHeaders(),
          }),
          fetch(API_ENDPOINTS.DM_CONVERSATIONS, {
            headers: authHeaders(),
          }),
        ]);

        const profileData = await profileResponse.json();
        const conversationsData = await conversationsResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.detail || "Could not load your profile.");
        }

        if (!conversationsResponse.ok) {
          throw new Error(
            conversationsData.detail || "Could not load conversations."
          );
        }

        if (!cancelled) {
          setCurrentUser(profileData);
          setConversations(conversationsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not connect to the server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load message history for the selected conversation.
  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowNewMessage(false);
    setMessages([]);
    setError("");
    setLoadingMessages(true);

    try {
      const response = await fetch(
        API_ENDPOINTS.DM_MESSAGES(conversation.id),
        { headers: authHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load messages.");
      }

      setMessages(data);
    } catch (err) {
      setError(err.message || "Could not load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Search users to start a new conversation.
  const handleUserSearch = async (e) => {
    e.preventDefault();

    const query = userQuery.trim();

    if (!query) {
      setUserResults([]);
      return;
    }

    setUserSearchLoading(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.USER_SEARCH(query), {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not search users.");
      }

      setUserResults(
        data.filter((user) => user.id !== currentUser?.id)
      );
    } catch (err) {
      setError(err.message || "Could not search users.");
      setUserResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Create or retrieve an existing conversation.
  const startConversation = async (user) => {
    setError("");

    try {
      const response = await fetch(
        API_ENDPOINTS.DM_START_CONVERSATION(user.id),
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not start conversation.");
      }

      const updatedConversations = await loadConversations();

      const conversation =
        updatedConversations.find((item) => item.id === data.id) || {
          ...data,
          other_user: {
            id: user.id,
            username: user.username,
          },
          latest_message: null,
        };

      setShowNewMessage(false);
      setUserQuery("");
      setUserResults([]);

      await openConversation(conversation);
    } catch (err) {
      setError(err.message || "Could not start conversation.");
    }
  };

  // Send a message.
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const messageText = content.trim();

    if (!messageText || !selectedConversation || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        API_ENDPOINTS.DM_MESSAGES(selectedConversation.id),
        {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: messageText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not send message.");
      }

      setMessages((previous) => [...previous, data]);
      setContent("");

      await loadConversations();
    } catch (err) {
      setError(err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = conversations.filter((chat) =>
    (chat.other_user?.username || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div 
      className="messages-page" 
      style={{ 
        display: "flex", 
        minHeight: "100vh" 
      }}
    >
      {/* STANDARD LEFT SIDEBAR WITH ALL NAVIGATION PROP HANDLERS */}
      <Leftside
        onHome={onHome}
        onSearch={onSearch}
        onMessages={onMessages}
        onNotifications={onNotifications}
        onProfile={onProfile}
        onCreateClick={onCreateClick}
      />

      {/* INBOX PANEL */}
      <section className="messages-inbox">
        <header className="inbox-header">
          <div className="inbox-username">
            <h2>{currentUser?.username || "Messages"}</h2>
            <span></span>
          </div>

          <button
            className="new-message-button"
            title="New message"
            onClick={() => {
              setShowNewMessage((previous) => !previous);
              setUserResults([]);
              setUserQuery("");
              setError("");
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10" />
              <path d="m16 3 5 5L10 19l-5 1 1-5z" />
            </svg>
          </button>
        </header>

        <div className="inbox-search">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showNewMessage && (
          <section className="dm-user-search">
            <h3>New message</h3>

            <form onSubmit={handleUserSearch}>
              <input
                type="search"
                placeholder="Search usernames..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              <button type="submit" disabled={userSearchLoading}>
                {userSearchLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {userResults.map((user) => (
              <button
                type="button"
                className="dm-user-result"
                key={user.id}
                onClick={() => startConversation(user)}
              >
                <span className="dm-avatar">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </span>
                <span>{user.username}</span>
                <span>Message</span>
              </button>
            ))}

            {!userSearchLoading &&
              userQuery.trim() &&
              userResults.length === 0 && (
                <p className="dm-muted">Search for a user to start chatting.</p>
              )}
          </section>
        )}

        <div className="notes-section">
          <div className="your-note">
            <div className="note-bubble">Start a conversation</div>
            <img src="/profile-icon.png" alt="Your profile" />
            <span>Your note</span>
          </div>
        </div>

        <div className="inbox-title">
          <h3>Messages</h3>
        </div>

        <div className="conversation-list">
          {loading && <p className="dm-muted">Loading conversations...</p>}

          {!loading &&
            filteredConversations.map((chat) => (
              <button
                type="button"
                className={`conversation-item ${
                  selectedConversation?.id === chat.id ? "dm-selected" : ""
                }`}
                key={chat.id}
                onClick={() => openConversation(chat)}
              >
                <span className="dm-avatar">
                  {(chat.other_user?.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="conversation-details">
                  <span className="conversation-username">
                    {chat.other_user?.username || "Unknown user"}
                  </span>
                  <span className="last-message">
                    {chat.latest_message?.content || "Start chatting"}
                    {chat.latest_message?.created_at
                      ? ` · ${formatTime(chat.latest_message.created_at)}`
                      : ""}
                  </span>
                </div>
              </button>
            ))}

          {!loading && filteredConversations.length === 0 && (
            <p className="no-conversations">
              {search
                ? "No matching conversations."
                : "No conversations yet. Click the new message icon to start one."}
            </p>
          )}
        </div>
      </section>

      {/* CHAT PANEL */}
      <main className="messages-chat">
        {selectedConversation ? (
          <div className="dm-chat-panel">
            <header className="dm-chat-header">
              <span className="dm-avatar">
                {(
                  selectedConversation.other_user?.username || "U"
                ).charAt(0).toUpperCase()}
              </span>
              <strong>
                {selectedConversation.other_user?.username || "Conversation"}
              </strong>
            </header>

            <div className="dm-message-list">
              {loadingMessages && <p className="dm-muted">Loading messages...</p>}

              {!loadingMessages && messages.length === 0 && (
                <p className="dm-muted">Say hello and start the conversation!</p>
              )}

              {messages.map((message) => {
                const isMine = message.sender_id === currentUser?.id;

                return (
                  <div
                    key={message.id}
                    className={`dm-message-row ${isMine ? "mine" : "theirs"}`}
                  >
                    <div className="dm-message-bubble">
                      <p>{message.content}</p>
                      <small>{formatTime(message.created_at)}</small>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            <form className="dm-send-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        ) : (
          <div className="empty-chat">
            <div className="send-icon-circle">
              <svg viewBox="0 0 48 48">
                <path d="m42 5-14 38-8-17L3 18z" />
                <path d="m20 26 12-12" />
              </svg>
            </div>

            <h2>Your messages</h2>
            <p>Select a conversation or start a new one.</p>

            <button
              className="send-message-button"
              onClick={() => setShowNewMessage(true)}
            >
              Send message
            </button>
          </div>
        )}
      </main>

      {error && (
        <div className="dm-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}
    </div>
  );
};

export default Messages;