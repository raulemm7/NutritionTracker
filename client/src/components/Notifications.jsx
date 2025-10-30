import React, { useEffect, useState, useRef } from "react";
import {
  IonToast,
  IonBadge,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import { io } from "socket.io-client";
import { useNetworkStatus } from "../services/networkStatus.jsx";
import apiService from "../services/api";

// Notifications page: connects to socket, shows toasts and list, watches online/offline
export default function Notifications() {
  const { isOnline } = useNetworkStatus();
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState({ isOpen: false, message: "", type: "info" });
  const [pendingOperations, setPendingOperations] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const pendingIntervalRef = useRef(null);

  // Socket setup
  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    const handleNotification = (data) => {
      if (!data) return;
      const message = data.title ? `${data.title}: ${data.message || ""}` : data.message || "";
      setNotification({ isOpen: true, message, type: data.type || "info" });
    };

    newSocket.on("notification", handleNotification);

    return () => {
      try {
        newSocket.off("notification", handleNotification);
        newSocket.disconnect();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // When a notification toast opens, add it to the list for persistent display
  useEffect(() => {
    if (notification.isOpen && notification.message) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: notification.message,
          type: notification.type,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  }, [notification.isOpen, notification.message, notification.type]);

  // Watch online status and trigger pending sync when back online
  useEffect(() => {
    const runSyncIfNeeded = async () => {
      try {
        const pending = await apiService.getPendingOperationsCount();
        setPendingOperations(pending || 0);

        if (isOnline && pending > 0) {
          setNotification({ isOpen: true, message: `Back online. Syncing ${pending} pending changes...`, type: "info" });
          const results = await apiService.processPendingOperations();
          const failed = Array.isArray(results) ? results.filter((r) => !r.success).length : 0;
          if (failed > 0) {
            setNotification({ isOpen: true, message: `Sync completed with ${failed} errors`, type: "warning" });
          } else {
            setNotification({ isOpen: true, message: "All changes synced successfully", type: "success" });
          }
          // refresh pending count
          const remaining = await apiService.getPendingOperationsCount();
          setPendingOperations(remaining || 0);
        } else if (!isOnline) {
          setNotification({ isOpen: true, message: "You are offline. Changes will be saved locally.", type: "warning" });
        } else if (isOnline) {
          setNotification({ isOpen: true, message: "Back online", type: "success" });
        }
      } catch (err) {
        console.error("Notification sync error:", err);
      }
    };

    runSyncIfNeeded();
  }, [isOnline]);

  // Poll pending operations periodically
  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await apiService.getPendingOperationsCount();
        setPendingOperations(count || 0);
      } catch (e) {
        // ignore
      }
    };

    checkPending();
    pendingIntervalRef.current = setInterval(checkPending, 5000);
    return () => clearInterval(pendingIntervalRef.current);
  }, []);

  // Helper to get color based on type
  const toastColor = (type) => (type === "success" ? "success" : type === "warning" ? "warning" : type === "error" ? "danger" : "primary");

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding-bottom">
        <div style={{ padding: 16 }}>
          <h1>Notifications</h1>

          {/* Offline status banner */}
          {!isOnline ? (
            <div style={{ background: "#fff7e6", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ffdb4d" }}>
              <IonBadge color="warning">Offline</IonBadge>
              {pendingOperations > 0 && (
                <IonBadge color="primary" style={{ marginLeft: 8 }}>{pendingOperations} pending</IonBadge>
              )}
            </div>
          ) : (
            pendingOperations > 0 && (
              <div style={{ background: "#e8f8f2", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #c6f6d9" }}>
                <IonBadge color="primary">Pending</IonBadge>
                <span style={{ marginLeft: 8 }}>{pendingOperations} pending operations</span>
              </div>
            )
          )}

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#666", background: "#f5f5f5", borderRadius: 8 }}>No notifications</div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div key={notif.id} style={{ padding: 12, marginBottom: 8, background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <IonBadge color={notif.type === "success" ? "success" : notif.type === "warning" ? "warning" : notif.type === "error" ? "danger" : "primary"} style={{ marginRight: 8 }}>{notif.type}</IonBadge>
                    <span>{notif.message}</span>
                  </div>
                  <small style={{ color: "#999" }}>{notif.timestamp}</small>
                </div>
              ))}
            </div>
          )}

          {/* Toast for incoming notifications */}
          <IonToast isOpen={notification.isOpen} message={notification.message} duration={3000} position="top" color={toastColor(notification.type)} onDidDismiss={() => setNotification({ isOpen: false, message: "", type: "info" })} />
        </div>
      </IonContent>
    </>
  );
}
