import { useState, useRef } from "react"

export default function BeforeAfter({ beforeUrl, afterUrl }) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  function getPercent(clientX) {
    const rect = containerRef.current.getBoundingClientRect()
    return Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100)
  }

  function handleMouseDown() { dragging.current = true }
  function handleMouseUp() { dragging.current = false }
  function handleMouseMove(e) { if (dragging.current) setSliderPos(getPercent(e.clientX)) }
  function handleTouchMove(e) { setSliderPos(getPercent(e.touches[0].clientX)) }

  return (
    <div style={{ marginTop: "12px" }}>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "8px" }}>
        BEFORE / AFTER — DRAG TO COMPARE
      </p>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", borderRadius: "4px", cursor: "ew-resize", border: "1px solid #2a2520", userSelect: "none" }}
      >
        {/* AFTER — underneath */}
        <img src={afterUrl} alt="after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

        {/* BEFORE — clipped left */}
        <div style={{ position: "absolute", top: 0, left: 0, width: sliderPos + "%", height: "100%", overflow: "hidden" }}>
          <img src={beforeUrl} alt="before" style={{ position: "absolute", top: 0, left: 0, width: containerRef.current ? containerRef.current.offsetWidth + "px" : "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Divider */}
        <div style={{ position: "absolute", top: 0, left: sliderPos + "%", width: "2px", height: "100%", backgroundColor: "#c9a84c", transform: "translateX(-50%)", pointerEvents: "none" }} />

        {/* Handle */}
        <div style={{ position: "absolute", top: "50%", left: sliderPos + "%", transform: "translate(-50%, -50%)", width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#0a0908", fontWeight: "bold", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", pointerEvents: "none" }}>
          ⇔
        </div>

        {/* Labels */}
        <div style={{ position: "absolute", top: "8px", left: "8px", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#f0ebe0", backgroundColor: "rgba(0,0,0,0.6)", padding: "3px 6px", borderRadius: "2px", pointerEvents: "none" }}>BEFORE</div>
        <div style={{ position: "absolute", top: "8px", right: "8px", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#f0ebe0", backgroundColor: "rgba(0,0,0,0.6)", padding: "3px 6px", borderRadius: "2px", pointerEvents: "none" }}>AFTER</div>
      </div>
    </div>
  )
}