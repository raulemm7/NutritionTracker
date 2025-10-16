import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSkeletonText,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonToast,
} from "@ionic/react";
import axios from "axios";
import { io } from "socket.io-client";

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    const handleUserDateChanged = (data) => {
      // Verifică dacă notificarea este de la alt user (nu de la tine)
      if (data.userId !== newSocket.id) {
        setNotification({
          isOpen: true,
          message: `Another user is viewing meals for ${data.date}`,
        });
      }
    };

    newSocket.on("userDateChanged", handleUserDateChanged);

    return () => {
      newSocket.off("userDateChanged", handleUserDateChanged);
      newSocket.disconnect();
    };
  }, []);

  // Reset state when date changes
  // Reset all state and fetch new data when date changes
  useEffect(() => {
    console.log("Date changed to:", date);

    const fetchMeals = async () => {
      try {
        setLoading(true);
        setMeals(null);
        setSelectedMeal("breakfast");

        const response = await axios.get(
          `http://localhost:4000/api/meals/${date}`,
        );
        console.log("Fetched meals:", response.data);
        setMeals(response.data);

        if (socket) {
          socket.emit("dateChange", date);
        }
      } catch (err) {
        console.error("Error fetching meals:", err);
        setMeals(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [date]);

  const getTotalCalories = (foods) =>
    foods.reduce((sum, f) => sum + f.calories * f.quantity, 0);

  const mealOptions = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
  ];

  let foods = [];
  if (meals && meals[selectedMeal] && meals[selectedMeal].foods) {
    foods = meals[selectedMeal].foods;
  }

  return (
    <IonContent>
      <IonToast
        isOpen={notification.isOpen}
        onDidDismiss={() => setNotification({ isOpen: false, message: "" })}
        message={notification.message}
        duration={3000}
        position="top"
      />
      <div style={{ margin: "20px 16px 24px 16px" }}>
        <IonSegment
          value={selectedMeal}
          onIonChange={(e) => setSelectedMeal(e.detail.value)}
        >
          {mealOptions.map((opt) => (
            <IonSegmentButton key={opt.key} value={opt.key}>
              {opt.label}
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>
      <div style={{ padding: 16 }}>
        {loading ? (
          <IonList>
            {[1, 2, 3].map((i) => (
              <IonItem key={i}>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: "60%" }} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : !meals ? (
          <div className="ion-padding">No meals found</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2 style={{ textTransform: "capitalize", margin: 0 }}>
                {selectedMeal}
              </h2>
              {meals[selectedMeal]?.time && (
                <IonNote style={{ fontSize: "0.9em", marginLeft: 16 }}>
                  {meals[selectedMeal].time}
                </IonNote>
              )}
            </div>
            {!foods || foods.length === 0 ? (
              <IonNote>No foods added</IonNote>
            ) : (
              <>
                <IonBadge color="primary" style={{ marginBottom: "8px" }}>
                  {getTotalCalories(foods)} kcal
                </IonBadge>
                <IonList lines="none">
                  {foods.map((food, idx) => (
                    <IonItem key={idx}>
                      <IonLabel>
                        {food.name}
                        <p>{food.calories * food.quantity} kcal</p>
                      </IonLabel>
                      <IonNote slot="end">x{food.quantity}</IonNote>
                    </IonItem>
                  ))}
                </IonList>
              </>
            )}
          </>
        )}
      </div>
    </IonContent>
  );
}
