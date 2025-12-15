import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import "./Home.css"

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <main className="home-content">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-text animate-slide-in">
            <h1 className="hero-title">Trade Stocks with Confidence</h1>
            <p className="hero-subtitle">
              Real-time stock tracking, portfolio management, and advanced analytics in one place
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">
                Get Started Now
              </Link>
              <Link to="/signin" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-item animate-fade-in" style={{ animationDelay: "0s" }}>
              <div className="stat-number">5</div>
              <div className="stat-label">Stock Tickers</div>
              <div className="stat-description">GOOG, TSLA, AMZN, META, NVDA</div>
            </div>
            <div className="stat-item animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="stat-number">24/7</div>
              <div className="stat-label">Real-time Updates</div>
              <div className="stat-description">Live price changes every second</div>
            </div>
            <div className="stat-item animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="stat-number">100%</div>
              <div className="stat-label">Secure</div>
              <div className="stat-description">JWT & encrypted passwords</div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2 className="section-title">Why Choose StockBroker?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Updates</h3>
              <p>Get instant price updates without page refresh using WebSocket technology</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>JWT authentication with encrypted passwords for maximum security</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Advanced Charts</h3>
              <p>Track stock performance with real-time interactive price charts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Portfolio Management</h3>
              <p>Monitor your total portfolio value updated in real-time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Responsive</h3>
              <p>Lightning-fast performance optimized for all devices</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Multi-User Support</h3>
              <p>Multiple users can trade independently with isolated portfolios</p>
            </div>
          </div>
        </div>

        <div className="stocks-showcase-section">
          <h2 className="section-title">Supported Stocks</h2>
          <div className="stocks-showcase">
            <div className="stock-showcase-card">
              <div className="stock-icon">🔵</div>
              <div className="stock-name">Google</div>
              <div className="stock-symbol">GOOG</div>
            </div>
            <div className="stock-showcase-card">
              <div className="stock-icon">⚡</div>
              <div className="stock-name">Tesla</div>
              <div className="stock-symbol">TSLA</div>
            </div>
            <div className="stock-showcase-card">
              <div className="stock-icon">📦</div>
              <div className="stock-name">Amazon</div>
              <div className="stock-symbol">AMZN</div>
            </div>
            <div className="stock-showcase-card">
              <div className="stock-icon">👍</div>
              <div className="stock-name">Meta</div>
              <div className="stock-symbol">META</div>
            </div>
            <div className="stock-showcase-card">
              <div className="stock-icon">🎮</div>
              <div className="stock-name">NVIDIA</div>
              <div className="stock-symbol">NVDA</div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <div className="cta-content">
            <h2>Ready to Start Trading?</h2>
            <p>Join thousands of investors tracking real-time stock prices with our advanced dashboard</p>
            <Link to="/signup" className="btn btn-primary btn-large">
              Start Your Journey Today
            </Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>StockBroker</h3>
            <p>Your trusted platform for real-time stock trading and portfolio management</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/signup">Sign Up</Link>
              </li>
              <li>
                <Link to="/signin">Sign In</Link>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <p>Email: support@stockbroker.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 StockBroker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
