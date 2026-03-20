import React, { useState, useEffect } from 'react';
import NotificationService, { Notification } from '../services/NotificationService';
import './NotificationBell.css';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Update unread count
    const updateCount = () => {
      setUnreadCount(NotificationService.getUnreadCount());
      setRecentNotifications(NotificationService.getNotifications().slice(0, 3));
    };

    updateCount();

    // Subscribe to notification events
    NotificationService.on('notification', updateCount);
    NotificationService.on('notificationRead', updateCount);
    NotificationService.on('allRead', updateCount);

    return () => {
      NotificationService.off('notification', updateCount);
      NotificationService.off('notificationRead', updateCount);
      NotificationService.off('allRead', updateCount);
    };
  }, []);

  const handleBellClick = () => {
    setShowPreview(!showPreview);
  };

  const handleNotificationClick = (notification: Notification) => {
    NotificationService.markAsRead(notification.id);
    onNotificationClick?.(notification);
    setShowPreview(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return (
          <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'comment':
        return (
          <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'assignment':
        return (
          <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={handleBellClick}
        title={`${unreadCount} unread notifications`}
      >
        <svg className="bell-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {showPreview && (
        <div className="notification-preview">
          <div className="preview-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read"
                onClick={() => {
                  NotificationService.markAllAsRead();
                  setUnreadCount(0);
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="preview-content">
            {recentNotifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {recentNotifications.length > 0 && (
            <div className="preview-footer">
              <button className="view-all-button">View All Notifications</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
