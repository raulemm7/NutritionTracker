import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { 
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonPage
} from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import axios from 'axios';

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory(); // <-- schimbat useNavigate cu useHistory

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

  return (
    <IonContent>
      {loading ? (
          <IonList>
            {[1,2,3].map(i => (
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
          <IonList>
            {Object.entries(meals).map(([meal, data]) => (
              <IonCard 
                key={meal} 
                button
                onClick={() => history.push(`/meals/${date}/${meal}`)} // <-- aici
              >
                <IonCardHeader>
                  <IonCardSubtitle>
                    <IonIcon icon={timeOutline} /> {data.time}
                  </IonCardSubtitle>
                  <IonLabel>
                    <h2 style={{textTransform: 'capitalize'}}>{meal}</h2>
                  </IonLabel>
                </IonCardHeader>

                <IonCardContent>
                  {!data.foods || data.foods.length === 0 ? (
                    <IonNote>No foods added</IonNote>
                  ) : (
                    <>
                      <IonBadge color="primary" style={{marginBottom: '8px'}}>
                        {getTotalCalories(data.foods)} kcal
                      </IonBadge>
                      <IonList lines="none">
                        {data.foods.map((food, idx) => (
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
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
    </IonContent>
  );
}
