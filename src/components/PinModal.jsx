"use client"

import { useState } from "react"
import toast from "react-hot-toast"

const PinModal = ({ isOpen, onClose, onVerify, documentName }) => {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pin || pin.length < 4) {
      toast.error("Please enter a valid PIN (at least 4 characters)")
      return
    }

    setLoading(true)
    try {
      await onVerify(pin)
      setPin("")
      // Don't close modal here - let parent handle it after successful verification
    } catch (error) {
      // Error is already handled in parent component
      console.error("PIN verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPin("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">🔐 Protected Document Access</h3>
        </div>

        <div className="modal-body">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">🔒</div>
            <h4 className="font-semibold text-gray-800 mb-2">PIN Required</h4>
            <p className="text-gray-600 mb-2">This document is protected and requires a PIN to access.</p>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="font-semibold text-gray-800">{documentName}</p>
              <p className="text-xs text-gray-500 mt-1">📦 Stored securely in Dropbox</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pin" className="font-semibold">
                Enter Access PIN
              </label>
              <input
                type="password"
                id="pin"
                className="form-control"
                placeholder="Enter the PIN (minimum 4 characters)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
                minLength="4"
                maxLength="20"
              />
              <div className="text-xs text-gray-500 mt-1">💡 Contact the document owner if you don't have the PIN</div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={handleClose} className="btn btn-secondary">
            ❌ Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading || !pin || pin.length < 4}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: "1rem", height: "1rem" }}></div>
                Verifying PIN...
              </>
            ) : (
              "🔓 Access Document"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PinModal
