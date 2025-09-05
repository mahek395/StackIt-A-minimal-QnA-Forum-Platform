import React, { useEffect, useState } from 'react';
import { LogOut, UserCircle2, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import useNotifications from './useNotifications';

export default function Navbar({ isLoggedIn, loading, user, showLogout, setShowLogout, handleLogout }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const token = localStorage.getItem('token');
  const { notifications, unreadCount, loading: notifLoading, markAllAsRead } = useNotifications(token);

  // Debug logging - remove in production
  useEffect(() => {
    console.log('Navbar state:', { isLoggedIn, loading, user, showLogout });
  }, [isLoggedIn, loading, user, showLogout]);

  const getUserDisplayName = (user) => {
    if (!user) return 'Guest';
    
    // Priority: firstName and lastName
    if (user.firstName || user.lastName) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName || 'User';
    }
    
    // Fallback options if firstName/lastName not available
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    
    return 'User';
  };

  const handleSignInClick = () => {
    navigate('/login');
  };

  const toggleLogoutDropdown = () => {
    setShowLogout(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLogout && !event.target.closest('.user-dropdown')) {
        setShowLogout(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogout, setShowLogout]);

  return (
    <nav className="w-full bg-white shadow-sm border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-7 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 absolute left-0">
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              StackIt
            </span>
            <span className="text-blue-500 text-2xl font-semibold hidden sm:block animate-pulse">⚡</span>
          </Link>

          {/* Home Link */}
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition duration-200">
            Home
          </Link>

          {/* Right Side - Auth Section */}
          <div className="flex items-center space-x-4 absolute right-0">
            {/* Notification Bell */}
            {isLoggedIn && user && (
              <div className="relative">
                <button
                  className="relative p-2 rounded-full hover:bg-blue-50 transition-all duration-200 focus:outline-none"
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    if (!showNotifications && unreadCount > 0) markAllAsRead();
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="w-7 h-7 text-blue-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-30 origin-top-right animate-scale-in-top">
                    <div className="px-4 py-2 border-b text-gray-700 font-semibold">Notifications</div>
                    {notifLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div key={notif._id} className={`px-4 py-2 text-sm border-b last:border-b-0 ${notif.read ? 'bg-white' : 'bg-blue-50'}`}>
                          <span className="block text-gray-800">{notif.message}</span>
                          {notif.link && (
                            <Link to={notif.link} className="text-blue-600 hover:underline text-xs">View</Link>
                          )}
                          <span className="block text-gray-400 text-xs mt-1">{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {loading ? (
              <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : isLoggedIn && user ? (
              // User is logged in - show profile dropdown
              <div className="relative user-dropdown">
                <div
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-blue-50 transition-all duration-200"
                  onClick={toggleLogoutDropdown}
                >
                  <UserCircle2 className="w-8 h-8 text-blue-700" />
                  <span className="text-gray-800 font-medium text-base hidden sm:block">
                    {getUserDisplayName(user)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-blue-600 transition-transform duration-200 transform ${
                      showLogout ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>

                {/* Logout Dropdown Menu */}
                {showLogout && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-20 origin-top-right animate-scale-in-top">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 transition duration-200 ease-in-out text-base font-medium"
                    >
                      <LogOut size={18} className="text-red-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // User is not logged in - show login button
              <button
                onClick={handleSignInClick}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-medium transition duration-300 shadow-md
                           border border-transparent hover:border-blue-600 hover:text-blue-700 hover:shadow-xl hover:-translate-y-1 text-base"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}