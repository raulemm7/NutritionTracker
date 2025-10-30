import React, { useEffect, useState } from "react";
import { IonToast, IonBadge } from "@ionic/react";
import { io } from "socket.io-client";
import { useNetworkStatus } from "../services/networkStatus.jsx";
import apiService from "../services/api";

export default function Notifications() {
  const { isOnline } = useNetworkStatus();
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
    type: "info",
  });
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    const handleNotification = (data) => {
      setNotification({
        isOpen: true,
        message: `${data.title}: ${data.message}`,
        type: data.type || "info",
      });
    };

    newSocket.on("notification", handleNotification);

    return () => {
      newSocket.off("notification", handleNotification);
      newSocket.disconnect();
    };
  }, []);

  // Monitor online/offline status changes
  useEffect(() => {
    if (!isOnline) {
      setNotification({
        isOpen: true,
        message: "You are offline. Changes will be saved locally.",
        type: "warning",
      });
    } else {
      const pending = apiService.getPendingOperationsCount();
      if (pending > 0) {
        setNotification({
          isOpen: true,
          message: `Back online. Syncing ${pending} pending changes...`,
          type: "info",
        });
        apiService.processPendingOperations().then((results) => {
          const failed = results.filter((r) => !r.success).length;
          if (failed > 0) {
            setNotification({
              isOpen: true,
              message: `Sync completed with ${failed} errors`,
              type: "warning",
            });
          } else {
            setNotification({
              isOpen: true,
              message: "All changes synced successfully",
              type: "success",
            });
          }
        });
      } else {
        setNotification({
          isOpen: true,
          message: "Back online",
          type: "success",
        });
      }
    }
  }, [isOnline]);

  // Monitor pending operations
  useEffect(() => {
    const checkPending = () => {
      const count = apiService.getPendingOperationsCount();
      setPendingOperations(count);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {!isOnline && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "#f4f5f8",
            padding: "4px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <IonBadge color="warning">Offline</IonBadge>
          {pendingOperations > 0 && (
            <IonBadge color="primary" style={{ marginLeft: "8px" }}>
              {pendingOperations} pending
            </IonBadge>
          )}
        </div>
      )}
      <IonToast
        isOpen={notification.isOpen}
        onDidDismiss={() =>
          setNotification({ isOpen: false, message: "", type: "info" })
        }
        message={notification.message}
        duration={3000}
        position="top"
        color={
          notification.type === "success"
            ? "success"
            : notification.type === "warning"
              ? "warning"
              : notification.type === "error"
                ? "danger"
                : "primary"
        }
      />
    </>
  );
}
