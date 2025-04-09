const express = require('express');
const router = express.Router();
const db = require('../server').db;
const { authenticateDriver, authenticateOwner } = require('../middleware/auth');

// Driver submits a new trip
router.post('/', authenticateDriver, (req, res) => {
  const { from_address, to_address, distance, amount, fuel_cost } = req.body;
  const driver_id = req.user.driverId;

  db.serialize(() => {
    db.run(
      'INSERT INTO trips (driver_id, from_address, to_address, distance) VALUES (?, ?, ?, ?)',
      [driver_id, from_address, to_address, distance],
      function(err) {
        if (err) return res.status(400).json({ error: 'Failed to create trip' });

        const trip_id = this.lastID;
        db.run(
          'INSERT INTO payments (trip_id, amount, fuel_cost, status) VALUES (?, ?, ?, ?)',
          [trip_id, amount, fuel_cost, 'unpaid'],
          function(err) {
            if (err) return res.status(400).json({ error: 'Failed to record payment' });
            res.json({ trip_id });
          }
        );
      }
    );
  });
});

// Driver views their trips
router.get('/driver', authenticateDriver, (req, res) => {
  const driver_id = req.user.driverId;
  const { date } = req.query;

  let query = `
    SELECT t.id, t.from_address, t.to_address, t.date, t.distance, 
           p.amount, p.fuel_cost, p.status
    FROM trips t
    JOIN payments p ON t.id = p.trip_id
    WHERE t.driver_id = ?
  `;
  const params = [driver_id];

  if (date) {
    query += ' AND t.date = ?';
    params.push(date);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Owner views all trips
router.get('/owner', authenticateOwner, (req, res) => {
  const { date, driver_id } = req.query;

  let query = `
    SELECT t.id, d.name, d.vehicle_number, t.from_address, t.to_address, 
           t.date, t.distance, p.amount, p.fuel_cost, p.status
    FROM trips t
    JOIN drivers d ON t.driver_id = d.id
    JOIN payments p ON t.id = p.trip_id
  `;
  const params = [];

  if (date) {
    query += ' WHERE t.date = ?';
    params.push(date);
  }
  if (driver_id) {
    query += params.length ? ' AND' : ' WHERE';
    query += ' t.driver_id = ?';
    params.push(driver_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Owner updates payment status
router.patch('/:id/status', authenticateOwner, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['paid', 'unpaid', 'accountable'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE payments SET status = ? WHERE trip_id = ?',
    [status, id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Trip not found' });
      res.json({ success: true });
    }
  );
});

module.exports = router;
