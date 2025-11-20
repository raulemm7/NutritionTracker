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
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonButtons,
  IonInput,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import { add, createOutline, checkmarkOutline, trashOutline } from "ionicons/icons";
import { io } from "socket.io-client";
import axios from "axios";
import AddFoodModal from "../components/AddFoodModal";
import apiService from "../services/api";
import { useNetworkStatus } from "../services/networkStatus.jsx";

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [socket, setSocket] = useState(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState({});

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    const handleUserDateChanged = (data) => {
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

  useEffect(() => {
    console.log("Date changed to:", date);

    const fetchMeals = async () => {
      try {
        setLoading(true);
        setMeals(null);
        setSelectedMeal("breakfast");

        const mealsData = await apiService.getMeals(date);
        console.log("Fetched meals:", mealsData);
        setMeals(mealsData);
        
        // Initialize editing quantities
        const quantities = {};
        Object.keys(mealsData).forEach((mealType) => {
          if (mealsData[mealType]?.foods) {
            mealsData[mealType].foods.forEach((food, idx) => {
              quantities[`${mealType}-${idx}`] = food.quantity;
            });
          }
        });
        setEditingQuantities(quantities);

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

  const handleAddFood = async ({ foodId, quantity }) => {
    try {
      console.log("Adding food:", { foodId, quantity, date, selectedMeal });
      const mealData = await apiService.addFoodToMeal(date, selectedMeal, {
        foodId,
        quantity,
      });
      console.log("Received meal data:", mealData);

      // Update the meals state with the new food
      setMeals((prev) => {
        const updated = {
          ...prev,
          [selectedMeal]: mealData,
        };
        console.log("Updated meals state:", updated);
        return updated;
      });

      // Update editing quantities for the new food
      if (mealData && mealData.foods) {
        const newQuantities = {};
        mealData.foods.forEach((food, idx) => {
          newQuantities[`${selectedMeal}-${idx}`] = food.quantity;
        });
        setEditingQuantities(prev => ({ ...prev, ...newQuantities }));
      }

      setNotification({
        isOpen: true,
        message: "Food added successfully!",
      });
    } catch (error) {
      console.error("Error adding food:", error);
      setNotification({
        isOpen: true,
        message: "Failed to add food. Please try again.",
      });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const removeFood = async (foodId, idx) => {
    try {
      await axios.delete(`http://localhost:4000/api/meals/${date}/${selectedMeal}/foods/${foodId}`);
      
      const newFoods = [...foods];
      newFoods.splice(idx, 1);
      
      setMeals((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          foods: newFoods,
        },
      }));
      
      setNotification({
        isOpen: true,
        message: "Food removed successfully!",
      });
    } catch (error) {
      console.error("Error removing food:", error);
      setNotification({
        isOpen: true,
        message: "Failed to remove food.",
      });
    }
  };

  const updateQuantity = async (foodId, idx, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    
    try {
      await axios.patch(`http://localhost:4000/api/meals/${date}/${selectedMeal}/foods/${foodId}`, { quantity });
      
      const newFoods = [...foods];
      newFoods[idx].quantity = quantity;
      
      setMeals((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          foods: newFoods,
        },
      }));
      
      setEditingQuantities(prev => ({ ...prev, [`${selectedMeal}-${idx}`]: quantity }));
      
      setNotification({
        isOpen: true,
        message: "Quantity updated!",
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      setNotification({
        isOpen: true,
        message: "Failed to update quantity.",
      });
    }
  };

  return (
    <>
      <IonContent>
      <IonToast
        isOpen={notification.isOpen}
        onDidDismiss={() => setNotification({ isOpen: false, message: "" })}
        message={notification.message}
        duration={3000}
        position="top"
      />
      <div style={{ margin: "20px 16px 16px 16px" }}>
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px',
        background: isEditMode ? '#f0f9ff' : 'transparent',
        borderRadius: '8px',
        margin: '0 16px 16px 16px',
        transition: 'background 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonIcon 
            icon={isEditMode ? checkmarkOutline : createOutline} 
            style={{ fontSize: '20px', color: isEditMode ? '#0066cc' : '#666' }}
          />
          <span style={{ 
            fontSize: '0.95em', 
            fontWeight: 500,
            color: isEditMode ? '#0066cc' : '#666',
            textTransform: 'capitalize'
          }}>
            {isEditMode ? `Editing ${selectedMeal}` : `Edit meals for ${selectedMeal}`}
          </span>
        </div>
        <IonButton 
          onClick={toggleEditMode} 
          fill="clear" 
          size="small"
          style={{ margin: 0 }}
        >
          {isEditMode ? 'Done' : 'Edit'}
        </IonButton>
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
                    <IonItemSliding key={idx} disabled={!isEditMode}>
                      <IonItem>
                        <IonLabel>
                          {food.name}
                          <p>{food.calories * food.quantity} kcal</p>
                        </IonLabel>
                        {isEditMode ? (
                          <IonInput
                            type="number"
                            value={editingQuantities[`${selectedMeal}-${idx}`]}
                            placeholder="Qty"
                            style={{ maxWidth: "80px", textAlign: "right" }}
                            onIonChange={(e) => setEditingQuantities(prev => ({ ...prev, [`${selectedMeal}-${idx}`]: e.detail.value }))}
                            onIonBlur={(e) => {
                              const newQty = parseInt(e.detail.value) || 1;
                              if (newQty !== food.quantity) {
                                updateQuantity(food.id, idx, newQty);
                              }
                            }}
                          />
                        ) : (
                          <IonNote slot="end">x{food.quantity}</IonNote>
                        )}
                      </IonItem>
                      {isEditMode && (
                        <IonItemOptions side="end">
                          <IonItemOption color="danger" onClick={() => removeFood(food.id, idx)}>
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      )}
                    </IonItemSliding>
                  ))}
                </IonList>
              </>
            )}
          </>
        )}
      </div>

      {isEditMode && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsAddFoodModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      )}

      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        onAddFood={handleAddFood}
        mealType={selectedMeal}
      />
    </IonContent>
    </>
  );
}
