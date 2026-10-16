const API_BASE_URLS = {
  local: "http://localhost:8000",
  development: "http://10.37.165.45:8000",
  production: "https://instaclone-1-6uxv.onrender.com",
};

// Change this value to switch environments
const CURRENT_ENV = "development";

export const API_BASE_URL = API_BASE_URLS[CURRENT_ENV];

// All backend API endpoints
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,

  UPLOAD_PROFILE_PICTURE: `${API_BASE_URL}/users/me/profile-picture`,

  // User / Profile
  MY_PROFILE: `${API_BASE_URL}/users/me`,
  USER_FOLLOW_STATUS: (userId) =>
    `${API_BASE_URL}/users/${userId}/follow-status`,
  USER_FOLLOW_COUNTS: (userId) =>
    `${API_BASE_URL}/users/${userId}/follow-counts`,
  USER_FOLLOW: (userId) =>
    `${API_BASE_URL}/users/${userId}/follow`,
  USER_SEARCH: (query) =>
    `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
  // Followers and Following lists
  USER_FOLLOWERS: (userId) =>
    `${API_BASE_URL}/users/${userId}/followers`,

  USER_FOLLOWING: (userId) =>
    `${API_BASE_URL}/users/${userId}/following`,

  // Public user profile
  PUBLIC_USER_PROFILE: (userId) =>
    `${API_BASE_URL}/users/${userId}`,

  // Posts
  POSTS: `${API_BASE_URL}/posts/`,
  CREATE_POST: `${API_BASE_URL}/posts/`,
  POST_BY_ID: (postId) =>
    `${API_BASE_URL}/posts/${postId}`,

  // Likes
  POST_LIKE_STATUS: (postId) =>
    `${API_BASE_URL}/posts/${postId}/like-status`,
  POST_LIKE: (postId) =>
    `${API_BASE_URL}/posts/${postId}/like`,

  // Comments
  POST_COMMENTS: (postId) =>
    `${API_BASE_URL}/posts/${postId}/comments`,

  DELETE_COMMENT: (commentId) =>
    `${API_BASE_URL}/posts/comments/${commentId}`,


  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
  NOTIFICATION_UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
  NOTIFICATION_READ: (notificationId) =>
    `${API_BASE_URL}/notifications/${notificationId}/read`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/notifications/read-all`,

  // Direct Messages
  DM_CONVERSATIONS: `${API_BASE_URL}/dm/conversations`,
  DM_START_CONVERSATION: (userId) =>
    `${API_BASE_URL}/dm/conversations/${userId}`,
  DM_MESSAGES: (conversationId) =>
    `${API_BASE_URL}/dm/conversations/${conversationId}/messages`,

};

export default API_BASE_URL;