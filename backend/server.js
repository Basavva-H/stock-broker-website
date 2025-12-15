const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketIO = require("socket.io")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection

  mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.log("❌ MongoDB error:", err))


// Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  subscribedStocks: [String],
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)

// Supported stocks
const SUPPORTED_STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"]

const userSockets = new Map() // Maps socket.id to user info
const userSocketsPerUserId = new Map() // Maps userId to array of socket IDs

// Stock prices (in-memory storage with random updates)
const stockPrices = {}
SUPPORTED_STOCKS.forEach((stock) => {
  stockPrices[stock] = Number.parseFloat((Math.random() * 500 + 50).toFixed(2))
})

// Authentication Middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
  } catch {
    return null
  }
}

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    supportedStocks: SUPPORTED_STOCKS,
  })
})


// Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      email,
      password: hashedPassword,
      name,
      subscribedStocks: [],
    })

    await user.save()

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Sign In
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscribedStocks: user.subscribedStocks,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get Supported Stocks
app.get("/api/stocks/supported", (req, res) => {
  res.json({ stocks: SUPPORTED_STOCKS })
})

// Get Current Stock Prices
app.get("/api/stocks/prices", (req, res) => {
  res.json({ prices: stockPrices })
})

// Subscribe to Stock
app.post("/api/stocks/subscribe", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { stockSymbol } = req.body

    if (!SUPPORTED_STOCKS.includes(stockSymbol)) {
      return res.status(400).json({ error: "Stock not supported" })
    }

    const user = await User.findById(decoded.userId)
    if (!user.subscribedStocks.includes(stockSymbol)) {
      user.subscribedStocks.push(stockSymbol)
      await user.save()
    }

    res.json({
      message: "Subscribed",
      subscribedStocks: user.subscribedStocks,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Unsubscribe from Stock
app.post("/api/stocks/unsubscribe", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { stockSymbol } = req.body
    const user = await User.findById(decoded.userId)
    user.subscribedStocks = user.subscribedStocks.filter((s) => s !== stockSymbol)
    await user.save()

    res.json({
      message: "Unsubscribed",
      subscribedStocks: user.subscribedStocks,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get User Subscriptions
app.get("/api/user/subscriptions", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await User.findById(decoded.userId)
    res.json({ subscribedStocks: user.subscribedStocks })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// WebSocket Connections - Improved multi-user support
io.on("connection", (socket) => {
  console.log("  New client connected:", socket.id)

  socket.on("authenticate", (token) => {
    const decoded = verifyToken(token)
    if (decoded) {
      const userInfo = {
        userId: decoded.userId,
        email: decoded.email,
        subscribedStocks: [],
      }

      userSockets.set(socket.id, userInfo)

      // Track multiple connections per user
      if (!userSocketsPerUserId.has(decoded.userId)) {
        userSocketsPerUserId.set(decoded.userId, [])
      }
      userSocketsPerUserId.get(decoded.userId).push(socket.id)

      console.log(
        `  User ${decoded.email} authenticated. Active connections for this user: ${userSocketsPerUserId.get(decoded.userId).length}`,
      )

      socket.emit("authenticated", { message: "Connected", userId: decoded.userId })
    } else {
      console.log(" Authentication failed for socket:", socket.id)
      socket.emit("auth-error", { message: "Invalid token" })
    }
  })

  socket.on("subscribe-stock", (stockSymbol) => {
    if (userSockets.has(socket.id)) {
      const userData = userSockets.get(socket.id)
      if (!userData.subscribedStocks.includes(stockSymbol)) {
        userData.subscribedStocks.push(stockSymbol)
      }
      socket.join(`stock-${stockSymbol}`)
      console.log(`  Socket ${socket.id} subscribed to ${stockSymbol}`)
    }
  })

  socket.on("disconnect", () => {
    if (userSockets.has(socket.id)) {
      const userInfo = userSockets.get(socket.id)
      const userId = userInfo.userId

      // Remove this socket from the user's active connections
      if (userSocketsPerUserId.has(userId)) {
        const socketIds = userSocketsPerUserId.get(userId)
        userSocketsPerUserId.set(
          userId,
          socketIds.filter((id) => id !== socket.id),
        )

        console.log(
          `  User disconnected. Active connections for this user: ${userSocketsPerUserId.get(userId).length}`,
        )

        // If no more connections for this user, remove the entry
        if (userSocketsPerUserId.get(userId).length === 0) {
          userSocketsPerUserId.delete(userId)
        }
      }

      userSockets.delete(socket.id)
    }
    console.log("  Client disconnected:", socket.id)
  })
})

// Function to update stock prices every second and broadcast to ALL connected clients
setInterval(() => {
  SUPPORTED_STOCKS.forEach((stock) => {
    const change = (Math.random() - 0.5) * 10
    const newPrice = Math.max(Number.parseFloat((stockPrices[stock] + change).toFixed(2)), 10)
    stockPrices[stock] = newPrice
  })

  io.emit("price-update", { prices: stockPrices, timestamp: Date.now() })
}, 1000)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log("Waiting for WebSocket connections...")
})
