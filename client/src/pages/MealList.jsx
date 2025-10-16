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
  IonSegmentButton
} from '@ionic/react';
import axios from 'axios';

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  // Reset state when date changes
  // Reset all state and fetch new data when date changes
  useEffect(() => {
    console.log('Date changed to:', date);
    
    const fetchMeals = async () => {
      try {
        setLoading(true);
        setMeals(null);
        setSelectedMeal('breakfast');
        
        const response = await axios.get(`http://localhost:4000/api/meals/${date}`);
        console.log('Fetched meals:', response.data);
        setMeals(response.data);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setMeals(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
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
      <div style={{ margin: '20px 16px 24px 16px' }}>
        <IonSegment value={selectedMeal} onIonChange={e => setSelectedMeal(e.detail.value)}>
          {mealOptions.map(opt => (
            <IonSegmentButton key={opt.key} value={opt.key}>
              {opt.label}
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>
      <div style={{ padding: 16 }}>
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
    </IonContent>
  );
}
