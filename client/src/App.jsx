import React, { useState, useEffect, useRef } from "react";
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
  IonContent,
  IonToast,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useHistory, useLocation, Redirect, Route } from "react-router-dom";
import {
  calendar,
  restaurantOutline,
  listOutline,
  notificationsOutline,
  logOutOutline,
} from "ionicons/icons";
import FoodList from "./pages/FoodList";
import MealList from "./pages/MealList";
import MealDetail from "./pages/MealDetail";
import Notifications from "./components/Notifications";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./components/Auth";
import { NetworkStatusProvider } from "./services/networkStatus.jsx";
import axios from "axios";
import LocalStorageService from "./services/localStorage";

function getDateFromPath(path) {
  const match = path.match(/\/meals\/(\d{4}-\d{2}-\d{2})/);
  // Only extract date from path if it matches, otherwise keep current date
  return match ? match[1] : new Date().toISOString().split("T")[0];
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const history = useHistory();
  const toastTimeout = useRef(null);

  const [selectedDate, setSelectedDate] = useState(() =>
    getDateFromPath(location.pathname),
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showToast, setShowToast] = useState(true);
  const [toastMessage, setToastMessage] = useState(() =>
    navigator.onLine ? "You are online" : "You are offline",
  );
  const [toastColor, setToastColor] = useState(() =>
    navigator.onLine ? "success" : "danger",
  );

  // Effect: Load and cache foods on mount
  useEffect(() => {
    const loadFoods = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/foods`);
        if (response.data && Array.isArray(response.data)) {
          LocalStorageService.setFoodsCache(response.data);
          console.log(
            "Foods cached successfully:",
            response.data.length,
            "items",
          );
        }
      } catch (error) {
        console.error("Error caching foods:", error);
      }
    };

    loadFoods();
  }, []);

  // Sync selectedDate with URL changes
  useEffect(() => {
    // Only update selectedDate if we're on a meals route
    if (location.pathname.includes("/meals/")) {
      const urlDate = getDateFromPath(location.pathname);
      console.log("URL changed, new date:", urlDate);
      setSelectedDate(urlDate);
    }
  }, [location.pathname]);

  // Effect: Initial online status and toast
  useEffect(() => {
    if (isOnline) {
      setToastMessage("You are online");
      setToastColor("success");
      setShowToast(true);
      toastTimeout.current = setTimeout(() => setShowToast(false), 3000);
    } else {
      setToastMessage("You are offline");
      setToastColor("danger");
      setShowToast(true);
    }

    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, [isOnline]);

  // Effect: Online/offline status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleDateChange = (value) => {
    const date = value.split("T")[0];
    console.log("Date selected:", date);
    setSelectedDate(date);
    setIsDateOpen(false);
    // Force a new route even if it's the same date
    history.replace("/");
    setTimeout(() => history.push(`/meals/${date}`), 0);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle
            style={user ? { paddingInlineStart: 20, textAlign: "left" } : {}}
          >
            {user ? `Welcome, ${user.username}` : "Nutrify"}
          </IonTitle>

          <IonButtons slot="end">
            {user && (
              <IonButton onClick={() => setIsDateOpen(true)}>
                <IonIcon icon={calendar} slot="start" />
                <span style={{ marginLeft: 6 }}>{selectedDate}</span>
              </IonButton>
            )}

            {user && (
              <IonButton
                onClick={() => {
                  logout();
                  history.replace("/login");
                }}
                aria-label="Logout"
              >
                <IonIcon icon={logOutOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/login">
              {user ? <Redirect to={`/meals/${selectedDate}`} /> : <Login />}
            </Route>
            <Route exact path="/foods">
              {!user ? <Redirect to="/login" /> : <FoodList />}
            </Route>
            <Route exact path="/notifications">
              {!user ? <Redirect to="/login" /> : <Notifications />}
            </Route>
            <Route exact path="/meals/:date/:meal">
              {!user ? <Redirect to="/login" /> : <MealDetail />}
            </Route>
            <Route exact path="/meals/:date">
              {!user ? (
                <Redirect to="/login" />
              ) : (
                <MealList key={selectedDate} />
              )}
            </Route>
            <Route exact path="/">
              <Redirect to={user ? `/meals/${selectedDate}` : "/login"} />
            </Route>
            <Route>
              <Redirect to={user ? `/meals/${selectedDate}` : "/login"} />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton
              tab="meals"
              onClick={() => history.push(`/meals/${selectedDate}`)}
              selected={location.pathname.includes("/meals/")}
            >
              <IonIcon icon={restaurantOutline} />
              <IonLabel>Meals</IonLabel>
            </IonTabButton>
            <IonTabButton
              tab="foods"
              onClick={() => history.push("/foods")}
              selected={location.pathname === "/foods"}
            >
              <IonIcon icon={listOutline} />
              <IonLabel>Foods</IonLabel>
            </IonTabButton>
            <IonTabButton
              tab="notifications"
              onClick={() => history.push("/notifications")}
              selected={location.pathname === "/notifications"}
            >
              <IonIcon icon={notificationsOutline} />
              <IonLabel>Alerts</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>

        <IonModal isOpen={isDateOpen} onDidDismiss={() => setIsDateOpen(false)}>
          <IonContent>
            <IonDatetime
              value={selectedDate}
              onIonChange={(e) => handleDateChange(e.detail.value)}
              presentation="date"
            />
          </IonContent>
        </IonModal>

        {/* Network status pop-up */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          color={toastColor}
          duration={3000}
          position="top"
          animated={true}
          onDidDismiss={() => setShowToast(false)}
          style={{ fontWeight: "bold", fontSize: 16 }}
        />
      </IonContent>
    </IonPage>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkStatusProvider>
        <IonApp>
          <IonReactRouter>
            <AppContent />
          </IonReactRouter>
        </IonApp>
      </NetworkStatusProvider>
    </AuthProvider>
  );
}
