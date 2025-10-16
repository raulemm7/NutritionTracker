import React, { useState } from 'react';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonDatetime,
  IonModal,
  IonPage,
  IonContent
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useHistory, Redirect, Route } from 'react-router-dom';
import { calendar, restaurantOutline, listOutline, notificationsOutline } from 'ionicons/icons';
import FoodList from './pages/FoodList';
import MealList from './pages/MealList';
import MealDetail from './pages/MealDetail';
import Notifications from './components/Notifications';

function AppContent() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const history = useHistory();

  const handleDateChange = (value) => {
    const date = value.split('T')[0];
    setSelectedDate(date);
    setIsDateOpen(false);
    history.push(`/meals/${date}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ paddingInlineStart: 20, textAlign: 'left' }}>Nutrition Tracker</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setIsDateOpen(true)}>
              <IonIcon icon={calendar} slot="start" />
              {selectedDate}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/meals/:date">
              <MealList />
            </Route>
            <Route exact path="/meals/:date/:meal">
              <MealDetail />
            </Route>
            <Route exact path="/foods">
              <FoodList />
            </Route>
            <Route exact path="/notifications">
              <Notifications />
            </Route>
            <Route exact path="/">
              <Redirect to={`/meals/${selectedDate}`} />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="meals" href={`/meals/${selectedDate}`}>
              <IonIcon icon={restaurantOutline} />
              <IonLabel>Meals</IonLabel>
            </IonTabButton>
            <IonTabButton tab="foods" href="/foods">
              <IonIcon icon={listOutline} />
              <IonLabel>Foods</IonLabel>
            </IonTabButton>
            <IonTabButton tab="notifications" href="/notifications">
              <IonIcon icon={notificationsOutline} />
              <IonLabel>Alerts</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>

        <IonModal isOpen={isDateOpen} onDidDismiss={() => setIsDateOpen(false)}>
          <IonContent>
            <IonDatetime
              value={selectedDate}
              onIonChange={e => handleDateChange(e.detail.value)}
              presentation="date"
            />
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
}
