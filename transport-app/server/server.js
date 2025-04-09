const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./transport.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      name TEXT,
      vehicle_number TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER,
      from_address TEXT,
      to_address TEXT,
      date DATE DEFAULT CURRENT_DATE,
      distance REAL,
      FOREIGN KEY(driver_id) REFERENCES drivers(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      amount REAL,
      fuel_cost REAL,
      status TEXT CHECK(status IN ('paid', 'unpaid', 'accountable')),
      FOREIGN KEY(trip_id) REFERENCES trips(id)
    )`);
  });
}

// Import routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
