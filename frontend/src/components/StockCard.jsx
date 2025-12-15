"use client"
import "./StockCard.css"

const StockCard = ({ stock, price, onSubscribe, onUnsubscribe, isSubscribed }) => {
  const priceChange = (Math.random() - 0.5) * 10
  const isUp = priceChange >= 0

  return (
    <div className={`stock-card ${isSubscribed ? "subscribed" : ""}`}>
      <div className="stock-header">
        <div className="stock-symbol">{stock}</div>
        <div className={`stock-status ${isSubscribed ? "active" : ""}`}>
          {isSubscribed ? "✓ Subscribed" : "Not Subscribed"}
        </div>
      </div>

      <div className="stock-price-section">
        <div className="stock-price animate-pulse-price">₹{price.toFixed(2)}</div>
        <div className={`stock-change ${isUp ? "positive" : "negative"}`}>
          <span>
            {isUp ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="stock-actions">
        {isSubscribed ? (
          <button onClick={() => onUnsubscribe(stock)} className="btn btn-unsubscribe">
            Unsubscribe
          </button>
        ) : (
          <button onClick={() => onSubscribe(stock)} className="btn btn-subscribe">
            Subscribe
          </button>
        )}
      </div>
    </div>
  )
}

export default StockCard
