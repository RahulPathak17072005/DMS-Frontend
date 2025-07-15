"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AdminPanel = () => {
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    fetchUsers()
    fetchAllDocuments()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users")
      setUsers(response.data.users)
    } catch (error) {
      toast.error("Error fetching users")
      console.error("Error fetching users:", error)
    }
  }

  const fetchAllDocuments = async () => {
    try {
      const response = await axios.get("/api/documents?limit=100&showAllVersions=true")
      setDocuments(response.data.documents)
    } catch (error) {
      toast.error("Error fetching documents")
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await axios.patch(`/api/users/${userId}/toggle-status`)
      toast.success("User status updated successfully")
      fetchUsers()
    } catch (error) {
      toast.error("Error updating user status")
      console.error("Error updating user status:", error)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole })
      toast.success("User role updated successfully")
      fetchUsers()
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
      await axios.delete(`/api/documents/${documentId}`)
      toast.success("Document deleted successfully")
      fetchAllDocuments()
    } catch (error) {
      toast.error("Error deleting document")
      console.error("Error deleting document:", error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        responseType: "blob",
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">⚙️ Admin Panel</h1>
        <p className="text-gray-600">Manage users and documents across the system</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("users")} className={`tab ${activeTab === "users" ? "active" : ""}`}>
          👥 Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`tab ${activeTab === "documents" ? "active" : ""}`}
        >
          📄 All Documents ({documents.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card">
          <h3 className="font-semibold mb-4">👥 User Management</h3>
          {users.length === 0 ? (
            <p className="text-gray-600">No users found.</p>
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
                      <td className="font-semibold">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
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
                      <td className="hide-mobile">{new Date(user.createdAt).toLocaleDateString()}</td>
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
          {documents.length === 0 ? (
            <p className="text-gray-600">No documents found.</p>
          ) : (
            <div className="grid grid-3">
              {documents.map((doc) => {
                const categoryBadge = getCategoryBadge(doc.category)
                const accessBadge = getAccessLevelBadge(doc.accessLevel)

                return (
                  <div key={doc._id} className="document-card">
                    <div className="document-header">
                      <div className="flex-1">
                        <div className="document-title">{doc.originalName}</div>
                        <div className="document-meta">
                          Uploaded by {doc.uploadedBy.username} • {formatFileSize(doc.size)}
                          <br />
                          {new Date(doc.createdAt).toLocaleDateString()} • Downloaded {doc.downloadCount} times
                          {doc.version > 1 && (
                            <>
                              <br />
                              <span className="version-badge">v{doc.version}</span>
                            </>
                          )}
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

                    {doc.tags.length > 0 && (
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
