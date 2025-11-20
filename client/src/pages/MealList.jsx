import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  IonToast,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonButtons,
  IonInput,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import { add, createOutline, checkmarkOutline, trashOutline, cameraOutline } from "ionicons/icons";
import { io } from "socket.io-client";
import axios from "axios";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { API_BASE_URL, SOCKET_URL } from "../config";
import AddFoodModal from "../components/AddFoodModal";
import apiService from "../services/api";
import { useNetworkStatus } from "../services/networkStatus.jsx";

export default function MealList() {
  const { date } = useParams();
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [socket, setSocket] = useState(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState({});
  const [mealPhotos, setMealPhotos] = useState({}); // Now stores arrays of photos per meal

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    const handleUserDateChanged = (data) => {
      if (data.userId !== newSocket.id) {
        setNotification({
          isOpen: true,
          message: `Another user is viewing meals for ${data.date}`,
        });
      }
    };

    const handleMealPhotoUpdated = (data) => {
      console.log('Photo updated via socket:', data);
      if (data.date === date) {
        setMealPhotos(prev => ({
          ...prev,
          [data.meal]: data.photos
        }));
      }
    };

    newSocket.on("userDateChanged", handleUserDateChanged);
    newSocket.on("meal-photo-updated", handleMealPhotoUpdated);

    return () => {
      newSocket.off("userDateChanged", handleUserDateChanged);
      newSocket.off("meal-photo-updated", handleMealPhotoUpdated);
      newSocket.disconnect();
    };
  }, [date]);

  useEffect(() => {
    console.log("Date changed to:", date);

    const fetchMeals = async () => {
      try {
        setLoading(true);
        setMeals(null);
        setSelectedMeal("breakfast");

        const mealsData = await apiService.getMeals(date);
        console.log("Fetched meals:", mealsData);
        setMeals(mealsData);
        
        // Initialize editing quantities
        const quantities = {};
        const photos = {};
        Object.keys(mealsData).forEach((mealType) => {
          if (mealsData[mealType]?.foods) {
            mealsData[mealType].foods.forEach((food, idx) => {
              quantities[`${mealType}-${idx}`] = food.quantity;
            });
          }
          // Load photos array from server data
          if (mealsData[mealType]?.photos && Array.isArray(mealsData[mealType].photos)) {
            photos[mealType] = mealsData[mealType].photos;
          }
        });
        setEditingQuantities(quantities);

        // Photos now come only from server (localStorage too limited for images)
        setMealPhotos(photos);

        if (socket) {
          socket.emit("dateChange", date);
        }
      } catch (err) {
        console.error("Error fetching meals:", err);
        setMeals(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [date]);

  const getTotalCalories = (foods) =>
    foods.reduce((sum, f) => sum + f.calories * f.quantity, 0);

  const mealOptions = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
  ];

  let foods = [];
  if (meals && meals[selectedMeal] && meals[selectedMeal].foods) {
    foods = meals[selectedMeal].foods;
  }

  const handleAddFood = async ({ foodId, quantity }) => {
    try {
      console.log("Adding food:", { foodId, quantity, date, selectedMeal });
      const mealData = await apiService.addFoodToMeal(date, selectedMeal, {
        foodId,
        quantity,
      });
      console.log("Received meal data:", mealData);

      // Update the meals state with the new food
      setMeals((prev) => {
        const updated = {
          ...prev,
          [selectedMeal]: mealData,
        };
        console.log("Updated meals state:", updated);
        return updated;
      });

      // Update editing quantities for the new food
      if (mealData && mealData.foods) {
        const newQuantities = {};
        mealData.foods.forEach((food, idx) => {
          newQuantities[`${selectedMeal}-${idx}`] = food.quantity;
        });
        setEditingQuantities(prev => ({ ...prev, ...newQuantities }));
      }

      setNotification({
        isOpen: true,
        message: "Food added successfully!",
      });
    } catch (error) {
      console.error("Error adding food:", error);
      setNotification({
        isOpen: true,
        message: "Failed to add food. Please try again.",
      });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const removeFood = async (foodId, idx) => {
    try {
      await axios.delete(`${API_BASE_URL}/meals/${date}/${selectedMeal}/foods/${foodId}`);
      
      const newFoods = [...foods];
      newFoods.splice(idx, 1);
      
      setMeals((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          foods: newFoods,
        },
      }));
      
      setNotification({
        isOpen: true,
        message: "Food removed successfully!",
      });
    } catch (error) {
      console.error("Error removing food:", error);
      setNotification({
        isOpen: true,
        message: "Failed to remove food.",
      });
    }
  };

  const updateQuantity = async (foodId, idx, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    
    try {
      await axios.patch(`${API_BASE_URL}/meals/${date}/${selectedMeal}/foods/${foodId}`, { quantity });
      
      const newFoods = [...foods];
      newFoods[idx].quantity = quantity;
      
      setMeals((prev) => ({
        ...prev,
        [selectedMeal]: {
          ...prev[selectedMeal],
          foods: newFoods,
        },
      }));
      
      setEditingQuantities(prev => ({ ...prev, [`${selectedMeal}-${idx}`]: quantity }));
      
      setNotification({
        isOpen: true,
        message: "Quantity updated!",
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      setNotification({
        isOpen: true,
        message: "Failed to update quantity.",
      });
    }
  };

  const takeMealPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera, // Force camera (will use webcam in browser)
        quality: 50,
        width: 800,
        height: 800,
        allowEditing: false,
        promptLabelHeader: 'Take a Photo',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Picture',
      });

      const photoData = photo.dataUrl;
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      
      // Upload to server first (before saving locally to avoid localStorage quota)
      try {
        const photoSizeMB = (photoData.length / (1024 * 1024)).toFixed(2);
        console.log(`Uploading photo for ${selectedMeal}, user: ${userId}`);
        console.log(`Token exists: ${!!token}`);
        console.log(`Photo size: ${photoSizeMB} MB`);
        
        const response = await axios.post(`${API_BASE_URL}/meals/${date}/${selectedMeal}/photo`, 
          { photo: photoData },
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000 // 60 seconds for large photos over network
          }
        );
        
        console.log('Server response:', response.data);
        
        // Only update UI state after successful upload (don't save to localStorage - too big)
        const updatedPhotos = {
          ...mealPhotos,
          [selectedMeal]: [...(mealPhotos[selectedMeal] || []), photoData],
        };
        setMealPhotos(updatedPhotos);
        
        setNotification({
          isOpen: true,
          message: "Photo captured and uploaded!",
        });
      } catch (uploadError) {
        console.error("Failed to upload photo:", uploadError);
        if (uploadError.response) {
          console.error('Server error:', uploadError.response.status, uploadError.response.data);
          setNotification({
            isOpen: true,
            message: `Upload failed: ${uploadError.response.status} error`,
          });
        } else if (uploadError.request) {
          console.error('Network error - no response received');
          setNotification({
            isOpen: true,
            message: "Network error - photo saved locally",
          });
        } else {
          console.error('Error:', uploadError.message);
          setNotification({
            isOpen: true,
            message: "Upload error - photo saved locally",
          });
        }
      }
    } catch (error) {
      if (error.message !== 'User cancelled photos app') {
        console.error("Error taking photo:", error);
        setNotification({
          isOpen: true,
          message: "Failed to take photo.",
        });
      }
    }
  };

  const uploadMealPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Open gallery/file picker
        quality: 50,
        width: 800,
        height: 800,
      });

      const photoData = photo.dataUrl;
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      
      // Upload to server first (before saving locally to avoid localStorage quota)
      try {
        const photoSizeMB = (photoData.length / (1024 * 1024)).toFixed(2);
        console.log(`Uploading photo (gallery) for ${selectedMeal}, user: ${userId}`);
        console.log(`Token exists: ${!!token}`);
        console.log(`Photo size: ${photoSizeMB} MB`);
        
        const response = await axios.post(`${API_BASE_URL}/meals/${date}/${selectedMeal}/photo`, 
          { photo: photoData },
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000 // 60 seconds for large photos over network
          }
        );
        
        console.log('Server response:', response.data);
        
        // Only update UI state after successful upload (don't save to localStorage - too big)
        const updatedPhotos = {
          ...mealPhotos,
          [selectedMeal]: [...(mealPhotos[selectedMeal] || []), photoData],
        };
        setMealPhotos(updatedPhotos);
        
        setNotification({
          isOpen: true,
          message: "Photo uploaded successfully!",
        });
      } catch (uploadError) {
        console.error("Failed to upload photo:", uploadError);
        if (uploadError.response) {
          console.error('Server error:', uploadError.response.status, uploadError.response.data);
          setNotification({
            isOpen: true,
            message: `Upload failed: ${uploadError.response.status} error`,
          });
        } else if (uploadError.request) {
          console.error('Network error - no response received');
          setNotification({
            isOpen: true,
            message: "Network error - photo saved locally",
          });
        } else {
          console.error('Error:', uploadError.message);
          setNotification({
            isOpen: true,
            message: "Upload error - photo saved locally",
          });
        }
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setNotification({
        isOpen: true,
        message: "Failed to upload photo.",
      });
    }
  };

  const deleteMealPhoto = (photoIndex) => {
    const updatedPhotos = { ...mealPhotos };
    if (updatedPhotos[selectedMeal]) {
      updatedPhotos[selectedMeal] = updatedPhotos[selectedMeal].filter((_, idx) => idx !== photoIndex);
      if (updatedPhotos[selectedMeal].length === 0) {
        delete updatedPhotos[selectedMeal];
      }
    }
    setMealPhotos(updatedPhotos);
    
    // Delete from server with auth (no localStorage - too big for photos)
    const token = localStorage.getItem('authToken');
    console.log(`Deleting photo ${photoIndex} for ${selectedMeal}`);
    axios.delete(`${API_BASE_URL}/meals/${date}/${selectedMeal}/photo/${photoIndex}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => console.log('Photo deleted from server:', response.data))
      .catch(err => {
        console.error("Failed to delete photo from server:", err);
        if (err.response) {
          console.error('Server error:', err.response.status, err.response.data);
        }
      });
    
    setNotification({
      isOpen: true,
      message: "Photo deleted",
    });
  };

  return (
    <>
      <IonContent>
      <IonToast
        isOpen={notification.isOpen}
        onDidDismiss={() => setNotification({ isOpen: false, message: "" })}
        message={notification.message}
        duration={3000}
        position="top"
      />
      <div style={{ margin: "20px 16px 16px 16px" }}>
        <IonSegment
          value={selectedMeal}
          onIonChange={(e) => setSelectedMeal(e.detail.value)}
        >
          {mealOptions.map((opt) => (
            <IonSegmentButton key={opt.key} value={opt.key}>
              {opt.label}
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px',
        background: isEditMode ? '#f0f9ff' : 'transparent',
        borderRadius: '8px',
        margin: '0 16px 16px 16px',
        transition: 'background 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonIcon 
            icon={isEditMode ? checkmarkOutline : createOutline} 
            style={{ fontSize: '20px', color: isEditMode ? '#0066cc' : '#666' }}
          />
          <span style={{ 
            fontSize: '0.95em', 
            fontWeight: 500,
            color: isEditMode ? '#0066cc' : '#666',
            textTransform: 'capitalize'
          }}>
            {isEditMode ? `Editing ${selectedMeal}` : `Edit meals for ${selectedMeal}`}
          </span>
        </div>
        <IonButton 
          onClick={toggleEditMode} 
          fill="clear" 
          size="small"
          style={{ margin: 0 }}
        >
          {isEditMode ? 'Done' : 'Edit'}
        </IonButton>
      </div>
      <div style={{ padding: 16 }}>
        {loading ? (
          <IonList>
            {[1, 2, 3].map((i) => (
              <IonItem key={i}>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: "60%" }} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : !meals ? (
          <div className="ion-padding">No meals found</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2 style={{ textTransform: "capitalize", margin: 0 }}>
                {selectedMeal}
              </h2>
              {meals[selectedMeal]?.time && (
                <IonNote style={{ fontSize: "0.9em", marginLeft: 16 }}>
                  {meals[selectedMeal].time}
                </IonNote>
              )}
            </div>

            {/* Meal Photos Gallery */}
            {mealPhotos[selectedMeal] && mealPhotos[selectedMeal].length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '8px',
                }}>
                  {mealPhotos[selectedMeal].map((photo, idx) => (
                    <div key={idx} style={{ 
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                    }}>
                      <img 
                        src={photo} 
                        alt={`${selectedMeal} photo ${idx + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      {isEditMode && (
                        <IonButton
                          fill="solid"
                          color="danger"
                          size="small"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            height: '28px',
                            fontSize: '0.75rem'
                          }}
                          onClick={() => deleteMealPhoto(idx)}
                        >
                          ×
                        </IonButton>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Camera & Upload Buttons in Edit Mode */}
            {isEditMode && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: 16 
              }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={takeMealPhoto}
                  style={{ flex: 1 }}
                >
                  <IonIcon slot="start" icon={cameraOutline} />
                  Take Photo
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={uploadMealPhoto}
                  style={{ flex: 1 }}
                >
                  <IonIcon slot="start" icon={add} />
                  Upload Photo
                </IonButton>
              </div>
            )}

            {!foods || foods.length === 0 ? (
              <IonNote>No foods added</IonNote>
            ) : (
              <>
                <IonBadge color="primary" style={{ marginBottom: "8px" }}>
                  {getTotalCalories(foods)} kcal
                </IonBadge>
                <IonList lines="none">
                  {foods.map((food, idx) => (
                    <IonItemSliding key={idx} disabled={!isEditMode}>
                      <IonItem>
                        <IonLabel>
                          {food.name}
                          <p>{food.calories * food.quantity} kcal</p>
                        </IonLabel>
                        {isEditMode ? (
                          <IonInput
                            type="number"
                            value={editingQuantities[`${selectedMeal}-${idx}`]}
                            placeholder="Qty"
                            style={{ maxWidth: "80px", textAlign: "right" }}
                            onIonChange={(e) => setEditingQuantities(prev => ({ ...prev, [`${selectedMeal}-${idx}`]: e.detail.value }))}
                            onIonBlur={(e) => {
                              const newQty = parseInt(e.detail.value) || 1;
                              if (newQty !== food.quantity) {
                                updateQuantity(food.id, idx, newQty);
                              }
                            }}
                          />
                        ) : (
                          <IonNote slot="end">x{food.quantity}</IonNote>
                        )}
                      </IonItem>
                      {isEditMode && (
                        <IonItemOptions side="end">
                          <IonItemOption color="danger" onClick={() => removeFood(food.id, idx)}>
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      )}
                    </IonItemSliding>
                  ))}
                </IonList>
              </>
            )}
          </>
        )}
      </div>

      {isEditMode && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsAddFoodModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      )}

      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        onAddFood={handleAddFood}
        mealType={selectedMeal}
      />
    </IonContent>
    </>
  );
}
