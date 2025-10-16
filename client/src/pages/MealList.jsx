import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  IonPage
} from '@ionic/react';
import axios from 'axios';

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  useEffect(() => {
    let mounted = true;
    axios.get(`http://localhost:4000/api/meals/${date}`)
      .then(res => mounted && setMeals(res.data))
      .catch(err => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [date]);

  const getTotalCalories = (foods) =>
    foods.reduce((sum, f) => sum + (f.calories * f.quantity), 0);

  const mealOptions = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' }
  ];

  let foods = [];
  if (meals && meals[selectedMeal] && meals[selectedMeal].foods) {
    foods = meals[selectedMeal].foods;
  }

  return (
    <IonContent>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <div style={{ minWidth: 120, borderRight: '1px solid #eee', background: '#fafafa', paddingTop: 16 }}>
          <IonList style={{ height: '100%' }}>
            {mealOptions.map(opt => (
              <IonItem
                key={opt.key}
                button
                color={selectedMeal === opt.key ? 'primary' : ''}
                onClick={() => setSelectedMeal(opt.key)}
              >
                <IonLabel>{opt.label}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {loading ? (
            <IonList>
              {[1, 2, 3].map(i => (
                <IonItem key={i}>
                  <IonLabel>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          ) : !meals ? (
            <div className="ion-padding">No meals found</div>
          ) : (
            <>
              <h2 style={{ textTransform: 'capitalize', marginBottom: 8 }}>{selectedMeal}</h2>
              {(!foods || foods.length === 0) ? (
                <IonNote>No foods added</IonNote>
              ) : (
                <>
                  <IonBadge color="primary" style={{ marginBottom: '8px' }}>
                    {getTotalCalories(foods)} kcal
                  </IonBadge>
                  <IonList lines="none">
                    {foods.map((food, idx) => (
                      <IonItem key={idx}>
                        <IonLabel>
                          {food.name}
                          <p>
                            {food.calories * food.quantity} kcal
                          </p>
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
      </div>
    </IonContent>
  );
}
