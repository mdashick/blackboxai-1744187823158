# Transport Business Management App

## Overview
Digital solution for Indian transport businesses to replace paper-based trip logging. Includes:
- Driver mobile app (React Native)
- Owner web dashboard (React.js)
- Backend API (Node.js/Express)

## Features
### Driver App
- Phone number login (OTP)
- Trip entry with address dropdowns
- Payment and fuel cost tracking
- Offline support

### Owner Dashboard
- Real-time trip monitoring
- Payment summaries
- Driver management
- Reporting

## Setup Instructions
1. Install dependencies: `npm install`
2. Configure database in `server/config.js`
3. Start mobile app: `cd mobile && npm start`
4. Start web app: `cd web && npm start`
5. Start backend: `cd server && npm start`
