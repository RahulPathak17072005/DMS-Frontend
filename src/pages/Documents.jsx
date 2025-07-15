"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import PinModal from "../components/PinModal"
import axios from "axios"
import toast from "react-hot-toast"

const Documents = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
    page: 1,
    showAllVersions: false,
  })
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    total: 0,
  })
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    documentId: null,
    documentName: "",
    action: null,
  })
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [filters])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.search) params.append("search", filters.search)
      params.append("page", filters.page)
      params.append("limit", "12")
      params.append("showAllVersions", filters.showAllVersions)

      const response = await axios.get(`/api/documents?${params}`)
      setDocuments(response.data.documents)
      setPagination({
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        total: response.data.total,
      })
    } catch (error) {
      toast.error("Error fetching documents")
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      await axios.delete(`/api/documents/${documentId}`)
      toast.success("Document deleted successfully")
      fetchDocuments()
    } catch (error) {
      toast.error("Error deleting document")
      console.error("Error deleting document:", error)
    }
  }

  const canAccessDocument = (doc) => {
    if (user?.role === "admin" && doc.accessLevel !== "protected") {
      // Admin can access public and private files without PIN
      return true
    }
    if (doc.uploadedBy._id === user?.id) {
      // Owner can always access their own files (except protected needs PIN)
      return doc.accessLevel !== "protected"
    }
    if (doc.accessLevel === "public") {
      // Anyone can access public files
      return true
    }
    return false
  }

  const handleDownload = async (doc, pin = null) => {
    try {
      let url = `/api/documents/download/${doc._id}`
      if (pin) {
        url += `?pin=${encodeURIComponent(pin)}`
      }

      const response = await axios.get(url, {
        responseType: "blob",
      })

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", doc.originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("Download started successfully")
      setPinModal({ isOpen: false, documentId: null, documentName: "", action: null })
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data?.requiresPin) {
        // Show PIN modal for protected documents
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
      await handleDownload(selectedDocument, pin)
    }
  }

  const handleViewVersions = async (doc) => {
    try {
      const response = await axios.get(`/api/documents/${doc._id}/versions`)
      console.log("Versions:", response.data.versions)
      toast.success(`Found ${response.data.versions.length} versions`)
    } catch (error) {
      toast.error("Error fetching versions")
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

  const canDeleteDocument = (doc) => {
    return user?.role === "admin" || doc.uploadedBy._id === user?.id
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">📄 Documents</h1>
        <p className="text-gray-600">Browse and manage your documents with version control</p>
      </div>

      {/* Filters */}
      <div className="search-filters">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="font-semibold">Search</label>
          <input
            type="text"
            placeholder="Search documents..."
            className="form-control"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="font-semibold">Category</label>
          <select
            className="form-control"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="image">🖼️ Images</option>
            <option value="pdf">📄 PDFs</option>
            <option value="document">📝 Documents</option>
            <option value="other">📎 Other</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="font-semibold">Version View</label>
          <select
            className="form-control"
            value={filters.showAllVersions}
            onChange={(e) => handleFilterChange("showAllVersions", e.target.value === "true")}
          >
            <option value="false">Latest Versions Only</option>
            <option value="true">All Versions</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-gray-600">
            Showing {documents.length} of {pagination.total} documents
          </p>
          <div className="flex gap-2">
            <span className="badge badge-info">{filters.showAllVersions ? "All Versions" : "Latest Only"}</span>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center">
          <h3 className="font-semibold mb-2">📭 No documents found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or upload some documents.</p>
          <a href="/upload" className="btn btn-primary">
            📤 Upload Document
          </a>
        </div>
      ) : (
        <div className="grid grid-3">
          {documents.map((doc) => {
            const categoryBadge = getCategoryBadge(doc.category)
            const accessBadge = getAccessLevelBadge(doc.accessLevel)
            const hasAccess = canAccessDocument(doc)

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
                  {canAccessDocument(doc) && (
                    <button onClick={() => handleDownload(doc)} className="btn btn-primary btn-sm">
                      📥 Download
                    </button>
                  )}

                  {doc.accessLevel === "protected" && !canAccessDocument(doc) && (
                    <button onClick={() => handleDownload(doc)} className="btn btn-warning btn-sm">
                      🔐 Enter PIN
                    </button>
                  )}

                  {canDeleteDocument(doc) && (
                    <button onClick={() => handleDelete(doc._id)} className="btn btn-danger btn-sm">
                      🗑️ Delete
                    </button>
                  )}

                  {canDeleteDocument(doc) && doc.version > 1 && (
                    <button onClick={() => handleViewVersions(doc)} className="btn btn-secondary btn-sm">
                      📋 Versions ({doc.version})
                    </button>
                  )}

                  {doc.accessLevel === "private" && !canAccessDocument(doc) && user?.role !== "admin" && (
                    <span className="badge badge-danger">🔒 Private</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="btn btn-secondary"
          >
            ← Previous
          </button>

          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={pinModal.isOpen}
        onClose={() => setPinModal({ isOpen: false, documentId: null, documentName: "", action: null })}
        onVerify={handlePinVerify}
        documentName={pinModal.documentName}
      />
    </div>
  )
}

export default Documents
