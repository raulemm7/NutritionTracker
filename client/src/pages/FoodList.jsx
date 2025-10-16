import React, { useEffect, useState } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonSearchbar,
  IonSkeletonText,
} from "@ionic/react";
import axios from "axios";

export default function FoodList() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let mounted = true;
    axios
      .get("http://localhost:4000/api/foods")
      .then((res) => mounted && setFoods(res.data))
      .catch((err) => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Foods Database</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding-bottom">
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value)}
          placeholder="Search foods..."
        />
        <IonList style={{ marginBottom: 0 }}>
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <IonItem key={i}>
                  <IonLabel>
                    <IonSkeletonText animated style={{ width: "70%" }} />
                    <p>
                      <IonSkeletonText animated style={{ width: "30%" }} />
                    </p>
                  </IonLabel>
                </IonItem>
              ))
          ) : filteredFoods.length === 0 ? (
            <div className="ion-padding ion-text-center">
              <IonNote>No foods found</IonNote>
            </div>
          ) : (
            filteredFoods.map((food) => (
              <IonItem key={food.id}>
                <IonLabel>
                  <h2>{food.name}</h2>
                  <p>
                    Protein: {food.protein}g | Carbs: {food.carbs}g | Fat:{" "}
                    {food.fat}g
                  </p>
                </IonLabel>
                <IonBadge slot="end" color="primary">
                  {food.calories} kcal
                </IonBadge>
              </IonItem>
            ))
          )}
        </IonList>
      </IonContent>
    </>
  );
}
