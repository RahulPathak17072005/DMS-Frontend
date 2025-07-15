"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    adminSecret: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (formData.role === "admin" && !formData.adminSecret) {
      setError("Admin secret is required for admin registration")
      return
    }

    setLoading(true)

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      adminSecret: formData.adminSecret,
    })

    if (result.success) {
      navigate("/dashboard")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <div className="container" style={{ maxWidth: "500px" }}>
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">📝 Register for DocManager</h1>
            <p className="text-gray-600">Create your document management account</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label htmlFor="username" className="font-semibold">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-control"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label htmlFor="password" className="font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="font-semibold">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role" className="font-semibold">
                Account Type
              </label>
              <select id="role" name="role" className="form-control" value={formData.role} onChange={handleChange}>
                <option value="user">👤 Regular User</option>
                <option value="admin">⚙️ Administrator</option>
              </select>
            </div>

            {formData.role === "admin" && (
              <div className="form-group">
                <label htmlFor="adminSecret" className="font-semibold">
                  Admin Secret
                </label>
                <input
                  type="password"
                  id="adminSecret"
                  name="adminSecret"
                  className="form-control"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  placeholder="Enter admin secret (default: admin123)"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">Contact your system administrator for the admin secret</div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: "1rem", height: "1rem" }}></div>
                  Creating account...
                </>
              ) : (
                <>📝 Create Account</>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-blue font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
