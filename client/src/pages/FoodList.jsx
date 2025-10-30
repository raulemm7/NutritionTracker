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
  IonButton,
  IonIcon,
  IonModal,
  IonRange,
  IonButtons,
} from "@ionic/react";
import { filterOutline } from "ionicons/icons";
import axios from "axios";

export default function FoodList() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [maxCalories, setMaxCalories] = useState(2000);
  const [maxPossibleCalories, setMaxPossibleCalories] = useState(2000);
  const pageSize = 3;

  useEffect(() => {
    let mounted = true;
    
    console.log("Fetching foods...");
    setLoading(true);
    
    axios
      .get("http://localhost:4000/api/foods")
      .then((res) => {
        console.log("Received foods:", res.data);
        if (mounted) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setFoods(res.data);
            const calories = res.data.map(food => food.calories);
            const maxCal = Math.max(...calories);
            console.log("Max calories found:", maxCal);
            setMaxPossibleCalories(maxCal);
            setMaxCalories(maxCal);
          } else {
            console.log("No foods received or empty array");
            setFoods([]);
            setMaxPossibleCalories(2000);
            setMaxCalories(2000);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching foods:", err);
        if (err.response) {
          console.error("Response error:", err.response.data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
      
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFoods = foods.filter(
    (food) =>
      food.name.toLowerCase().includes(searchText.toLowerCase()) &&
      food.calories <= maxCalories,
  );
  const totalPages = Math.ceil(filteredFoods.length / pageSize);
  const paginatedFoods = filteredFoods.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]); // Only reset page on search changes

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Foods Database</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding-bottom">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 8px",
          }}
        >
          <IonSearchbar
            style={{ flex: 1 }}
            value={searchText}
            onIonChange={(e) => setSearchText(e.detail.value)}
            placeholder="Search foods..."
            animated={true}
            debounce={300}
          />
          <IonButton fill="clear" onClick={() => setIsFilterModalOpen(true)}>
            <IonIcon icon={filterOutline} />
          </IonButton>
        </div>

        <IonModal
          isOpen={isFilterModalOpen}
          onDidDismiss={() => setIsFilterModalOpen(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Filter Foods</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsFilterModalOpen(false)}>
                  Done
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h2>Maximum Calories</h2>
            <IonItem lines="none">
              <IonRange
                className="range-pin"
                min={0}
                max={maxPossibleCalories}
                value={maxCalories}
                onIonChange={(e) => setMaxCalories(e.detail.value)}
                pin={true}
                pinFormatter={(value) => `${value} kcal`}
              >
                <IonNote slot="start">0</IonNote>
                <IonNote slot="end">
                  {maxPossibleCalories}
                </IonNote>
              </IonRange>
            </IonItem>
            <div className="ion-text-center ion-padding">
              <IonNote>
                Showing foods with {maxCalories} calories or less
              </IonNote>
            </div>
          </IonContent>
        </IonModal>
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
            paginatedFoods.map((food) => (
              <IonItem key={food.id}>
                <IonLabel>
                  <h2>{food.name}</h2>
                  <p>
                    Protein: {food.protein}g | Carbs: {food.carbs}g | Fat:{" "}
                    {food.fat}g
                  </p>
                </IonLabel>
                <IonBadge
                  slot="end"
                  color={food.calories > maxCalories ? "danger" : "primary"}
                >
                  {food.calories} kcal
                </IonBadge>
              </IonItem>
            ))
          )}
        </IonList>
        {/* Pagination controls */}
        {!loading && filteredFoods.length > pageSize && (
          <div className="ion-padding ion-text-center">
            <ion-button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              color="primary"
              style={{ marginRight: 8 }}
            >
              Previous
            </ion-button>
            <IonNote style={{ margin: "0 12px" }}>
              Page {page} of {totalPages}
            </IonNote>
            <ion-button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              color="primary"
            >
              Next
            </ion-button>
          </div>
        )}
      </IonContent>
    </>
  );
}
