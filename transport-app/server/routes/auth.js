const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const db = require('../server').db;

// Twilio setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP and send via SMS
router.post('/request-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    // Store OTP in database (in production, use Redis with expiration)
    db.run('INSERT OR REPLACE INTO otps (phone, code) VALUES (?, ?)', [phone, otp]);

    // Send SMS (commented out for development)
    // await client.messages.create({
    //   body: `Your transport app OTP is ${otp}`,
    //   from: process.env.TWILIO_NUMBER,
    //   to: phone
    // });

    console.log(`OTP for ${phone}: ${otp}`); // For development only
    res.json({ success: true });
  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and generate JWT
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  db.get('SELECT code FROM otps WHERE phone = ?', [phone], (err, row) => {
    if (err || !row || row.code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check if driver exists
    db.get('SELECT id FROM drivers WHERE phone = ?', [phone], (err, driver) => {
      const token = jwt.sign(
        { phone, driverId: driver?.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ token, isRegistered: !!driver });
    });
  });
});

// Driver registration
router.post('/register', (req, res) => {
  const { phone, name, vehicleNumber } = req.body;
  
  db.run(
    'INSERT INTO drivers (phone, name, vehicle_number) VALUES (?, ?, ?)',
    [phone, name, vehicleNumber],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Registration failed' });
      }
      const token = jwt.sign(
        { phone, driverId: this.lastID },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ token });
    }
  );
});

module.exports = router;
