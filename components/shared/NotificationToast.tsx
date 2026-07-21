import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

export type NotificationType = "success" | "error";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = React.createContext<
  NotificationContextType | undefined
>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 4000,
    };

    // Clear previous notifications and add new one
    setNotifications([newNotification]);

    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4 max-w-md mx-auto">
        {notifications.map((notification) => (
          <NotificationToastItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

interface NotificationToastItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationToastItem: React.FC<NotificationToastItemProps> = ({
  notification,
  onRemove,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    // Trigger entering animation on mount
    setIsEntering(true);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const isSuccess = notification.type === "success";
  const Icon = isSuccess ? Check : X;
  const bgColor = isSuccess ? "bg-[#12B76A]" : "bg-[#F04438]";
  return (
    <div
      className={`
                pointer-events-auto
  bg-white
  border rounded-[16px] p-3
  flex items-center gap-3
  transform transition-all duration-500 ease-out
  shadow-[0px_2px_12px_0px_rgba(0,0,0,0.08)]
  ${
    isExiting
      ? "-translate-y-[150%] opacity-0"
      : isEntering
        ? "translate-y-0 opacity-100"
        : "-translate-y-[150%] opacity-0"
  }
`}
    >
      <div className={`${bgColor} rounded-full p-1`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-primary-primary body-subtitle-semibold`}>
          {notification.title}
        </h3>
        {notification.message && (
          <p className={`text-primary-secondary body-body-regular`}>
            {notification.message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};
