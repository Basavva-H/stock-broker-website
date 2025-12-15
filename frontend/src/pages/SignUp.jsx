"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../components/Navbar"
import FormInput from "../components/FormInput"
import "./Auth.css"

const SignUp = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Valid email is required"
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
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
      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      sessionStorage.setItem("token", response.data.token)
      sessionStorage.setItem("user", JSON.stringify(response.data.user))
      onLogin(response.data.token)
      navigate("/dashboard")
    } catch (error) {
      setErrors({ general: error.response?.data?.error || "Sign up failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-box animate-slide-in">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us to start trading</p>

          {errors.general && <div className="error-alert">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <FormInput
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="John Doe"
              required
            />

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
              placeholder="At least 6 characters"
              required
            />

            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm password"
              required
            />

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
