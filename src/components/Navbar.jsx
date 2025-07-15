"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            📁 DocManager
          </Link>

          <div className="navbar-nav">
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
              <span className="hide-mobile">📊 </span>Dashboard
            </Link>
            <Link to="/documents" className={`nav-link ${isActive("/documents") ? "active" : ""}`}>
              <span className="hide-mobile">📄 </span>Documents
            </Link>
            <Link to="/upload" className={`nav-link ${isActive("/upload") ? "active" : ""}`}>
              <span className="hide-mobile">⬆️ </span>Upload
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
                <span className="hide-mobile">⚙️ </span>Admin
              </Link>
            )}

            <div className="user-info">
              <span>👋 {user?.username}</span>
              <span className={`badge ${user?.role === "admin" ? "badge-danger" : "badge-primary"}`}>{user?.role}</span>
            </div>

            <button onClick={logout} className="btn btn-secondary btn-sm">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
