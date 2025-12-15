"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import SignUp from "./pages/SignUp"
import SignIn from "./pages/SignIn"
import Dashboard from "./pages/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import "./App.css"

function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token"))

  const handleLogin = (authToken) => {
    sessionStorage.setItem("token", authToken)
    setToken(authToken)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    setToken(null)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp onLogin={handleLogin} />} />
        <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute token={token}>
              <Dashboard onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
