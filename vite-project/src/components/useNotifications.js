import { useState, useEffect } from "react";

export default function useNotifications(isLoggedIn) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://stackit-a-minimal-qna-forum-platform-production.up.railway.app/api/notifications", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      setError(err.message || "Error fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      fetch(`https://stackit-a-minimal-qna-forum-platform-production.up.railway.app/api/notifications/${n._id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
    ));
    fetchNotifications();
  };

  return { notifications, unreadCount, loading, error, fetchNotifications, markAllAsRead };
}