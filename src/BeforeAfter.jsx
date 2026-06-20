import { useState, useRef } from "react"

export default function BeforeAfter({ postId, imageUrl }) {

  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  function handleMouseDown() {
    dragging.current = true
  }

  function handleMouseUp() {
    dragging.current = false
  }

  function handleMouseMove(e) {
    if (!dragging.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPos(percent)
  }

  function handleTouchMove(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPos(percent)
  }

  const beforeSrc = imageUrl || "https://picsum.photos/320/240?random=" + postId
  const afterSrc = imageUrl || "https://picsum.photos/320/240?random=" + (postId + 100)

  return (
    <div style={{ marginTop: "12px" }}>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        letterSpacing: "2px",
        color: "#4c7ea8",
        marginBottom: "8px"
      }}>
        BEFORE / AFTER — DRAG TO COMPARE
      </p>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        style={{
          position: "relative",
          width: "100%",
          height: "180px",
          overflow: "hidden",
          borderRadius: "4px",
          cursor: "ew-resize",
          border: "1px solid #2a2520",
          userSelect: "none"
        }}
      >

        {/* AFTER — full image underneath */}
        <img
          src={afterSrc}
          alt="after"
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />

        {/* BEFORE — clipped on left side */}
        <div style={{
          position: "absolute",
          top: 0, left: 0,
          width: sliderPos + "%",
          height: "100%",
          overflow: "hidden"
        }}>
          <img
            src={beforeSrc}
            alt="before"
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: containerRef.current ? containerRef.current.offsetWidth + "px" : "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </div>

        {/* Divider line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: sliderPos + "%",
          width: "2px",
          height: "100%",
          backgroundColor: "#c9a84c",
          transform: "translateX(-50%)"
        }} />

        {/* Handle */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: sliderPos + "%",
          transform: "translate(-50%, -50%)",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "#c9a84c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          color: "#0a0908",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)"
        }}>
          ⇔
        </div>

        {/* Labels */}
        <div style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "#f0ebe0",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "3px 6px",
          borderRadius: "2px"
        }}>
          BEFORE
        </div>

        <div style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "#f0ebe0",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "3px 6px",
          borderRadius: "2px"
        }}>
          AFTER
        </div>

      </div>
    </div>
  )
}