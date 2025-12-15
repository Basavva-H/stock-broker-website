"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import io from "socket.io-client"
import config from "../config"
import Navbar from "../components/Navbar"
import StockCard from "../components/StockCard"
import StockGraph from "../components/StockGraph"
import "./Dashboard.css"

const { API_URL, WS_URL } = config;
console.log("API_URL =", API_URL, typeof API_URL);
console.log("WS_URL =", WS_URL, typeof WS_URL);

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null)
  const [stocks, setStocks] = useState([])
  const [prices, setPrices] = useState({})
  const [priceHistory, setPriceHistory] = useState({})
  const [subscribed, setSubscribed] = useState([])
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [selectedStock, setSelectedStock] = useState(null)
  const navigate = useNavigate()

  const token = sessionStorage.getItem("token")

  useEffect(() => {
    if (subscribed.length > 0 && Object.keys(prices).length > 0) {
      const total = subscribed.reduce((sum, stock) => {
        return sum + (prices[stock] || 0)
      }, 0)
      setPortfolioValue(total)
    } else {
      setPortfolioValue(0)
    }
  }, [prices, subscribed])

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (userData && userData !== "undefined") {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("[v0] Error parsing user data:", error)
        sessionStorage.removeItem("user")
      }
    }

    const fetchInitialData = async () => {
      try {
        const stocksRes = await axios.get(`${API_URL}/api/stocks/supported`)
        setStocks(stocksRes.data.stocks)

        const pricesRes = await axios.get(`${API_URL}/api/stocks/prices`)
        setPrices(pricesRes.data.prices)

        const history = {}
        stocksRes.data.stocks.forEach((stock) => {
          history[stock] = [{ time: new Date().toLocaleTimeString(), price: pricesRes.data.prices[stock] }]
        })
        setPriceHistory(history)

        if (token) {
          const subsRes = await axios.get(`${API_URL}/api/user/subscriptions`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setSubscribed(subsRes.data.subscribedStocks)
          if (subsRes.data.subscribedStocks.length > 0) {
            setSelectedStock(subsRes.data.subscribedStocks[0])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("[v0] Socket connected:", newSocket.id)
      setConnectionStatus("Connected")
      newSocket.emit("authenticate", token)
    })

    newSocket.on("authenticated", (data) => {
      console.log("[v0] Socket authenticated successfully:", data)
      setConnectionStatus("Connected")
    })

    newSocket.on("auth-error", (data) => {
      console.error("[v0] Socket authentication error:", data)
      setConnectionStatus("Authentication failed")
    })

    newSocket.on("price-update", (data) => {
      console.log("[v0] Price update received at", new Date(data.timestamp).toLocaleTimeString())
      setPrices(data.prices)

      setPriceHistory((prev) => {
        const updated = { ...prev }
        Object.keys(data.prices).forEach((stock) => {
          if (!updated[stock]) {
            updated[stock] = []
          }
          updated[stock].push({
            time: new Date().toLocaleTimeString(),
            price: data.prices[stock],
          })
          if (updated[stock].length > 30) {
            updated[stock].shift()
          }
        })
        return updated
      })
    })

    newSocket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
      setConnectionStatus("Disconnected")
    })

    newSocket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error)
      setConnectionStatus("Connection error")
    })

    return () => {
      console.log("[v0] Cleaning up socket connection")
      newSocket.disconnect()
    }
  }, [token])

  const handleSubscribe = async (stockSymbol) => {
    try {
      await axios.post(
        `${API_URL}/api/stocks/subscribe`,
        { stockSymbol },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setSubscribed([...subscribed, stockSymbol])
      setSelectedStock(stockSymbol)
      socket?.emit("subscribe-stock", stockSymbol)
    } catch (error) {
      alert("Failed to subscribe to stock")
    }
  }

  const handleUnsubscribe = async (stockSymbol) => {
    try {
      await axios.post(
        `${API_URL}/api/stocks/unsubscribe`,
        { stockSymbol },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setSubscribed(subscribed.filter((s) => s !== stockSymbol))
      if (selectedStock === stockSymbol) {
        setSelectedStock(subscribed.length > 1 ? subscribed[0] : null)
      }
    } catch (error) {
      alert("Failed to unsubscribe from stock")
    }
  }

  const handleLogout = () => {
    if (socket) {
      socket.disconnect()
    }
    sessionStorage.clear()
    onLogout()
    navigate("/")
  }

  const availableStocks = stocks.filter((stock) => !subscribed.includes(stock))

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Your Stock Portfolio</h1>
          <p className="dashboard-subtitle">Subscribe to stocks and track real-time prices</p>
          <p className="connection-status">Status: {connectionStatus}</p>
          {subscribed.length > 0 && (
            <div className="portfolio-value-container">
              <div className="portfolio-value-box">
                <span className="portfolio-label">Total Portfolio Value</span>
                <span className="portfolio-amount">${portfolioValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {subscribed.length > 0 && (
          <div className="dashboard-main">
            <div className="dashboard-left">
              <section className="subscribed-section">
                <h2 className="section-label">Your Subscribed Stocks</h2>
                <div className="subscribed-stocks-container">
                  {subscribed.map((stock) => (
                    <div key={stock} className={`stock-mini-card ${selectedStock === stock ? "active" : ""}`}>
                      <div className="mini-card-content">
                        <div className="mini-card-header" onClick={() => setSelectedStock(stock)}>
                          <span className="mini-stock-symbol">{stock}</span>
                          <span className="mini-stock-price">${prices[stock]?.toFixed(2) || "0.00"}</span>
                        </div>
                        <button
                          className="mini-unsubscribe-btn"
                          onClick={() => handleUnsubscribe(stock)}
                          title="Unsubscribe"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {selectedStock && priceHistory[selectedStock] && (
                <section className="graph-section">
                  <h2 className="section-label">Stock Chart</h2>
                  <StockGraph
                    stock={selectedStock}
                    data={priceHistory[selectedStock]}
                    currentPrice={prices[selectedStock]}
                  />
                </section>
              )}
            </div>

            <div className="dashboard-right">
              <section className="available-section">
                <h2 className="section-label">
                  Available Stocks
                  {availableStocks.length > 0 && <span className="available-count">({availableStocks.length})</span>}
                </h2>
                {availableStocks.length > 0 ? (
                  <div className="available-stocks-list">
                    {availableStocks.map((stock) => (
                      <StockCard
                        key={stock}
                        stock={stock}
                        price={prices[stock] || 0}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        isSubscribed={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="all-subscribed-message">
                    <p>You've subscribed to all available stocks!</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {subscribed.length === 0 && (
          <section className="initial-section">
            <h2 className="section-label">Subscribe to Your First Stock</h2>
            <div className="stocks-grid">
              {availableStocks.map((stock) => (
                <StockCard
                  key={stock}
                  stock={stock}
                  price={prices[stock] || 0}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                  isSubscribed={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Dashboard
