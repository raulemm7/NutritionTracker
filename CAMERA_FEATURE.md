# Camera Feature Implementation

## Cerință
- Use camera: ✅ 1p
- Show photo when resource is shown (list/view/edit): ✅ 1p
- Save photo on device: ✅ 1p
- Upload photo: ✅ 1p

## Implementare

### 1. Use Camera (1p)
**Locație:** `client/src/pages/MealList.jsx`

- Folosește `@capacitor/camera` plugin
- Funcția `takeMealPhoto()` permite utilizatorului să facă poză folosind camera device-ului
- Setări cameră:
  - `CameraResultType.DataUrl` - returnează poza ca base64
  - `CameraSource.Camera` - deschide camera
  - `quality: 80` - compresie pentru optimizare
  - `width: 800` - resize pentru a reduce dimensiunea

```javascript
const photo = await Camera.getPhoto({
  resultType: CameraResultType.DataUrl,
  source: CameraSource.Camera,
  quality: 80,
  width: 800,
});
```

### 2. Show Photo (1p)
**Locație:** `client/src/pages/MealList.jsx` (liniile 390-425)

- Poza se afișează în pagina de meal list pentru meal-ul selectat
- Vizibilă în:
  - **View mode**: Poza se afișează fără butoane de control
  - **Edit mode**: Poza se afișează cu butoane "Retake" și "Delete"
- Design responsive cu `max-height: 300px` și `objectFit: cover`

```jsx
{mealPhotos[selectedMeal] && (
  <div>
    <img src={mealPhotos[selectedMeal]} alt={`${selectedMeal} photo`} />
    {isEditMode && <buttons>...</buttons>}
  </div>
)}
```

### 3. Save Photo on Device (1p)
**Locație:** `client/src/pages/MealList.jsx` - funcția `takeMealPhoto()`

- Poza se salvează în **localStorage** (persistent storage pe device)
- Key format: `meal_photos_{date}` - permite organizare pe date
- Salvează toate pozele pentru meal-urile unei zile într-un singur obiect JSON
- Se încarcă automat la deschiderea unei date

```javascript
localStorage.setItem(`meal_photos_${date}`, JSON.stringify(updatedPhotos));
```

**Load la startup:**
```javascript
const savedPhotos = localStorage.getItem(`meal_photos_${date}`);
if (savedPhotos) {
  setMealPhotos(JSON.parse(savedPhotos));
}
```

### 4. Upload Photo (1p)
**Locație:** 
- Client: `client/src/pages/MealList.jsx` - funcția `takeMealPhoto()`
- Server: `server/index.js` - endpoint `POST /api/meals/:date/:meal/photo`

**Upload flow:**
1. După ce poza e făcută și salvată local, se face automat upload la server
2. Request POST cu poza ca base64 în body
3. Serverul salvează poza în `db.json` sub meal-ul corespunzător
4. Fallback: dacă upload-ul eșuează (offline), poza rămâne salvată local

```javascript
await axios.post(`http://localhost:4000/api/meals/${date}/${selectedMeal}/photo`, {
  photo: photoData,
});
```

**Server endpoint:**
```javascript
app.post("/api/meals/:date/:meal/photo", authMiddleware, (req, res) => {
  db.meals[req.user.id][date][meal].photo = photo;
  writeDb(db);
  // Emit socket event for real-time sync
});
```

## Funcționalități Extra

### Delete Photo
- Buton "Delete" în edit mode
- Șterge din localStorage și din server
- Funcția `deleteMealPhoto()`

### Retake Photo
- Buton "Retake" pentru a înlocui poza existentă
- Suprascrie poza curentă în localStorage și pe server

### Sync Server-Client
- La încărcarea meals-urilor, pozele de pe server se sincronizează cu localStorage
- Server photos au prioritate (override local)
- Asigură consistență între device-uri

### Real-time Updates
- Socket.io events: `meal-photo-updated`, `meal-photo-deleted`
- Notificări pentru utilizator: success/error toasts

## UX Flow

1. **Enter Edit Mode**: Apasă butonul "Edit"
2. **Take Photo**: 
   - Dacă nu există poză: buton "Take Photo of {breakfast/lunch/dinner}"
   - Dacă există poză: butoane "Retake" și "Delete" overlay pe poză
3. **Camera Opens**: Native camera app se deschide
4. **Photo Saved**: Poza apare imediat în UI
5. **Upload**: Upload automat în background
6. **View**: Exit edit mode pentru a vedea poza fără butoane

## Structură Date

### localStorage
```json
{
  "meal_photos_2025-11-20": {
    "breakfast": "data:image/jpeg;base64,...",
    "lunch": "data:image/jpeg;base64,...",
    "dinner": "data:image/jpeg;base64,..."
  }
}
```

### Server (db.json)
```json
{
  "meals": {
    "u1": {
      "2025-11-20": {
        "breakfast": {
          "time": "07:30",
          "foods": [...],
          "photo": "data:image/jpeg;base64,..."
        }
      }
    }
  }
}
```

## Testing

1. **Device Testing**: Rulează app pe device fizic sau emulator cu cameră
2. **Browser Testing**: În browser, camera API-ul poate folosi webcam-ul
3. **Offline Testing**: Oprește serverul și verifică că poza se salvează local
4. **Upload Testing**: Pornește serverul și verifică că poza apare în db.json

## Dependencies
- `@capacitor/camera` - ^6.x (instalat)
- Ionic React components
- axios pentru API calls

## Note
- Pozele sunt salvate ca base64 DataURL
- Compresie 80% și resize la 800px pentru optimizare
- Funcționează offline (localStorage) cu upload când online
- Per-meal photo (fiecare breakfast/lunch/dinner poate avea poză)
