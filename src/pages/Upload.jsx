"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../config/api"
import toast from "react-hot-toast"

const Upload = () => {
  const [formData, setFormData] = useState({
    description: "",
    tags: "",
    accessLevel: "private",
    accessPin: "",
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (formData.accessLevel === "protected" && (!formData.accessPin || formData.accessPin.length < 4)) {
      toast.error("Protected files require a PIN of at least 4 characters")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("document", file)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("tags", formData.tags)
    formDataToSend.append("accessLevel", formData.accessLevel)
    if (formData.accessLevel === "protected") {
      formDataToSend.append("accessPin", formData.accessPin)
    }

    try {
      setLoading(true)
      const response = await apiClient.post("/api/documents/upload", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds for file upload
      })

      toast.success(response.data.message)
      navigate("/documents")
    } catch (error) {
      console.error("Upload error:", error)
      const message = error.response?.data?.message || error.message || "Upload failed"
      toast.error(message)

      // Show additional details if available
      if (error.response?.data?.details) {
        toast.error(error.response.data.details)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getAccessLevelInfo = (level) => {
    switch (level) {
      case "public":
        return { icon: "🌍", text: "Anyone can view and download", color: "access-public" }
      case "private":
        return { icon: "🔒", text: "Only you and admins can access", color: "access-private" }
      case "protected":
        return { icon: "🔐", text: "Requires PIN to access", color: "access-protected" }
      default:
        return { icon: "🔒", text: "Private access", color: "access-private" }
    }
  }

  const accessInfo = getAccessLevelInfo(formData.accessLevel)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">📤 Upload Document</h1>
        <p className="text-gray-600">Upload your files with version control and access management to Dropbox</p>
      </div>

      <div className="card" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit}>
          {/* File Upload Area */}
          <div className="form-group">
            <label className="font-semibold">Select File</label>
            <div
              className={`file-upload-area ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.ppt,.pptx"
              />

              {file ? (
                <div>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
                  <div className="font-semibold mb-2">{file.name}</div>
                  <div className="text-gray-500 text-sm mb-3">{formatFileSize(file.size)}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    🗑️ Remove File
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📁</div>
                  <div className="font-semibold mb-2">Drop your file here or click to browse</div>
                  <div className="text-gray-500 text-sm">
                    Supports: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLS, PPT (Max 10MB)
                    <br />
                    <span className="badge badge-info mt-2">📦 Files stored securely in Dropbox</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Access Level Selection */}
          <div className="form-group">
            <label htmlFor="accessLevel" className="font-semibold">
              File Access Level
            </label>
            <select
              id="accessLevel"
              name="accessLevel"
              className="form-control"
              value={formData.accessLevel}
              onChange={handleInputChange}
            >
              <option value="private">🔒 Private - Only you and admins can access</option>
              <option value="public">🌍 Public - Anyone can view and download</option>
              <option value="protected">🔐 Protected - Requires PIN to access</option>
            </select>
            <div
              className={`text-sm mt-2 p-3 rounded ${accessInfo.color === "access-public" ? "bg-green-50 border border-green-200" : accessInfo.color === "access-protected" ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}
            >
              <strong>
                {accessInfo.icon} {accessInfo.text}
              </strong>
              <div className="text-xs mt-1">
                {formData.accessLevel === "public" && "All users can find and download this file"}
                {formData.accessLevel === "private" && "Only you and system administrators can access this file"}
                {formData.accessLevel === "protected" && "Anyone with the PIN can access this file"}
              </div>
            </div>
          </div>

          {/* PIN Input for Protected Files */}
          {formData.accessLevel === "protected" && (
            <div className="form-group">
              <label htmlFor="accessPin" className="font-semibold">
                Set Access PIN
              </label>
              <input
                type="password"
                id="accessPin"
                name="accessPin"
                className="form-control"
                placeholder="Enter 4+ character PIN"
                value={formData.accessPin}
                onChange={handleInputChange}
                minLength="4"
                required
              />
              <div className="text-xs text-gray-600 mt-1">
                💡 Users will need this PIN to download the file. Make it memorable but secure.
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="font-semibold">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              rows="3"
              placeholder="Enter a description for your document..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags" className="font-semibold">
              Tags (Optional)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="form-control"
              placeholder="Enter tags separated by commas (e.g., report, finance, 2024)"
              value={formData.tags}
              onChange={handleInputChange}
            />
            <div className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</div>
          </div>

          {/* Version Info */}
          <div className="alert alert-info">
            <strong>📋 Version Control:</strong> If you upload a file with the same name again, it will automatically
            create a new version (v2, v3, etc.) and store it in Dropbox
          </div>

          {/* Submit Button */}
          <div className="form-group">
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || !file}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: "1rem", height: "1rem" }}></div>
                  Uploading to Dropbox...
                </>
              ) : (
                <>📤 Upload to Dropbox</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Upload
