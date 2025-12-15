"use client"
import { Link, useNavigate } from "react-router-dom"
import "./Navbar.css"

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate("/")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📈</span>
          StockBroker
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              <span className="navbar-user">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="navbar-link">
                Sign In
              </Link>
              <Link to="/signup" className="navbar-link signup-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
