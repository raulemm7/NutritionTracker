import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToast,
  IonBackButton,
  IonButtons,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
} from "@ionic/react";
import { timeOutline, addOutline, trashOutline, createOutline, checkmarkOutline } from "ionicons/icons";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function MealDetail() {
  const { date, meal } = useParams();
  const history = useHistory();
  const [mealData, setMealData] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedFood, setSelectedFood] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      axios.get(`${API_BASE_URL}/meals/${date}`),
      axios.get(`${API_BASE_URL}/foods`),
    ])
      .then(([mealsRes, foodsRes]) => {
        if (mounted) {
          setMealData(mealsRes.data[meal]);
          setFoods(foodsRes.data);
          // Initialize editing quantities
          const quantities = {};
          if (mealsRes.data[meal]?.foods) {
            mealsRes.data[meal].foods.forEach((food, idx) => {
              quantities[idx] = food.quantity;
            });
          }
          setEditingQuantities(quantities);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [date, meal]);

  const handleTimeChange = (value) => {
    const time = value.split("T")[1].substring(0, 5);
    axios
      .patch(`${API_BASE_URL}/meals/${date}/${meal}/time`, { time })
      .then(() => {
        setMealData((prev) => ({ ...prev, time }));
        setShowTimePicker(false);
        showToastMessage("Time updated");
      })
      .catch(() => showToastMessage("Error updating time"));
  };

  const addFood = () => {
    if (!selectedFood) return;

    axios
      .post(`${API_BASE_URL}/meals/${date}/${meal}`, {
        foodId: selectedFood,
        quantity: 1,
      })
      .then((res) => {
        setMealData((prev) => ({
          ...prev,
          foods: [...prev.foods, res.data],
        }));
        setShowAddFood(false);
        setSelectedFood("");
        showToastMessage("Food added to meal");
      })
      .catch(() => {
        showToastMessage("Error adding food");
      });
  };

  const removeFood = (index) => {
    const foodToRemove = mealData.foods[index];
    
    axios
      .delete(`${API_BASE_URL}/meals/${date}/${meal}/foods/${foodToRemove.id}`)
      .then(() => {
        const newFoods = [...mealData.foods];
        newFoods.splice(index, 1);
        setMealData((prev) => ({ ...prev, foods: newFoods }));
        
        // Update editing quantities
        const newQuantities = {};
        newFoods.forEach((food, idx) => {
          newQuantities[idx] = food.quantity;
        });
        setEditingQuantities(newQuantities);
        
        showToastMessage("Food removed");
      })
      .catch(() => {
        showToastMessage("Error removing food");
      });
  };

  const updateQuantity = (index, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    
    axios
      .patch(`${API_BASE_URL}/meals/${date}/${meal}/foods/${mealData.foods[index].id}`, { quantity })
      .then(() => {
        const newFoods = [...mealData.foods];
        newFoods[index].quantity = quantity;
        setMealData((prev) => ({ ...prev, foods: newFoods }));
        setEditingQuantities(prev => ({ ...prev, [index]: quantity }));
        showToastMessage("Quantity updated");
      })
      .catch(() => {
        showToastMessage("Error updating quantity");
      });
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  if (loading) return null;
  if (!mealData) return <div className="ion-padding">Meal not found</div>;

  const totalCalories = mealData.foods.reduce(
    (sum, f) => sum + f.calories * f.quantity,
    0,
  );

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push(`/meals/${date}`)}>
              Back
            </IonButton>
          </IonButtons>
          <IonTitle style={{ textTransform: "capitalize" }}>{meal}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowTimePicker(true)}>
              <IonIcon slot="icon-only" icon={timeOutline} />
            </IonButton>
            <IonButton onClick={toggleEditMode}>
              <IonIcon slot="icon-only" icon={isEditMode ? checkmarkOutline : createOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="ion-padding">
          <IonBadge color="primary">Total: {totalCalories} kcal</IonBadge>
        </div>

        <IonList>
          {mealData.foods.map((food, idx) => (
            <IonItemSliding key={idx} disabled={!isEditMode}>
              <IonItem>
                <IonLabel>
                  {food.name}
                  <p>{food.calories * food.quantity} kcal</p>
                </IonLabel>
                {isEditMode ? (
                  <IonInput
                    type="number"
                    value={editingQuantities[idx]}
                    placeholder="Qty"
                    style={{ maxWidth: "80px", textAlign: "right" }}
                    onIonChange={(e) => setEditingQuantities(prev => ({ ...prev, [idx]: e.detail.value }))}
                    onIonBlur={(e) => {
                      const newQty = parseInt(e.detail.value) || 1;
                      if (newQty !== food.quantity) {
                        updateQuantity(idx, newQty);
                      }
                    }}
                  />
                ) : (
                  <IonNote slot="end">x{food.quantity}</IonNote>
                )}
              </IonItem>
              {isEditMode && (
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => removeFood(idx)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              )}
            </IonItemSliding>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowAddFood(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal
          isOpen={showAddFood}
          onDidDismiss={() => setShowAddFood(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Food</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddFood(false)}>
                  Cancel
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="ion-padding">
              <IonItem>
                <IonLabel position="stacked">Select Food</IonLabel>
                <IonSelect
                  value={selectedFood}
                  placeholder="Choose a food"
                  onIonChange={(e) => setSelectedFood(e.detail.value)}
                >
                  {foods.map((f) => (
                    <IonSelectOption key={f.id} value={f.id}>
                      {f.name} ({f.calories} kcal)
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonButton
                expand="block"
                className="ion-margin-top"
                onClick={addFood}
                disabled={!selectedFood}
              >
                Add to Meal
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showTimePicker}
          onDidDismiss={() => setShowTimePicker(false)}
        >
          <IonDatetime
            value={`2025-01-01T${mealData.time}`}
            presentation="time"
            onIonChange={(e) => handleTimeChange(e.detail.value)}
          />
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </>
  );
}
