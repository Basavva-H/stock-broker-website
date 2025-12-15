"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../components/Navbar"
import FormInput from "../components/FormInput"
import "./Auth.css"

const SignIn = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Valid email is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await axios.post("http://localhost:5000/api/auth/signin", {
        email: formData.email,
        password: formData.password,
      })

      sessionStorage.setItem("token", response.data.token)
      sessionStorage.setItem("user", JSON.stringify(response.data.user))
      onLogin(response.data.token)
      navigate("/dashboard")
    } catch (error) {
      setErrors({ general: error.response?.data?.error || "Sign in failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-box animate-slide-in">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>

          {errors.general && <div className="error-alert">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Your password"
              required
            />

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
