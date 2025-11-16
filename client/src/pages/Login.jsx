import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonList,
} from "@ionic/react";
import { useAuth } from "../components/Auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const auth = useAuth();
  const history = useHistory();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await auth.login(username, password);
      history.replace("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={submit}>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Username</IonLabel>
              <IonInput
                value={username}
                onIonInput={(e) => setUsername(e.detail.value)}
                required
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value)}
                required
              />
            </IonItem>
          </IonList>
          <div style={{ marginTop: 16 }}>
            <IonButton expand="block" type="submit">
              Log in
            </IonButton>
          </div>
        </form>
        <IonToast
          isOpen={showToast}
          message={error}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
}
