module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_NUMBER: process.env.TWILIO_NUMBER,
  PORT: process.env.PORT || 8000
};
