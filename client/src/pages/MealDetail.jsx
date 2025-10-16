import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom'; 
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
  IonModal
} from '@ionic/react';
import { timeOutline, addOutline, trashOutline } from 'ionicons/icons';
import axios from 'axios';

export default function MealDetail() {
  const { date, meal } = useParams();
  const history = useHistory(); // <-- schimbat
  const [mealData, setMealData] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedFood, setSelectedFood] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      axios.get(`http://localhost:4000/api/meals/${date}`),
      axios.get('http://localhost:4000/api/foods')
    ]).then(([mealsRes, foodsRes]) => {
      if (mounted) {
        setMealData(mealsRes.data[meal]);
        setFoods(foodsRes.data);
      }
    }).catch(err => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [date, meal]);

  const handleTimeChange = (value) => {
    const time = value.split('T')[1].substring(0, 5);
    axios.patch(`http://localhost:4000/api/meals/${date}/${meal}/time`, { time })
      .then(() => {
        setMealData(prev => ({ ...prev, time }));
        setShowTimePicker(false);
        showToastMessage('Time updated');
      })
      .catch(() => showToastMessage('Error updating time'));
  };

  const addFood = () => {
    if (!selectedFood) return;
    
    axios.post(`http://localhost:4000/api/meals/${date}/${meal}`, {
      foodId: selectedFood,
      quantity: 1
    }).then(res => {
      setMealData(prev => ({
        ...prev,
        foods: [...prev.foods, res.data]
      }));
      setShowAddFood(false);
      setSelectedFood('');
      showToastMessage('Food added to meal');
    }).catch(() => {
      showToastMessage('Error adding food');
    });
  };

  const removeFood = (index) => {
    const newFoods = [...mealData.foods];
    newFoods.splice(index, 1);
    setMealData(prev => ({ ...prev, foods: newFoods }));
    showToastMessage('Food removed');
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  if (loading) return null;
  if (!mealData) return <div className="ion-padding">Meal not found</div>;

  const totalCalories = mealData.foods.reduce((sum, f) => sum + (f.calories * f.quantity), 0);

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push(`/meals/${date}`)}> {/* <-- schimbat BackButton */}
              Back
            </IonButton>
          </IonButtons>
          <IonTitle style={{textTransform: 'capitalize'}}>{meal}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowTimePicker(true)}>
              <IonIcon slot="icon-only" icon={timeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="ion-padding">
          <IonBadge color="primary">
            Total: {totalCalories} kcal
          </IonBadge>
        </div>

        <IonList>
          {mealData.foods.map((food, idx) => (
            <IonItemSliding key={idx}>
              <IonItem>
                <IonLabel>
                  {food.name}
                  <p>{food.calories * food.quantity} kcal</p>
                </IonLabel>
                <IonNote slot="end">x{food.quantity}</IonNote>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => removeFood(idx)}>
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowAddFood(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showAddFood} onDidDismiss={() => setShowAddFood(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Food</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddFood(false)}>Cancel</IonButton>
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
                  onIonChange={e => setSelectedFood(e.detail.value)}
                >
                  {foods.map(f => (
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

        <IonModal isOpen={showTimePicker} onDidDismiss={() => setShowTimePicker(false)}>
          <IonDatetime
            value={`2025-01-01T${mealData.time}`}
            presentation="time"
            onIonChange={e => handleTimeChange(e.detail.value)}
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
