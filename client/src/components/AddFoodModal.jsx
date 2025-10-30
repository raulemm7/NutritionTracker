import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonSearchbar,
  IonInput,
  IonBadge,
  IonSkeletonText,
} from "@ionic/react";
import LocalStorageService from "../services/localStorage";

export default function AddFoodModal({ isOpen, onClose, onAddFood, mealType }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadFoods = () => {
      try {
        setLoading(true);
        const cachedFoods = LocalStorageService.getFoodsCache();
        if (mounted) {
          if (cachedFoods && cachedFoods.length > 0) {
            setFoods(cachedFoods);
          } else {
            setError(
              "No foods available. Please go online to load foods data.",
            );
          }
        }
      } catch (err) {
        console.error("Error loading foods:", err);
        if (mounted) {
          setError("Failed to load foods from cache");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      loadFoods();
    }

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
  };

  const handleAddFood = () => {
    if (!selectedFood) {
      setError("Please select a food");
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    onAddFood({
      foodId: selectedFood.id,
      quantity: qty,
    });

    // Reset state
    setSelectedFood(null);
    setQuantity("1");
    setSearchText("");
    setError("");
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Food to {mealType}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value)}
          placeholder="Search foods..."
          animated={true}
          debounce={300}
        />

        {error && (
          <div className="ion-padding">
            <IonLabel color="danger">{error}</IonLabel>
          </div>
        )}

        {selectedFood ? (
          <div className="ion-padding">
            <h4>Selected: {selectedFood.name}</h4>
            <IonItem>
              <IonLabel position="stacked">Quantity</IonLabel>
              <IonInput
                type="number"
                value={quantity}
                onIonChange={(e) => setQuantity(e.detail.value)}
                min="1"
              />
            </IonItem>
            <IonButton
              expand="block"
              onClick={handleAddFood}
              className="ion-margin-top"
            >
              Add to Meal
            </IonButton>
          </div>
        ) : (
          <IonList>
            {loading
              ? Array(3)
                  .fill()
                  .map((_, i) => (
                    <IonItem key={i}>
                      <IonLabel>
                        <IonSkeletonText animated style={{ width: "70%" }} />
                      </IonLabel>
                      <IonBadge slot="end">
                        <IonSkeletonText animated style={{ width: "30px" }} />
                      </IonBadge>
                    </IonItem>
                  ))
              : filteredFoods.map((food) => (
                  <IonItem
                    key={food.id}
                    button
                    onClick={() => handleFoodSelect(food)}
                  >
                    <IonLabel>{food.name}</IonLabel>
                    <IonBadge slot="end">{food.calories} kcal</IonBadge>
                  </IonItem>
                ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
}
