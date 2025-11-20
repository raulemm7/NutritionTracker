# 📱 Setup pentru Testare pe Telefon

## IP-ul Tău
**Laptop IP:** `192.168.100.69`

## 🚀 Pași pentru Rulare

### 1. Pe Laptop (Server)
```bash
cd D:\mobile-new\server
npm start
```
Server-ul va rula pe: `http://192.168.100.69:4000`

### 2. Pe Laptop (Client - pentru verificare în browser)
```bash
cd D:\mobile-new\client
npm run dev:network
```
Va afișa ceva gen:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.100.69:5173/
```

### 3. Pe Telefon

#### Opțiunea A: Browser Direct (Testing rapid)
1. Deschide browser-ul pe telefon
2. Mergi la: `http://192.168.100.69:5173`
3. Login și testează (camera va funcționa parțial)

#### Opțiunea B: Capacitor (Camera Nativă - RECOMANDAT)

**Setup inițial (doar o dată):**
```bash
cd D:\mobile-new\client

# Instalează Capacitor CLI dacă nu ai
npm install -g @capacitor/cli

# Inițializează Capacitor
npx cap init

# Când îți cere:
# App name: Nutrition App
# Package ID: com.nutrition.app

# Adaugă platformă Android
npx cap add android
```

**Build și Deploy:**
```bash
# Build aplicația
npm run build

# Sync cu Capacitor
npx cap sync

# Deschide în Android Studio
npx cap open android
```

**În Android Studio:**
1. Conectează telefonul la laptop prin USB
2. Activează "USB Debugging" pe telefon
3. Selectează device-ul tău
4. Apasă "Run" (triunghiul verde)

## 🔧 Configurare Completă

### Fișiere Modificate:

1. **`.env`** - Variabile de mediu
```env
VITE_API_HOST=192.168.100.69
VITE_API_PORT=4000
```

2. **`src/config.js`** - Configurație centralizată
```javascript
const API_HOST = '192.168.100.69';
const API_PORT = '4000';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;
export const SOCKET_URL = `http://${API_HOST}:${API_PORT}`;
```

3. **Server** - Ascultă pe toate interfețele
```javascript
server.listen(4000, '0.0.0.0');
```

## 📸 Testare Camera

### Browser (laptop/telefon):
- "Take Photo" → va deschide webcam/camera front
- "Upload Photo" → va deschide file picker

### App Nativă (Capacitor):
- "Take Photo" → deschide Camera app nativă ✅
- "Upload Photo" → deschide galeria ✅

## ⚠️ Troubleshooting

### 1. Telefonul nu se conectează
- Verifică că ambele device-uri sunt în **aceeași rețea WiFi**
- Verifică firewall-ul pe laptop:
  ```powershell
  # Permite portul 4000 și 5173
  netsh advfirewall firewall add rule name="Node Server" dir=in action=allow protocol=TCP localport=4000
  netsh advfirewall firewall add rule name="Vite Dev" dir=in action=allow protocol=TCP localport=5173
  ```

### 2. IP-ul s-a schimbat
- Rulează din nou `ipconfig` pentru IP nou
- Actualizează `.env`:
  ```bash
  ipconfig | Select-String "IPv4"
  # Schimbă în .env noul IP
  ```

### 3. Camera nu funcționează în browser
- Normal! Browser-ul are limitări
- Folosește Capacitor + Android Studio pentru cameră nativă

### 4. Photos prea mari
- Server-ul acum acceptă până la 50MB (`express.json({ limit: '50mb' })`)
- Pozele sunt comprimate la 80% quality și 800px width

## 🎯 Verificare Rapidă

**Test pe telefon în browser:**
```
http://192.168.100.69:5173
```

**Login credențiale:**
- User: `alice` / `bob`
- Pass: `password`

## 📝 Note Importante

1. **Development**: Browser este OK pentru teste rapide
2. **Camera Testing**: Trebuie Capacitor + device fizic
3. **Network**: Asigură-te că firewall-ul permite conexiunile
4. **Photos**: Sunt salvate local (localStorage) + server (db.json)

## 🔄 Workflow Recomandat

1. Dezvoltare pe laptop (browser)
2. Test funcționalitate pe laptop
3. Build + Deploy pe telefon pentru teste camera
4. Iterează

---

**IP Curent:** `192.168.100.69`  
**Port Server:** `4000`  
**Port Client:** `5173` (Vite dev server)
