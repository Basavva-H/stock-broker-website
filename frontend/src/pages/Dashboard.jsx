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
  const [stocksData, setStocksData] = useState({})
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
        const price = typeof prices[stock] === "object" ? prices[stock]?.currentPrice : prices[stock]
        return sum + (price || 0)
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
        console.error("Error parsing user data:", error)
        sessionStorage.removeItem("user")
      }
    }

    const fetchInitialData = async () => {
      try {
        const stocksRes = await axios.get(`${API_URL}/api/stocks/supported`)
        const stocksList = stocksRes.data.stocks
        const parsedStocks = stocksList.map((s) => (typeof s === "object" ? s.symbol : s))
        setStocks(parsedStocks)

        if (stocksRes.data.stocksData) {
          const dataMap = {}
          stocksRes.data.stocksData.forEach((s) => {
            if (typeof s === "object") {
              dataMap[s.symbol] = s
            }
          })
          setStocksData(dataMap)
        }

        const pricesRes = await axios.get(`${API_URL}/api/stocks/prices`)
        const pricesData = {}
        Object.keys(pricesRes.data.prices).forEach((symbol) => {
          const p = pricesRes.data.prices[symbol]
          pricesData[symbol] = typeof p === "object" ? p.currentPrice : p
        })
        setPrices(pricesData)

        const history = {}
        parsedStocks.forEach((stock) => {
          history[stock] = [{ time: new Date().toLocaleTimeString(), price: pricesData[stock] || 0 }]
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

    const newSocket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    setSocket(newSocket)

    newSocket.on("connect", () => {
      setConnectionStatus("Connected")
      newSocket.emit("authenticate", token)
    })

    newSocket.on("authenticated", (data) => {
      setConnectionStatus("Connected")
    })

    newSocket.on("auth-error", (data) => {
      console.error("Socket authentication error:", data)
      setConnectionStatus("Authentication failed")
    })

    newSocket.on("price-update", (data) => {
      const updatedPrices = {}
      Object.keys(data.prices).forEach((symbol) => {
        const p = data.prices[symbol]
        updatedPrices[symbol] = typeof p === "object" ? p.currentPrice : p
      })
      setPrices(updatedPrices)

      setPriceHistory((prev) => {
        const updated = { ...prev }
        Object.keys(updatedPrices).forEach((stock) => {
          if (!updated[stock]) {
            updated[stock] = []
          }
          updated[stock].push({
            time: new Date().toLocaleTimeString(),
            price: updatedPrices[stock],
          })
          if (updated[stock].length > 60) {
            updated[stock].shift()
          }
        })
        return updated
      })
    })

    newSocket.on("disconnect", () => {
      setConnectionStatus("Disconnected")
    })

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setConnectionStatus("Connection error")
    })

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  const getPrice = (stock) => {
    const price = prices[stock]
    if (typeof price === "object") {
      return price?.currentPrice || 0
    }
    return price || 0
  }

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
      const newSubscribed = subscribed.filter((s) => s !== stockSymbol)
      setSubscribed(newSubscribed)
      if (selectedStock === stockSymbol) {
        setSelectedStock(newSubscribed.length > 0 ? newSubscribed[0] : null)
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
          {subscribed.length > 0 && (
            <div className="portfolio-value-container">
              <div className="portfolio-value-box">
                <span className="portfolio-label">Total Portfolio Value</span>
                <span className="portfolio-amount">₹{portfolioValue.toFixed(2)}</span>
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
                          <span className="mini-stock-price">₹{getPrice(stock).toFixed(2)}</span>
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
                  <h2 className="section-label">Stock Chart - {selectedStock}</h2>
                  <StockGraph
                    stock={selectedStock}
                    data={priceHistory[selectedStock]}
                    currentPrice={getPrice(selectedStock)}
                    stockInfo={stocksData[selectedStock]}
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
                        price={getPrice(stock)}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                        isSubscribed={false}
                        stockInfo={stocksData[stock]}
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
                  price={getPrice(stock)}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                  isSubscribed={false}
                  stockInfo={stocksData[stock]}
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
