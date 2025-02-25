import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
  isEnabled: boolean;
  isPushSupported: boolean;
  isSubscribed: boolean;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsPushSupported(true);
      
      // Check if already subscribed
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
        setIsSubscribed(true);
      }
    }
  }, []);

  const toggleNotifications = async () => {
    if (!isPushSupported) {
      toast.error("Push notifications are not supported in your browser");
      return;
    }

    try {
      if (!isEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          
          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
          });

          // Send subscription to backend
          // await fetch('/api/notifications/subscribe', {
          //   method: 'POST',
          //   body: JSON.stringify(subscription),
          // });

          setIsEnabled(true);
          setIsSubscribed(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Permission denied for push notifications");
        }
      } else {
        // Unsubscribe from push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Notify backend
          // await fetch('/api/notifications/unsubscribe', {
          //   method: 'POST',
          //   body: JSON.stringify(subscription),
          // });
        }

        setIsEnabled(false);
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error("Failed to toggle notifications");
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        isEnabled, 
        isPushSupported, 
        isSubscribed, 
        toggleNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 