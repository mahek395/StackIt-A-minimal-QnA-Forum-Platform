import { useState, useEffect } from "react";

export default function useNotifications(token) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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

  // Fetch on mount and when token changes
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [token]);

  // Mark all as read
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      fetch(`http://localhost:5000/api/notifications/${n._id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      })
    ));
    fetchNotifications();
  };

  return { notifications, unreadCount, loading, error, fetchNotifications, markAllAsRead };
}
