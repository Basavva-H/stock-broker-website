# Stock Broker Client Web Dashboard

A real-time stock trading dashboard that allows multiple users to subscribe to stocks, view live price updates, and track portfolio values with interactive charts and graphs.

## Features

### Core Functionality
- **User Authentication** - Secure sign-up and sign-in with JWT tokens and password hashing
- **Multi-User Support** - Multiple users can log in simultaneously in different browser tabs with independent sessions
- **Real-Time Stock Updates** - Live price updates every second without page refresh using WebSocket (Socket.IO)
- **Stock Subscription** - Subscribe/unsubscribe to 5 supported stocks: GOOG, TSLA, AMZN, META, NVDA
- **Portfolio Tracking** - Real-time portfolio value calculation (sum of all subscribed stocks)
- **Interactive Charts** - Timeline-based graphs with Day, Month, and Year views
- **Filtered Display** - Subscribed stocks automatically hidden from available stocks list

### UI/UX Features
- Modern stock trading theme with dark backgrounds and cyan accents
- Side-by-side layout (subscribed stocks | available stocks)
- Advanced CSS animations and hover effects
- Responsive design with optimized dimensions
- Form validation with real-time error feedback
- Smooth navigation between pages
- Connection status indicator

## Tech Stack

### Frontend
- **React** - Component-based UI library
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time WebSocket connection
- **CSS3** - Custom styling with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## Installation & Setup

### 1. Download and Extract

Download the project ZIP file and extract it to your desired location.

\`\`\`bash
cd stock-broker-dashboard
\`\`\`

### 2. Install Dependencies

**Backend:**
\`\`\`bash
cd backend
npm install
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
npm install
\`\`\`

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

\`\`\`env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockbroker
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
\`\`\`

### 4. Start MongoDB

Open a new terminal and start MongoDB:

\`\`\`bash
mongod
\`\`\`

Leave this terminal running.

### 5. Start Backend Server

Open a new terminal:

\`\`\`bash
cd backend
npm start
\`\`\`

You should see:
\`\`\`
✅ Server running on port 5000
✅ MongoDB connected successfully
✅ Socket.IO server running
\`\`\`

### 6. Start Frontend Application

Open a new terminal:

\`\`\`bash
cd frontend
npm start
\`\`\`

Your browser should automatically open to `http://localhost:3000`

## Usage Guide

### Creating an Account

1. Navigate to `http://localhost:3000`
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in your name, email, and password
4. Click **"Sign Up"**

### Signing In

1. Click **"Sign In"** from the home page
2. Enter your email and password
3. Click **"Sign In"**

### Subscribing to Stocks

1. In the dashboard, scroll to **"Available Stocks"** section on the right
2. Click **"Subscribe"** button on any stock card (GOOG, TSLA, AMZN, META, NVDA)
3. The stock will move to **"Your Subscribed Stocks"** section on the left
4. Real-time price updates will start immediately

### Unsubscribing from Stocks

1. In **"Your Subscribed Stocks"** section, click the **✕** button on any mini stock card
2. The stock will move back to **"Available Stocks"** section

### Viewing Charts

1. Subscribed stocks automatically display in the **"Stock Charts"** section
2. Click **Day**, **Month**, or **Year** buttons to change timeline view
3. Hover over bars to see exact price values

### Testing Multi-User Support

1. Open **Tab 1** in your browser
2. Sign in as User A (e.g., `usera@example.com`)
3. Subscribe to GOOG and TSLA

4. Open **Tab 2** in the same browser
5. Sign in as User B (e.g., `userb@example.com`)
6. Subscribe to AMZN and META

Both tabs will show different portfolios updating in real-time independently.


## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Login user and get JWT token

### Stocks

- `GET /api/stocks/subscriptions` - Get user's subscribed stocks (requires auth)
- `POST /api/stocks/subscribe` - Subscribe to a stock (requires auth)
- `DELETE /api/stocks/unsubscribe/:ticker` - Unsubscribe from a stock (requires auth)

### WebSocket Events

- `connection` - Client connects to Socket.IO
- `authenticate` - Client sends JWT for authentication
- `stockPriceUpdate` - Server broadcasts price updates every second
- `disconnect` - Client disconnects

## Deployment

For production deployment to the internet (free), follow the **DEPLOYMENT_GUIDE.md** file.

### Recommended Free Hosting:

- **Database**: MongoDB Atlas (512MB free)
- **Backend**: Render (750 hours/month free)
- **Frontend**: Vercel or Netlify (unlimited free tier)

**Total Cost: $0/month**

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

**Frontend:**
\`\`\`bash
# Change port in package.json or use:
PORT=3001 npm start
\`\`\`

**Backend:**
\`\`\`bash
# Update .env file:
PORT=5001
\`\`\`

### MongoDB Connection Error

Ensure MongoDB is running:
\`\`\`bash
mongod
\`\`\`

If still having issues, check if MongoDB is installed correctly:
\`\`\`bash
mongod --version
\`\`\`

### WebSocket Connection Failed

1. Check that backend is running on port 5000
2. Verify frontend is pointing to correct backend URL in config
3. Check browser console for connection errors

### Stocks Not Updating

1. Verify Socket.IO connection status (check "Status: Connected" on dashboard)
2. Open browser console and look for WebSocket errors
3. Restart both backend and frontend servers

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge



---

**Happy Trading! 📈**
