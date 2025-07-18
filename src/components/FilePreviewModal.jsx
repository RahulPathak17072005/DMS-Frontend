"use client"

import { useState, useEffect } from "react"
import apiClient from "../config/api"

const FilePreviewModal = ({ isOpen, onClose, document, onDownload }) => {
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewType, setPreviewType] = useState(null)

  useEffect(() => {
    if (isOpen && document) {
      loadPreview()
    } else {
      // Reset state when modal closes
      setPreviewData(null)
      setError(null)
      setPreviewType(null)
    }
  }, [isOpen, document])

  const loadPreview = async () => {
    if (!document) return

    setLoading(true)
    setError(null)

    try {
      console.log("Loading preview for:", document.originalName)
      console.log("Document mimetype:", document.mimetype)

      // Determine preview type based on file type
      const fileType = getPreviewType(document.mimetype, document.originalName)
      setPreviewType(fileType)
      console.log("Determined preview type:", fileType)

      if (fileType === "unsupported") {
        setError("Preview not available for this file type. You can download the file to view it.")
        setLoading(false)
        return
      }

      console.log("Fetching preview from API...")

      // For all supported types, fetch as blob first
      const response = await apiClient.get(`/api/documents/preview/${document._id}`, {
        responseType: "blob",
        timeout: 30000,
      })

      console.log("Preview response received:", response.data.size, "bytes")

      if (fileType === "image" || fileType === "pdf") {
        // Create blob URL for images and PDFs
        const blob = new Blob([response.data], { type: document.mimetype })
        const url = URL.createObjectURL(blob)
        setPreviewData(url)
        console.log("Created blob URL for", fileType)
      } else if (fileType === "text") {
        // Convert blob to text for text files
        const text = await response.data.text()
        setPreviewData(text)
        console.log("Converted blob to text, length:", text.length)
      }
    } catch (error) {
      console.error("Preview error:", error)
      if (error.response?.status === 401 && error.response?.data?.requiresPin) {
        setError("This file requires a PIN to preview. Please use the download option to enter the PIN.")
      } else if (error.response?.status === 403) {
        setError("Access denied: You don't have permission to preview this file")
      } else if (error.response?.status === 404) {
        setError("File not found")
      } else if (error.response?.status === 500) {
        setError("Server error while loading preview. Try downloading the file instead.")
      } else if (error.code === "ECONNABORTED") {
        setError("Preview timeout. The file may be too large. Try downloading instead.")
      } else {
        setError("Failed to load preview: " + (error.response?.data?.message || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const getPreviewType = (mimetype, filename) => {
    console.log("Checking preview type for mimetype:", mimetype, "filename:", filename)

    if (mimetype && mimetype.startsWith("image/")) {
      return "image"
    } else if (mimetype === "application/pdf") {
      return "pdf"
    } else if (
      (mimetype && (mimetype.includes("text/") || mimetype === "text/plain")) ||
      filename.toLowerCase().endsWith(".txt") ||
      filename.toLowerCase().endsWith(".md") ||
      filename.toLowerCase().endsWith(".json") ||
      filename.toLowerCase().endsWith(".xml") ||
      filename.toLowerCase().endsWith(".csv") ||
      filename.toLowerCase().endsWith(".log")
    ) {
      return "text"
    } else {
      return "unsupported"
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (mimetype) => {
    if (mimetype && mimetype.startsWith("image/")) return "🖼️"
    if (mimetype === "application/pdf") return "📄"
    if (mimetype && mimetype.includes("text/")) return "📝"
    if (mimetype && mimetype.includes("document")) return "📄"
    if (mimetype && (mimetype.includes("spreadsheet") || mimetype.includes("excel"))) return "📊"
    if (mimetype && (mimetype.includes("presentation") || mimetype.includes("powerpoint"))) return "📊"
    return "📎"
  }

  const handleDownload = () => {
    onDownload(document)
  }

  const handleClose = () => {
    // Clean up blob URLs to prevent memory leaks
    if (previewData && typeof previewData === "string" && previewData.startsWith("blob:")) {
      URL.revokeObjectURL(previewData)
    }
    onClose()
  }

  if (!isOpen || !document) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(document.mimetype)}</span>
            <div>
              <h3 className="font-semibold text-lg">{document.originalName}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(document.size)} • {document.category} • 📦 Dropbox
              </p>
            </div>
          </div>
        </div>

        <div className="modal-body preview-body">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading preview from Dropbox...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Preview Not Available</h4>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={handleDownload} className="btn btn-primary">
                📥 Download File Instead
              </button>
            </div>
          )}

          {!loading && !error && previewData && (
            <div className="preview-content">
              {previewType === "image" && (
                <div className="image-preview">
                  <img
                    src={previewData || "/placeholder.svg"}
                    alt={document.originalName}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    onError={(e) => {
                      console.error("Image failed to load")
                      setError("Failed to display image. The file may be corrupted.")
                    }}
                  />
                </div>
              )}

              {previewType === "pdf" && (
                <div className="pdf-preview">
                  <iframe
                    src={previewData}
                    width="100%"
                    height="600px"
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    title={document.originalName}
                    onError={(e) => {
                      console.error("PDF failed to load")
                      setError("Failed to display PDF. Try downloading the file instead.")
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 If the PDF doesn't display properly, try downloading it instead
                  </p>
                </div>
              )}

              {previewType === "text" && (
                <div className="text-preview">
                  <pre
                    style={{
                      background: "#f9fafb",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      maxHeight: "500px",
                      overflow: "auto",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {previewData || "No content to display"}
                  </pre>
                </div>
              )}

              {previewType === "unsupported" && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📎</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Preview Not Available</h4>
                  <p className="text-gray-600 mb-4">
                    This file type doesn't support preview. You can download it to view the content.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleDownload} className="btn btn-primary">
                      📥 Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {document.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <h5 className="font-semibold text-sm text-gray-700 mb-1">Description:</h5>
              <p className="text-sm text-gray-600">{document.description}</p>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="mt-3">
              <h5 className="font-semibold text-sm text-gray-700 mb-2">Tags:</h5>
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <span key={index} className="badge badge-secondary" style={{ fontSize: "0.625rem" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleClose} className="btn btn-secondary">
            ❌ Close
          </button>
          <button onClick={handleDownload} className="btn btn-primary">
            📥 Download File
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilePreviewModal
