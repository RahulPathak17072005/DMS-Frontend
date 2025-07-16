"use client"

import { useState, useEffect } from "react"
import apiClient from "../config/api"
import toast from "react-hot-toast"

const AdminPanel = () => {
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users and documents in parallel
      const [usersResponse, documentsResponse] = await Promise.allSettled([fetchUsers(), fetchAllDocuments()])

      // Handle users response
      if (usersResponse.status === "fulfilled") {
        setUsers(usersResponse.value || [])
      } else {
        console.error("Failed to fetch users:", usersResponse.reason)
        toast.error("Failed to load users")
      }

      // Handle documents response
      if (documentsResponse.status === "fulfilled") {
        setDocuments(documentsResponse.value || [])
      } else {
        console.error("Failed to fetch documents:", documentsResponse.reason)
        toast.error("Failed to load documents")
      }
    } catch (error) {
      console.error("Admin panel error:", error)
      setError("Failed to load admin data")
      toast.error("Failed to load admin panel data")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/api/users")
      return response.data.users || []
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  const fetchAllDocuments = async () => {
    try {
      const response = await apiClient.get("/api/documents?limit=100&showAllVersions=true")
      return response.data.documents || []
    } catch (error) {
      console.error("Error fetching documents:", error)
      throw error
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await apiClient.patch(`/api/users/${userId}/toggle-status`)
      toast.success("User status updated successfully")

      // Refresh users data
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
    } catch (error) {
      toast.error("Error updating user status")
      console.error("Error updating user status:", error)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      await apiClient.patch(`/api/users/${userId}/role`, { role: newRole })
      toast.success("User role updated successfully")

      // Refresh users data
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
    } catch (error) {
      toast.error("Error updating user role")
      console.error("Error updating user role:", error)
    }
  }

  const deleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      await apiClient.delete(`/api/documents/${documentId}`)
      toast.success("Document deleted successfully")

      // Refresh documents data
      const updatedDocuments = await fetchAllDocuments()
      setDocuments(updatedDocuments)
    } catch (error) {
      toast.error("Error deleting document")
      console.error("Error deleting document:", error)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await apiClient.get(`/api/documents/download/${documentId}`, {
        responseType: "blob",
        timeout: 60000, // 60 seconds for download
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Download started successfully")
    } catch (error) {
      toast.error("Download failed: " + (error.response?.data?.message || error.message))
      console.error("Download error:", error)
    }
  }

  const getCategoryBadge = (category) => {
    const badges = {
      image: { class: "badge-success", icon: "🖼️" },
      pdf: { class: "badge-danger", icon: "📄" },
      document: { class: "badge-primary", icon: "📝" },
      other: { class: "badge-warning", icon: "📎" },
    }
    return badges[category] || badges.other
  }

  const getAccessLevelBadge = (accessLevel) => {
    switch (accessLevel) {
      case "public":
        return { class: "badge-success", icon: "🌍", text: "Public" }
      case "private":
        return { class: "badge-warning", icon: "🔒", text: "Private" }
      case "protected":
        return { class: "badge-danger", icon: "🔐", text: "Protected" }
      default:
        return { class: "badge-secondary", icon: "🔒", text: "Private" }
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          <h3>Error Loading Admin Panel</h3>
          <p>{error}</p>
          <button onClick={fetchAdminData} className="btn btn-primary mt-4">
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">⚙️ Admin Panel</h1>
        <p className="text-gray-600">Manage users and documents across the system</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("users")} className={`tab ${activeTab === "users" ? "active" : ""}`}>
          👥 Users ({Array.isArray(users) ? users.length : 0})
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`tab ${activeTab === "documents" ? "active" : ""}`}
        >
          📄 All Documents ({Array.isArray(documents) ? documents.length : 0})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card">
          <h3 className="font-semibold mb-4">👥 User Management</h3>
          {!Array.isArray(users) || users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-600">No users found.</p>
              {!Array.isArray(users) && (
                <button onClick={fetchAdminData} className="btn btn-primary mt-4">
                  🔄 Reload Data
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="hide-mobile">Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="font-semibold">{user.username || "N/A"}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>
                        <select
                          value={user.role || "user"}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className="form-control"
                          style={{ width: "auto", minWidth: "100px" }}
                        >
                          <option value="user">👤 User</option>
                          <option value="admin">⚙️ Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                          {user.isActive ? "✅ Active" : "❌ Inactive"}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          className={`btn btn-sm ${user.isActive ? "btn-danger" : "btn-success"}`}
                        >
                          {user.isActive ? "🚫 Deactivate" : "✅ Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="card">
          <h3 className="font-semibold mb-4">📄 Document Management</h3>
          {!Array.isArray(documents) || documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-600">No documents found.</p>
              {!Array.isArray(documents) && (
                <button onClick={fetchAdminData} className="btn btn-primary mt-4">
                  🔄 Reload Data
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-3">
              {documents.map((doc) => {
                const categoryBadge = getCategoryBadge(doc.category)
                const accessBadge = getAccessLevelBadge(doc.accessLevel)

                return (
                  <div key={doc._id} className="document-card">
                    <div className="document-header">
                      <div className="flex-1">
                        <div className="document-title">{doc.originalName || "Untitled"}</div>
                        <div className="document-meta">
                          Uploaded by {doc.uploadedBy?.username || "Unknown"} • {formatFileSize(doc.size)}
                          <br />
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Unknown date"} • Downloaded{" "}
                          {doc.downloadCount || 0} times
                          {doc.version > 1 && (
                            <>
                              <br />
                              <span className="version-badge">v{doc.version}</span>
                            </>
                          )}
                          <br />
                          <span className="badge badge-info">📦 Dropbox</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${categoryBadge.class}`}>
                          {categoryBadge.icon} {doc.category}
                        </span>
                        <span className={`badge ${accessBadge.class}`}>
                          {accessBadge.icon} {accessBadge.text}
                        </span>
                        {doc.isLatestVersion && <span className="badge badge-info">Latest</span>}
                      </div>
                    </div>

                    {doc.description && <p className="text-sm text-gray-600 mb-3">{doc.description}</p>}

                    {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                      <div className="mb-3">
                        {doc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="badge badge-secondary"
                            style={{ marginRight: "0.25rem", fontSize: "0.625rem" }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="document-actions">
                      <button
                        onClick={() => handleDownload(doc._id, doc.originalName)}
                        className="btn btn-primary btn-sm"
                      >
                        📥 Download
                      </button>
                      <button onClick={() => deleteDocument(doc._id)} className="btn btn-danger btn-sm">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPanel
