# Nutritional Tracker (Ionic React)

A small Ionic React application (Vite) demonstrating:

- Master-detail UI using Ionic SplitPane
- Fetching data from a REST API
- Receiving real-time notifications from the server via WebSockets (socket.io)

Features

- Food list (master) showing foods and calories
- Food detail view showing more information and option to add to daily log
- REST API to retrieve foods and log entries
- Server emits notifications (e.g., "New recommended food") via WebSockets

Repository layout

- client/ - Ionic React front-end (Vite)
- server/ - Express + socket.io REST and WebSocket server

Run locally

1. Install dependencies for both client and server

```powershell
cd d:/mobile-new/server; npm install
cd d:/mobile-new/client; npm install
```

2. Start the server

```powershell
cd d:/mobile-new/server; npm start
```

3. Start the client dev server

```powershell
cd d:/mobile-new/client; npm run dev
```

Open the client in the browser (Vite will show the URL, usually http://localhost:5173)

Notes

- This is a lightweight demo and isn't production hardened.
- You can extend the mock server to persist logs to a database.
