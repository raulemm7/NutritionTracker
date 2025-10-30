const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const WS_SECRET = process.env.WS_SECRET || "CHANGE_THIS_SECRET";

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("welcome", { message: "Welcome to Nutrition Server" });

  socket.on("dateChange", (date) => {
    // Broadcast the date change to all clients
    io.emit("userDateChanged", {
      userId: socket.id,
      date: date,
    });

    // Emit a notification event for the alerts page
    io.emit("notification", {
      type: "date-change",
      title: "Date Changed",
      message: `Date changed to ${date}`,
      timestamp: new Date().toISOString(),
      userId: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const dbPath = path.join(__dirname, "db.json");

// Helper to read/write db
const readDb = () => {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
};

const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET foods list
app.get("/api/foods", (req, res) => {
  const db = readDb();
  res.json(db.foods);
});

// Simple login endpoint - returns JWT
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log("/api/login body:", req.body);
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  const db = readDb();
  const user = (db.users || []).find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // support either plaintext or bcrypt-hashed passwords in db
  const isHashed =
    typeof user.password === "string" && user.password.startsWith("$2");
  const passwordMatches = isHashed
    ? bcrypt.compareSync(password, user.password)
    : password === user.password;

  if (!passwordMatches)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, username: user.username }, WS_SECRET, {
    expiresIn: "8h",
  });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// Verify token endpoint
app.get("/api/verify", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, WS_SECRET);
    return res.json({ user: { id: payload.id, username: payload.username } });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// GET food detail
app.get("/api/foods/:id", (req, res) => {
  const db = readDb();
  const food = db.foods.find((x) => x.id === req.params.id);
  if (!food) return res.status(404).json({ error: "Not found" });
  res.json(food);
});

// GET meals for a date
app.get("/api/meals/:date", (req, res) => {
  const db = readDb();
  const meals = db.meals[req.params.date] || {
    breakfast: { time: "08:00", foods: [] },
    lunch: { time: "12:30", foods: [] },
    dinner: { time: "19:00", foods: [] },
  };
  res.json(meals);
});

// POST add food to a meal
app.post("/api/meals/:date/:meal", (req, res) => {
  const { date, meal } = req.params;
  const { foodId, quantity } = req.body;

  const db = readDb();
  const food = db.foods.find((f) => f.id === foodId);
  if (!food) return res.status(404).json({ error: "Food not found" });

  // Initialize date and meal if they don't exist
  if (!db.meals[date]) {
    db.meals[date] = {
      breakfast: { time: "08:00", foods: [] },
      lunch: { time: "12:30", foods: [] },
      dinner: { time: "19:00", foods: [] },
    };
  }

  // Add food to meal
  const mealEntry = {
    id: food.id,
    name: food.name,
    calories: food.calories,
    quantity: quantity || 1,
  };

  db.meals[date][meal].foods.push(mealEntry);
  writeDb(db);

  // Notify clients
  io.emit("meal-updated", { date, meal, foods: db.meals[date][meal].foods });

  res.status(201).json(mealEntry);
});

// PATCH update meal time
app.patch("/api/meals/:date/:meal/time", (req, res) => {
  const { date, meal } = req.params;
  const { time } = req.body;

  const db = readDb();
  if (!db.meals[date] || !db.meals[date][meal]) {
    return res.status(404).json({ error: "Meal not found" });
  }

  db.meals[date][meal].time = time;
  writeDb(db);

  io.emit("meal-time-updated", { date, meal, time });
  res.json({ time });
});

// (welcome message is emitted from the main connection handler)

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("Server listening on", PORT));
