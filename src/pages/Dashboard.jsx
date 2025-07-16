"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import PinModal from "../components/PinModal"
import apiClient from "../config/api"
import toast from "react-hot-toast"

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    publicDocuments: [],
    privateDocuments: [],
    protectedDocuments: [],
    categoryStats: {},
    accessLevelStats: {},
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    documentId: null,
    documentName: "",
    action: null,
  })
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch all documents with higher limit to categorize them
      const response = await apiClient.get("/api/documents?limit=50")
      const allDocuments = response.data.documents

      // Separate documents by access level
      const publicDocs = allDocuments.filter((doc) => doc.accessLevel === "public")
      const privateDocs = allDocuments.filter(
        (doc) => doc.accessLevel === "private" && (doc.uploadedBy._id === user?.id || user?.role === "admin"),
      )
      const protectedDocs = allDocuments.filter((doc) => doc.accessLevel === "protected")

      // Calculate category stats
      const categoryStats = allDocuments.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1
        return acc
      }, {})

      // Calculate access level stats
      const accessLevelStats = allDocuments.reduce((acc, doc) => {
        acc[doc.accessLevel] = (acc[doc.accessLevel] || 0) + 1
        return acc
      }, {})

      setStats({
        totalDocuments: response.data.total,
        publicDocuments: publicDocs,
        privateDocuments: privateDocs,
        protectedDocuments: protectedDocs,
        categoryStats,
        accessLevelStats,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Error loading dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc, pin = null) => {
    try {
      let url = `/api/documents/download/${doc._id}`
      if (pin) {
        url += `?pin=${encodeURIComponent(pin)}`
      }

      const response = await apiClient.get(url, {
        responseType: "blob",
        timeout: 60000, // 60 seconds for download
      })

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", doc.originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("Download started successfully from Dropbox")
      setPinModal({ isOpen: false, documentId: null, documentName: "", action: null })
      setSelectedDocument(null)

      // Refresh data to update download count
      fetchDashboardData()
    } catch (error) {
      console.error("Download error:", error)
      if (error.response?.status === 401 && error.response?.data?.requiresPin) {
        setPinModal({
          isOpen: true,
          documentId: doc._id,
          documentName: doc.originalName,
          action: "download",
        })
        setSelectedDocument(doc)
      } else if (error.response?.status === 403) {
        toast.error("Access denied: This is a private document")
      } else {
        toast.error("Download failed: " + (error.response?.data?.message || error.message))
      }
    }
  }

  const handlePinVerify = async (pin) => {
    if (pinModal.action === "download" && selectedDocument) {
      try {
        // First verify the PIN
        await apiClient.post(`/api/documents/verify-pin/${selectedDocument._id}`, { pin })

        // If verification successful, proceed with download
        await handleDownload(selectedDocument, pin)
      } catch (error) {
        console.error("PIN verification failed:", error)
        toast.error("Invalid PIN. Please try again.")
        throw error // Re-throw to prevent modal from closing
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

  const canAccessPrivateDocument = (doc) => {
    return doc.uploadedBy._id === user?.id || user?.role === "admin"
  }

  const DocumentCard = ({ doc, showAccessButton = true }) => {
    const categoryBadge = getCategoryBadge(doc.category)
    const accessBadge = getAccessLevelBadge(doc.accessLevel)

    return (
      <div className="document-card">
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
              <br />
              <span className="badge badge-info">📦 Stored in Dropbox</span>
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

        {showAccessButton && (
          <div className="document-actions">
            {doc.accessLevel === "public" && (
              <button onClick={() => handleDownload(doc)} className="btn btn-success btn-sm">
                🌍 Download (Public)
              </button>
            )}

            {doc.accessLevel === "private" && canAccessPrivateDocument(doc) && (
              <button onClick={() => handleDownload(doc)} className="btn btn-warning btn-sm">
                🔒 Download (Private)
              </button>
            )}

            {doc.accessLevel === "private" && !canAccessPrivateDocument(doc) && (
              <span className="badge badge-danger">🚫 Access Denied</span>
            )}

            {doc.accessLevel === "protected" && (
              <button onClick={() => handleDownload(doc)} className="btn btn-danger btn-sm">
                🔐 Enter PIN to Access
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">👋 Welcome back, {user?.username}!</h1>
        <p className="text-gray-600">Access and manage documents stored securely in Dropbox</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("overview")} className={`tab ${activeTab === "overview" ? "active" : ""}`}>
          📊 Overview
        </button>
        <button onClick={() => setActiveTab("public")} className={`tab ${activeTab === "public" ? "active" : ""}`}>
          🌍 Public Files ({stats.publicDocuments.length})
        </button>
        <button onClick={() => setActiveTab("private")} className={`tab ${activeTab === "private" ? "active" : ""}`}>
          🔒 My Private Files ({stats.privateDocuments.length})
        </button>
        <button
          onClick={() => setActiveTab("protected")}
          className={`tab ${activeTab === "protected" ? "active" : ""}`}
        >
          🔐 Protected Files ({stats.protectedDocuments.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-4 mb-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-blue mb-2">{stats.totalDocuments}</div>
              <p className="text-gray-600">Total Documents</p>
              <p className="text-xs text-gray-500">📦 Stored in Dropbox</p>
            </div>

            <div className="card text-center">
              <div className="text-3xl font-bold text-success mb-2">{stats.publicDocuments.length}</div>
              <p className="text-gray-600">🌍 Public Files</p>
            </div>

            <div className="card text-center">
              <div className="text-3xl font-bold text-warning mb-2">{stats.privateDocuments.length}</div>
              <p className="text-gray-600">🔒 My Private Files</p>
            </div>

            <div className="card text-center">
              <div className="text-3xl font-bold text-danger mb-2">{stats.protectedDocuments.length}</div>
              <p className="text-gray-600">🔐 Protected Files</p>
            </div>
          </div>

          {/* Dropbox Integration Info */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">📦 Dropbox Integration</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">☁️</div>
                <div>
                  <h4 className="font-semibold text-blue-800">Cloud Storage Active</h4>
                  <p className="text-sm text-blue-700">All your files are securely stored in Dropbox cloud storage</p>
                </div>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                ✅ Automatic backup • ✅ Global access • ✅ Secure encryption • ✅ Version control
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">🚀 Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <Link to="/upload" className="btn btn-primary">
                📤 Upload to Dropbox
              </Link>
              <Link to="/documents" className="btn btn-secondary">
                📄 View All Documents
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="btn btn-danger">
                  ⚙️ Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Access Level Guide */}
          <div className="card">
            <h3 className="font-semibold mb-4">📋 File Access Guide</h3>
            <div className="grid grid-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl mb-2">🌍</div>
                <h4 className="font-semibold text-green-800 mb-2">Public Files</h4>
                <p className="text-sm text-green-700">
                  Anyone can view and download these files. No restrictions apply.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-yellow-800 mb-2">Private Files</h4>
                <p className="text-sm text-yellow-700">Only you and system administrators can access these files.</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl mb-2">🔐</div>
                <h4 className="font-semibold text-red-800 mb-2">Protected Files</h4>
                <p className="text-sm text-red-700">Anyone with the correct PIN can access these files.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public Files Tab */}
      {activeTab === "public" && (
        <div className="card">
          <h3 className="font-semibold mb-4">🌍 Public Files - Available to Everyone</h3>
          {stats.publicDocuments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🌍</div>
              <p className="text-gray-600 mb-4">No public files available yet.</p>
              <Link to="/upload" className="btn btn-primary">
                📤 Upload a public document to Dropbox
              </Link>
            </div>
          ) : (
            <div className="grid grid-3">
              {stats.publicDocuments.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Private Files Tab */}
      {activeTab === "private" && (
        <div className="card">
          <h3 className="font-semibold mb-4">🔒 My Private Files - Only You Can Access</h3>
          {stats.privateDocuments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-gray-600 mb-4">You don't have any private files yet.</p>
              <Link to="/upload" className="btn btn-primary">
                📤 Upload a private document to Dropbox
              </Link>
            </div>
          ) : (
            <div className="grid grid-3">
              {stats.privateDocuments.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Protected Files Tab */}
      {activeTab === "protected" && (
        <div className="card">
          <h3 className="font-semibold mb-4">🔐 Protected Files - PIN Required for Access</h3>
          {stats.protectedDocuments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-gray-600 mb-4">No protected files available.</p>
              <Link to="/upload" className="btn btn-primary">
                📤 Upload a protected document to Dropbox
              </Link>
            </div>
          ) : (
            <div>
              <div className="alert alert-info mb-4">
                <strong>🔐 PIN Required:</strong> These files require a PIN to access. Contact the file owner if you
                need the PIN.
              </div>
              <div className="grid grid-3">
                {stats.protectedDocuments.map((doc) => (
                  <DocumentCard key={doc._id} doc={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={pinModal.isOpen}
        onClose={() => {
          setPinModal({ isOpen: false, documentId: null, documentName: "", action: null })
          setSelectedDocument(null)
        }}
        onVerify={handlePinVerify}
        documentName={pinModal.documentName}
      />
    </div>
  )
}

export default Dashboard
