const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const dbPath = path.join(__dirname, 'db.json');

// Helper to read/write db
const readDb = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET foods list
app.get('/api/foods', (req, res) => {
  const db = readDb();
  res.json(db.foods);
});

// GET food detail
app.get('/api/foods/:id', (req, res) => {
  const db = readDb();
  const food = db.foods.find(x => x.id === req.params.id);
  if (!food) return res.status(404).json({ error: 'Not found' });
  res.json(food);
});

// GET meals for a date
app.get('/api/meals/:date', (req, res) => {
  const db = readDb();
  const meals = db.meals[req.params.date] || {
    breakfast: { time: '08:00', foods: [] },
    lunch: { time: '12:30', foods: [] },
    dinner: { time: '19:00', foods: [] }
  };
  res.json(meals);
});

// POST add food to a meal
app.post('/api/meals/:date/:meal', (req, res) => {
  const { date, meal } = req.params;
  const { foodId, quantity } = req.body;
  
  const db = readDb();
  const food = db.foods.find(f => f.id === foodId);
  if (!food) return res.status(404).json({ error: 'Food not found' });

  // Initialize date and meal if they don't exist
  if (!db.meals[date]) {
    db.meals[date] = {
      breakfast: { time: '08:00', foods: [] },
      lunch: { time: '12:30', foods: [] },
      dinner: { time: '19:00', foods: [] }
    };
  }

  // Add food to meal
  const mealEntry = {
    id: food.id,
    name: food.name,
    calories: food.calories,
    quantity: quantity || 1
  };

  db.meals[date][meal].foods.push(mealEntry);
  writeDb(db);

  // Notify clients
  io.emit('meal-updated', { date, meal, foods: db.meals[date][meal].foods });
  
  res.status(201).json(mealEntry);
});

// PATCH update meal time
app.patch('/api/meals/:date/:meal/time', (req, res) => {
  const { date, meal } = req.params;
  const { time } = req.body;
  
  const db = readDb();
  if (!db.meals[date] || !db.meals[date][meal]) {
    return res.status(404).json({ error: 'Meal not found' });
  }

  db.meals[date][meal].time = time;
  writeDb(db);
  
  io.emit('meal-time-updated', { date, meal, time });
  res.json({ time });
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit('welcome', { message: 'Welcome to Nutrition Server' });

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server listening on', PORT));
