"use client"

import { useState, useEffect } from "react"
import "./StockGraph.css"

const StockGraph = ({ stock, data, currentPrice }) => {
  const [timeline, setTimeline] = useState("day")
  const [displayData, setDisplayData] = useState(data)
  const [maxPrice, setMaxPrice] = useState(currentPrice)
  const [minPrice, setMinPrice] = useState(currentPrice)

  const generateHistoricalData = (timelineType) => {
    const basePrice = currentPrice
    const volatility = basePrice * 0.08
    let points = []

    if (timelineType === "day") {
      // 24 data points for hourly data
      points = Array.from({ length: 24 }, (_, i) => {
        const randomChange = (Math.random() - 0.5) * volatility
        const price = basePrice + randomChange
        return {
          price: Math.max(price, basePrice * 0.9),
          time: `${String(i).padStart(2, "0")}:00`,
        }
      })
    } else if (timelineType === "month") {
      // 30 data points for daily data in a month
      points = Array.from({ length: 30 }, (_, i) => {
        const randomChange = (Math.random() - 0.5) * volatility * 1.2
        const price = basePrice + randomChange
        return {
          price: Math.max(price, basePrice * 0.85),
          time: `Day ${i + 1}`,
        }
      })
    } else if (timelineType === "year") {
      // 52 data points for weekly data in a year
      points = Array.from({ length: 52 }, (_, i) => {
        const randomChange = (Math.random() - 0.5) * volatility * 1.5
        const price = basePrice + randomChange
        return {
          price: Math.max(price, basePrice * 0.8),
          time: `W${i + 1}`,
        }
      })
    }

    return points
  }

  useEffect(() => {
    const historicalData = generateHistoricalData(timeline)
    setDisplayData(historicalData)
  }, [timeline, currentPrice])

  useEffect(() => {
    if (displayData && displayData.length > 0) {
      const prices = displayData.map((d) => d.price)
      setMaxPrice(Math.max(...prices))
      setMinPrice(Math.min(...prices))
    }
  }, [displayData])

  if (!displayData || displayData.length === 0) {
    return <div className="graph-loading">Loading chart...</div>
  }

  const range = maxPrice - minPrice || 1

  const bars = displayData.map((d, i) => {
    const height = ((d.price - minPrice) / range) * 100
    return { height, price: d.price, time: d.time }
  })

  const isPriceUp = displayData.length > 1 && displayData[displayData.length - 1].price >= displayData[0].price
  const priceChange = displayData.length > 1 ? displayData[displayData.length - 1].price - displayData[0].price : 0
  const percentChange = displayData.length > 1 ? ((priceChange / displayData[0].price) * 100).toFixed(2) : 0

  return (
    <div className="stock-graph-container">
      <div className="graph-header">
        <div className="graph-info">
          <span className="graph-stock">{stock}</span>
          <span className={`graph-price ${isPriceUp ? "up" : "down"}`}>₹{currentPrice.toFixed(2)}</span>
        </div>
        <div className={`graph-change ${isPriceUp ? "positive" : "negative"}`}>
          {isPriceUp ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)} ({percentChange}%)
        </div>
      </div>

      <div className="timeline-selector">
        <button className={`timeline-btn ${timeline === "day" ? "active" : ""}`} onClick={() => setTimeline("day")}>
          Day
        </button>
    
      </div>

      <div className="graph-canvas-bars">
        <div className="bars-container">
          {bars.map((bar, i) => (
            <div key={i} className="bar-wrapper">
              <div
                className={`bar ${isPriceUp ? "up" : "down"}`}
                style={{ height: `${bar.height}%` }}
                title={`${bar.time}: $${bar.price.toFixed(2)}`}
              ></div>
            </div>
          ))}
        </div>
        <div className="bars-labels">
          <span className="bar-label-min">₹{minPrice.toFixed(2)}</span>
          <span className="bar-label-max">₹{maxPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="graph-stats">
        <div className="stat">
          <span className="stat-label">High</span>
          <span className="stat-value">₹{maxPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Low</span>
          <span className="stat-value">₹{minPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Data Points</span>
          <span className="stat-value">{displayData.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Range</span>
          <span className="stat-value">₹{(maxPrice - minPrice).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default StockGraph
