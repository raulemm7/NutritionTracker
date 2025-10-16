import React, { useState, useEffect } from 'react';
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
import { useHistory, useLocation, Redirect, Route } from 'react-router-dom';
import { calendar, restaurantOutline, listOutline, notificationsOutline } from 'ionicons/icons';
import FoodList from './pages/FoodList';
import MealList from './pages/MealList';
import MealDetail from './pages/MealDetail';
import Notifications from './components/Notifications';

function AppContent() {
  const location = useLocation();
  function getDateFromPath(path) {
    const match = path.match(/\/meals\/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : new Date().toISOString().split('T')[0];
  }
  const [selectedDate, setSelectedDate] = useState(getDateFromPath(location.pathname));
  const [isDateOpen, setIsDateOpen] = useState(false);
  const history = useHistory();

  // Sync selectedDate with URL changes
  useEffect(() => {
    const urlDate = getDateFromPath(location.pathname);
    console.log('URL changed, new date:', urlDate);
    setSelectedDate(urlDate);
  }, [location.pathname]);

  const handleDateChange = (value) => {
    const date = value.split('T')[0];
    console.log('Date selected:', date);
    setSelectedDate(date);
    setIsDateOpen(false);
    // Force a new route even if it's the same date
    history.replace('/');
    setTimeout(() => history.push(`/meals/${date}`), 0);
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
              <MealList key={selectedDate} />
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
