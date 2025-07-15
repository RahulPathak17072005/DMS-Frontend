"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div className="alert alert-error">Access denied. You don't have permission to view this page.</div>
  }

  return children
}

export default ProtectedRoute
