import { useState, useRef } from "react"
import ReactCrop from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

export default function EditModal({ post, onClose, onSubmit }) {

  const [crop, setCrop] = useState({ unit: "%", width: 80, height: 80, x: 10, y: 10 })
  const [completedCrop, setCompletedCrop] = useState(null)
  const [note, setNote] = useState("")
  const imgRef = useRef(null)

  function handleSubmit() {
    if (!note.trim()) return
    onSubmit({
      postId: post.id,
      note: note,
      crop: completedCrop,
      user: "you"
    })
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 200,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "20px",
      overflow: "auto"
    }}>
      <div onClick={function(e) { e.stopPropagation() }} style={{
        backgroundColor: "#141210",
        border: "1px solid #2a2520",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "560px",
        marginTop: "20px",
        marginBottom: "20px"
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #2a2520",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          backgroundColor: "#141210",
          zIndex: 1
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#c9a84c"
          }}>
            SUGGEST AN EDIT
          </p>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#7a6f5e"
            }}
          >
            CLOSE
          </button>
        </div>

        {/* Crop Area */}
        <div style={{ padding: "20px" }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            color: "#7a6f5e",
            marginBottom: "12px"
          }}>
            Drag to suggest a crop
          </p>

          <ReactCrop
            crop={crop}
            onChange={function(c) { setCrop(c) }}
            onComplete={function(c) { setCompletedCrop(c) }}
          >
            <img
              ref={imgRef}
              src={post.image_url || "https://picsum.photos/320/240?random=" + post.id}
              alt="edit"
              style={{ width: "100%", borderRadius: "4px", display: "block" }}
            />
          </ReactCrop>

          {/* Edit Note */}
          <div style={{ marginTop: "16px" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "2px",
              color: "#7a6f5e",
              marginBottom: "8px"
            }}>
              YOUR NOTE
            </p>
            <input
              type="text"
              placeholder="Explain your suggested edit..."
              value={note}
              onChange={function(e) { setNote(e.target.value) }}
              style={{
                width: "100%",
                background: "#0a0908",
                border: "1px solid #2a2520",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#f0ebe0",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={{
              marginTop: "14px",
              width: "100%",
              background: note.trim() ? "#c9a84c" : "#2a2520",
              border: "none",
              borderRadius: "4px",
              cursor: note.trim() ? "pointer" : "not-allowed",
              padding: "12px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "2px",
              color: note.trim() ? "#0a0908" : "#4a4035",
              fontWeight: "bold",
              transition: "all 0.2s"
            }}
          >
            POST EDIT SUGGESTION
          </button>

        </div>
      </div>
    </div>
  )
}