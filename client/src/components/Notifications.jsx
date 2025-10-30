import React, { useEffect, useState } from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBadge,
} from "@ionic/react";
import {
  informationCircle,
  checkmarkCircle,
  warningOutline,
  notifications as notifyIcon,
} from "ionicons/icons";
import { getSocket } from "../utils/socket";

const getIconForType = (type) => {
  switch (type) {
    case "notification":
      return warningOutline;
    case "new-log":
      return checkmarkCircle;
    case "welcome":
      return notifyIcon;
    case "date-change":
      return informationCircle;
    default:
      return informationCircle;
  }
};

export default function Notifications() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("connect", () =>
      setEvents((e) => [
        {
          type: "system",
          message: "Connected to server",
          timestamp: new Date().toISOString(),
        },
        ...e,
      ]),
    );
    socket.on("welcome", (p) =>
      setEvents((e) => [
        {
          type: "welcome",
          message: p.message,
          timestamp: new Date().toISOString(),
        },
        ...e,
      ]),
    );
    socket.on("notification", (p) =>
      setEvents((e) => [
        {
          type: "notification",
          ...p,
          timestamp: new Date().toISOString(),
        },
        ...e,
      ]),
    );
    socket.on("new-log", (p) =>
      setEvents((e) => [
        {
          type: "new-log",
          message: `New log: ${p.name} (${p.calories} kcal)`,
          timestamp: new Date().toISOString(),
        },
        ...e,
      ]),
    );
    socket.on("userDateChanged", (data) =>
      setEvents((e) => [
        {
          type: "date-change",
          message: `An user changed date to ${data.date}`,
          timestamp: new Date().toISOString(),
        },
        ...e,
      ]),
    );

    return () => socket.disconnect();
  }, []);

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {events.length === 0 ? (
          <div className="ion-padding ion-text-center">
            <IonNote>No notifications yet</IonNote>
          </div>
        ) : (
          <IonList>
            {events.map((ev, idx) => (
              <IonItem key={idx}>
                <IonIcon
                  icon={getIconForType(ev.type)}
                  slot="start"
                  color={ev.type === "notification" ? "warning" : "primary"}
                />
                <IonLabel>
                  {ev.message || ev.title}
                  <p>{new Date(ev.timestamp).toLocaleTimeString()}</p>
                </IonLabel>
                <IonBadge
                  color={ev.type === "notification" ? "warning" : "primary"}
                  slot="end"
                >
                  {ev.type}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </>
  );
}
