import React, { useState, useEffect, useRef } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { closeOutline, locateOutline, checkmarkOutline } from "ionicons/icons";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Geolocation } from "@capacitor/geolocation";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to handle map clicks and updates
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

// Component to control map from parent
function MapController({ mapRef }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

// Component to fix map size on mount
function MapSizeFixer() {
  const map = useMapEvents({});
  
  useEffect(() => {
    // Fix map size multiple times to ensure it loads correctly
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1000),
    ];
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [map]);
  
  return null;
}

export default function MealLocationMap({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  viewOnly = false,
}) {
  const mapRef = useRef(null);
  const [position, setPosition] = useState(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : { lat: 44.4268, lng: 26.1025 }
  );
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [mapKey, setMapKey] = useState(0); // Force re-render map

  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setPosition({ lat: initialLocation.latitude, lng: initialLocation.longitude });
        setAddress(initialLocation.address || "");
      } else {
        setPosition({ lat: 44.4268, lng: 26.1025 });
        setAddress("");
      }
      // Force map re-render when modal opens
      setMapKey(prev => prev + 1);
    }
  }, [initialLocation, isOpen]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Check if we're in a browser (web) or native app
      if ('geolocation' in navigator) {
        // Use browser Geolocation API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setPosition(newPos);
            fetchAddress(newPos.lat, newPos.lng);
            
            // Center map on GPS location
            if (mapRef.current) {
              mapRef.current.setView([newPos.lat, newPos.lng], 15);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error("Browser geolocation error:", error);
            alert("Failed to get location. Please enable location permissions in your browser.");
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        // Fallback to Capacitor for native apps
        try {
          const coordinates = await Geolocation.getCurrentPosition();
          const newPos = {
            lat: coordinates.coords.latitude,
            lng: coordinates.coords.longitude,
          };
          setPosition(newPos);
          fetchAddress(newPos.lat, newPos.lng);
          
          // Center map on GPS location
          if (mapRef.current) {
            mapRef.current.setView([newPos.lat, newPos.lng], 15);
          }
        } catch (error) {
          console.error("Capacitor geolocation error:", error);
          alert("Failed to get location. Please enable location permissions.");
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get current location.");
      setLoading(false);
    }
  };

  const fetchAddress = async (lat, lng) => {
    try {
      // Using Nominatim (OpenStreetMap) reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleLocationSelect = (latlng) => {
    if (viewOnly) return;
    setPosition(latlng);
    fetchAddress(latlng.lat, latlng.lng);
  };

  const handleSave = () => {
    onSave({
      latitude: position.lat,
      longitude: position.lng,
      address: address,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{viewOnly ? "Meal Location" : "Set Meal Location"}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-no-padding">
        <div style={{ height: "100%", width: "100%", position: "relative" }}>
          {isOpen ? (
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={15}
              style={{ height: "100%", width: "100%", minHeight: "400px" }}
              key={mapKey}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <Marker position={[position.lat, position.lng]} />
              <MapController mapRef={mapRef} />
              <MapSizeFixer />
              {!viewOnly && <MapClickHandler onLocationSelect={handleLocationSelect} />}
            </MapContainer>
          ) : (
            <div style={{ 
              height: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <IonSpinner />
            </div>
          )}

          {!viewOnly && (
            <IonButton
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 1000,
              }}
              onClick={getCurrentLocation}
              disabled={loading}
            >
              {loading ? <IonSpinner name="dots" /> : <IonIcon icon={locateOutline} />}
            </IonButton>
          )}
        </div>
      </IonContent>

      <IonFooter>
        <div style={{ padding: "12px 16px", background: "var(--ion-background-color)" }}>
          <IonText color="medium">
            <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
              {address || "Select a location on the map"}
            </p>
          </IonText>
          {!viewOnly && (
            <IonButton expand="block" onClick={handleSave}>
              <IonIcon icon={checkmarkOutline} slot="start" />
              Save Location
            </IonButton>
          )}
          {viewOnly && (
            <IonButton
              expand="block"
              href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
              target="_blank"
            >
              Open in Maps App
            </IonButton>
          )}
        </div>
      </IonFooter>
    </IonModal>
  );
}
