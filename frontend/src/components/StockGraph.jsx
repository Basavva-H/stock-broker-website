"use client"

import { useState, useEffect, useRef } from "react"
import "./StockGraph.css"

const StockGraph = ({ stock, data, currentPrice, priceHistory }) => {
  const [timeline, setTimeline] = useState("day")
  const [displayData, setDisplayData] = useState([])
  const [maxPrice, setMaxPrice] = useState(currentPrice)
  const [minPrice, setMinPrice] = useState(currentPrice)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const svgRef = useRef(null)

  // Generate display data based on timeline and incoming price history
  useEffect(() => {
    if (priceHistory && priceHistory.length > 0) {
      const formatted = priceHistory.map((p) => ({
        price: p.price,
        time: new Date(p.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: new Date(p.timestamp),
      }))
      setDisplayData(formatted)
    } else if (data && data.length > 0) {
      setDisplayData(data)
    } else {
      // Generate synthetic data with INR price range
      const basePrice = currentPrice || 2500
      const volatility = basePrice * 0.02
      let points = []
      const now = new Date()

      if (timeline === "day") {
        points = Array.from({ length: 60 }, (_, i) => {
          const randomChange = (Math.random() - 0.5) * volatility
          const price = basePrice + randomChange * (i / 60)
          const time = new Date(now.getTime() - (59 - i) * 1000)
          return {
            price: Math.max(price, basePrice * 0.95),
            time: time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            timestamp: time,
          }
        })
      } else if (timeline === "month") {
        points = Array.from({ length: 30 }, (_, i) => {
          const randomChange = (Math.random() - 0.5) * volatility * 2
          const price = basePrice + randomChange
          const date = new Date(now)
          date.setDate(date.getDate() - (29 - i))
          return {
            price: Math.max(price, basePrice * 0.9),
            time: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            timestamp: date,
          }
        })
      } else if (timeline === "year") {
        points = Array.from({ length: 52 }, (_, i) => {
          const randomChange = (Math.random() - 0.5) * volatility * 3
          const price = basePrice + randomChange
          const date = new Date(now)
          date.setDate(date.getDate() - (51 - i) * 7)
          return {
            price: Math.max(price, basePrice * 0.85),
            time: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            timestamp: date,
          }
        })
      }

      setDisplayData(points)
    }
  }, [timeline, currentPrice, data, priceHistory])

  useEffect(() => {
    if (currentPrice && displayData.length > 0) {
      const now = new Date()
      const newPoint = {
        price: currentPrice,
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        timestamp: now,
      }

      setDisplayData((prev) => {
        const updated = [...prev.slice(1), newPoint]
        return updated
      })
    }
  }, [currentPrice])

  useEffect(() => {
    if (displayData && displayData.length > 0) {
      const prices = displayData.map((d) => d.price)
      const max = Math.max(...prices)
      const min = Math.min(...prices)
      const padding = (max - min) * 0.1 || 5
      setMaxPrice(max + padding)
      setMinPrice(min - padding)
    }
  }, [displayData])

  if (!displayData || displayData.length === 0) {
    return <div className="graph-loading">Loading chart...</div>
  }

  const width = 800
  const height = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const range = maxPrice - minPrice || 1

  const getX = (index) => padding.left + (index / (displayData.length - 1)) * chartWidth
  const getY = (price) => padding.top + chartHeight - ((price - minPrice) / range) * chartHeight

  const linePath = displayData
    .map((point, i) => {
      const x = getX(i)
      const y = getY(point.price)
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  const areaPath = `${linePath} L ${getX(displayData.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  const firstPrice = displayData[0]?.price || currentPrice
  const lastPrice = displayData[displayData.length - 1]?.price || currentPrice
  const priceChange = lastPrice - firstPrice
  const percentChange = ((priceChange / firstPrice) * 100).toFixed(2)
  const isUp = priceChange >= 0

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = minPrice + (range * i) / 4
    return { value, y: getY(value) }
  })

  const xLabelInterval = Math.ceil(displayData.length / 6)
  const xLabels = displayData.filter((_, i) => i % xLabelInterval === 0 || i === displayData.length - 1)

  return (
    <div className="stock-graph-container">
      <div className="graph-header">
        <div className="graph-info">
          <span className="graph-stock">{stock}</span>
          <span className={`graph-price ${isUp ? "up" : "down"}`}>₹{currentPrice?.toFixed(2)}</span>
        </div>
        <div className={`graph-change ${isUp ? "positive" : "negative"}`}>
          {isUp ? "+" : ""}₹{priceChange.toFixed(2)} ({isUp ? "+" : ""}
          {percentChange}%)
        </div>
      </div>

      <div className="timeline-selector">
        <button className={`timeline-btn ${timeline === "day" ? "active" : ""}`} onClick={() => setTimeline("day")}>
          1D
        </button>
        <button className={`timeline-btn ${timeline === "month" ? "active" : ""}`} onClick={() => setTimeline("month")}>
          1M
        </button>
        <button className={`timeline-btn ${timeline === "year" ? "active" : ""}`} onClick={() => setTimeline("year")}>
          1Y
        </button>
      </div>

      <div className="graph-canvas-line">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          <defs>
            <linearGradient id={`gradient-${stock}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {yLabels.map((label, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={label.y}
                x2={width - padding.right}
                y2={label.y}
                stroke="#2a3441"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text x={padding.left - 10} y={label.y + 4} textAnchor="end" fill="#6b7280" fontSize="12">
                ₹{label.value.toFixed(0)}
              </text>
            </g>
          ))}

          {xLabels.map((point, i) => {
            const index = displayData.indexOf(point)
            return (
              <text key={i} x={getX(index)} y={height - 10} textAnchor="middle" fill="#6b7280" fontSize="11">
                {point.time}
              </text>
            )
          })}

          <path d={areaPath} fill={`url(#gradient-${stock})`} />

          <path
            d={linePath}
            fill="none"
            stroke={isUp ? "#10b981" : "#ef4444"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {displayData.map((point, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(point.price)}
              r={hoveredPoint === i ? 6 : 3}
              fill={isUp ? "#10b981" : "#ef4444"}
              stroke="#fff"
              strokeWidth="2"
              opacity={hoveredPoint === i ? 1 : 0}
              style={{ transition: "all 0.2s ease" }}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {displayData.map((point, i) => (
            <rect
              key={`hover-${i}`}
              x={getX(i) - 10}
              y={padding.top}
              width={20}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {hoveredPoint !== null && displayData[hoveredPoint] && (
            <g>
              <rect
                x={getX(hoveredPoint) - 50}
                y={getY(displayData[hoveredPoint].price) - 40}
                width="100"
                height="30"
                rx="5"
                fill="#1e293b"
                stroke={isUp ? "#10b981" : "#ef4444"}
                strokeWidth="1"
              />
              <text
                x={getX(hoveredPoint)}
                y={getY(displayData[hoveredPoint].price) - 20}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="600"
              >
                ₹{displayData[hoveredPoint].price.toFixed(2)}
              </text>
            </g>
          )}

          <circle
            cx={getX(displayData.length - 1)}
            cy={getY(lastPrice)}
            r="5"
            fill={isUp ? "#10b981" : "#ef4444"}
            stroke="#fff"
            strokeWidth="2"
          >
            <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="graph-stats">
        <div className="stat">
          <span className="stat-label">Day Range</span>
          <span className="stat-value">
            ₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Open</span>
          <span className="stat-value">₹{firstPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">High</span>
          <span className="stat-value green">₹{maxPrice.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Low</span>
          <span className="stat-value red">₹{minPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default StockGraph
