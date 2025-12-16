const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: ["http://localhost:3000", "https://stock-broker-dashboard-3hom.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://stock-broker-dashboard-3hom.onrender.com"],
    credentials: true,
  }),
)
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log("MongoDB error:", err))

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  subscribedStocks: [String],
  createdAt: { type: Date, default: Date.now },
})

const stockPriceSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  high: { type: Number },
  low: { type: Number },
  open: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
})

const stockInfoSchema = new mongoose.Schema({
  symbol: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  previousClose: { type: Number },
  dayHigh: { type: Number },
  dayLow: { type: Number },
  openPrice: { type: Number },
  updatedAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)
const StockPrice = mongoose.model("StockPrice", stockPriceSchema)
const StockInfo = mongoose.model("StockInfo", stockInfoSchema)

const SUPPORTED_STOCKS = [
  { symbol: "GOOG", name: "Alphabet Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
]

const userSockets = new Map()
const userSocketsPerUserId = new Map()

// In-memory current prices (also synced to DB)
const stockPrices = {}
const stockData = {}

const initializeStocks = async () => {
  for (const stock of SUPPORTED_STOCKS) {
    // Use Indian stock price range (in INR)
    const basePrice = Number.parseFloat((Math.random() * 5000 + 1000).toFixed(2))
    stockPrices[stock.symbol] = basePrice
    stockData[stock.symbol] = {
      price: basePrice,
      previousClose: basePrice,
      dayHigh: basePrice,
      dayLow: basePrice,
      openPrice: basePrice,
      change: 0,
      changePercent: 0,
    }

    // Update or create stock info in DB
    await StockInfo.findOneAndUpdate(
      { symbol: stock.symbol },
      {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: basePrice,
        previousClose: basePrice,
        dayHigh: basePrice,
        dayLow: basePrice,
        openPrice: basePrice,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    )
  }
  console.log("Stocks initialized in database")
}

// Initialize stocks when MongoDB connects
mongoose.connection.once("open", () => {
  initializeStocks()
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
    supportedStocks: SUPPORTED_STOCKS.map((s) => s.symbol),
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

app.get("/api/stocks/supported", async (req, res) => {
  try {
    const stocks = await StockInfo.find({})
    const symbols = stocks.length > 0 ? stocks.map((s) => s.symbol) : SUPPORTED_STOCKS.map((s) => s.symbol)
    res.json({ stocks: symbols, stocksData: stocks.length > 0 ? stocks : SUPPORTED_STOCKS })
  } catch (error) {
    res.json({ stocks: SUPPORTED_STOCKS.map((s) => s.symbol) })
  }
})

app.get("/api/stocks/prices", async (req, res) => {
  try {
    const prices = {}
    const stockInfos = await StockInfo.find({})
    stockInfos.forEach((stock) => {
      prices[stock.symbol] = stock.currentPrice
    })
    res.json({ prices: Object.keys(prices).length > 0 ? prices : stockPrices, stockData })
  } catch (error) {
    res.json({ prices: stockPrices, stockData })
  }
})

app.get("/api/stocks/history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params
    const { timeline } = req.query

    const startDate = new Date()

    if (timeline === "month") {
      startDate.setDate(startDate.getDate() - 30)
    } else if (timeline === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1)
    } else {
      // Default: last 24 hours for "day"
      startDate.setHours(startDate.getHours() - 24)
    }

    const history = await StockPrice.find({
      symbol: symbol.toUpperCase(),
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: 1 })
      .limit(500)

    res.json({ history, symbol })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/stocks/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params
    const stockInfo = await StockInfo.findOne({ symbol: symbol.toUpperCase() })

    if (!stockInfo) {
      return res.status(404).json({ error: "Stock not found" })
    }

    res.json({ stock: stockInfo })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
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
    const supportedSymbols = SUPPORTED_STOCKS.map((s) => s.symbol)

    if (!supportedSymbols.includes(stockSymbol)) {
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

// WebSocket Connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  socket.on("authenticate", (token) => {
    const decoded = verifyToken(token)
    if (decoded) {
      const userInfo = {
        userId: decoded.userId,
        email: decoded.email,
        subscribedStocks: [],
      }

      userSockets.set(socket.id, userInfo)

      if (!userSocketsPerUserId.has(decoded.userId)) {
        userSocketsPerUserId.set(decoded.userId, [])
      }
      userSocketsPerUserId.get(decoded.userId).push(socket.id)

      console.log(`User ${decoded.email} authenticated.`)
      socket.emit("authenticated", { message: "Connected", userId: decoded.userId })
    } else {
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
    }
  })

  socket.on("disconnect", () => {
    if (userSockets.has(socket.id)) {
      const userInfo = userSockets.get(socket.id)
      const userId = userInfo.userId

      if (userSocketsPerUserId.has(userId)) {
        const socketIds = userSocketsPerUserId.get(userId)
        userSocketsPerUserId.set(
          userId,
          socketIds.filter((id) => id !== socket.id),
        )

        if (userSocketsPerUserId.get(userId).length === 0) {
          userSocketsPerUserId.delete(userId)
        }
      }

      userSockets.delete(socket.id)
    }
    console.log("Client disconnected:", socket.id)
  })
})

setInterval(async () => {
  const timestamp = new Date()

  for (const stock of SUPPORTED_STOCKS) {
    const symbol = stock.symbol
    const previousPrice = stockPrices[symbol]
    const change = (Math.random() - 0.5) * 50 // INR fluctuation
    const newPrice = Math.max(Number.parseFloat((previousPrice + change).toFixed(2)), 100)

    stockPrices[symbol] = newPrice

    // Update stock data
    const data = stockData[symbol]
    data.price = newPrice
    data.change = Number.parseFloat((newPrice - data.openPrice).toFixed(2))
    data.changePercent = Number.parseFloat(((data.change / data.openPrice) * 100).toFixed(2))
    data.dayHigh = Math.max(data.dayHigh, newPrice)
    data.dayLow = Math.min(data.dayLow, newPrice)

    // Save price to history in DB
    try {
      const priceRecord = new StockPrice({
        symbol,
        price: newPrice,
        change: data.change,
        changePercent: data.changePercent,
        high: data.dayHigh,
        low: data.dayLow,
        open: data.openPrice,
        timestamp,
      })
      await priceRecord.save()

      // Update current stock info in DB
      await StockInfo.findOneAndUpdate(
        { symbol },
        {
          currentPrice: newPrice,
          dayHigh: data.dayHigh,
          dayLow: data.dayLow,
          updatedAt: timestamp,
        },
      )
    } catch (error) {
      // Silently handle DB errors
    }
  }

  io.emit("price-update", { prices: stockPrices, stockData, timestamp: timestamp.getTime() })
}, 1000)

setInterval(async () => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)
    await StockPrice.deleteMany({ timestamp: { $lt: cutoffDate } })
    console.log("Old price history cleaned up")
  } catch (error) {
    console.log("Cleanup error:", error.message)
  }
}, 3600000)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log("Waiting for WebSocket connections...")
})
