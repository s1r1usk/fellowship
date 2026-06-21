import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

const PRESETS = [
  { name: "Original", values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, shadows: 0, highlights: 0, vignette: 0 } },
  { name: "Shire", values: { brightness: 8, contrast: 10, saturation: 20, warmth: 30, shadows: 10, highlights: -5, vignette: 20 } },
  { name: "Mordor", values: { brightness: -15, contrast: 30, saturation: -40, warmth: 20, shadows: -20, highlights: -10, vignette: 50 } },
  { name: "Rivendell", values: { brightness: 10, contrast: -5, saturation: -15, warmth: -25, shadows: 15, highlights: 10, vignette: 15 } },
  { name: "Rohan", values: { brightness: 12, contrast: 15, saturation: 10, warmth: 40, shadows: -5, highlights: 20, vignette: 25 } },
  { name: "Mirkwood", values: { brightness: -10, contrast: 20, saturation: -20, warmth: -10, shadows: -30, highlights: -15, vignette: 40 } },
  { name: "Isengard", values: { brightness: -5, contrast: 40, saturation: -60, warmth: 0, shadows: -10, highlights: -20, vignette: 30 } },
]

const SLIDERS = [
  { key: "brightness", label: "Brightness", min: -100, max: 100 },
  { key: "contrast", label: "Contrast", min: -100, max: 100 },
  { key: "saturation", label: "Saturation", min: -100, max: 100 },
  { key: "warmth", label: "Warmth", min: -100, max: 100 },
  { key: "shadows", label: "Shadows", min: -100, max: 100 },
  { key: "highlights", label: "Highlights", min: -100, max: 100 },
  { key: "vignette", label: "Vignette", min: 0, max: 100 },
]

function applyEdits(ctx, img, w, h, edits) {
  ctx.clearRect(0, 0, w, h)

  // Build CSS filter string
  const brightness = 1 + edits.brightness / 100
  const contrast = 1 + edits.contrast / 100
  const saturation = 1 + edits.saturation / 100

  // Warmth via color matrix approximation using compositing
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = "none"

  // Warmth overlay
  if (edits.warmth !== 0) {
    const alpha = Math.abs(edits.warmth) / 400
    ctx.globalCompositeOperation = "multiply"
    if (edits.warmth > 0) {
      ctx.fillStyle = `rgba(255, 180, 50, ${alpha})`
    } else {
      ctx.fillStyle = `rgba(50, 120, 255, ${Math.abs(edits.warmth) / 400})`
    }
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
  }

  // Shadows — darken dark areas
  if (edits.shadows !== 0) {
    const alpha = Math.abs(edits.shadows) / 300
    if (edits.shadows < 0) {
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = `rgba(0,0,0,${alpha})`
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = `rgba(60,40,20,${alpha})`
      ctx.fillRect(0, 0, w, h)
    }
    ctx.globalCompositeOperation = "source-over"
  }

  // Highlights
  if (edits.highlights !== 0) {
    const alpha = Math.abs(edits.highlights) / 300
    if (edits.highlights > 0) {
      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = `rgba(255,255,220,${alpha})`
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = `rgba(200,200,200,${alpha})`
      ctx.fillRect(0, 0, w, h)
    }
    ctx.globalCompositeOperation = "source-over"
  }

  // Vignette
  if (edits.vignette > 0) {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
    gradient.addColorStop(0, "rgba(0,0,0,0)")
    gradient.addColorStop(1, `rgba(0,0,0,${edits.vignette / 120})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }
}

export default function PhotoEditor({ imageUrl, onSave, onClose, saving, mode = "save" }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [edits, setEdits] = useState(PRESETS[0].values)
  const [activePreset, setActivePreset] = useState(0)
  const [activeTab, setActiveTab] = useState("presets") // presets | adjust
  const [imgLoaded, setImgLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })

  useEffect(function() {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = function() {
      imgRef.current = img
      const maxW = Math.min(img.naturalWidth, 1080)
      const ratio = img.naturalHeight / img.naturalWidth
      const w = maxW
      const h = Math.round(w * ratio)
      setCanvasSize({ w, h })
      setImgLoaded(true)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(function() {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    applyEdits(ctx, imgRef.current, canvasSize.w, canvasSize.h, edits)
  }, [edits, imgLoaded, canvasSize])

  function applyPreset(i) {
    setActivePreset(i)
    setEdits({ ...PRESETS[i].values })
  }

  function updateSlider(key, val) {
    setActivePreset(-1)
    setEdits(function(prev) { return { ...prev, [key]: Number(val) } })
  }

  function handleSave() {
    if (!canvasRef.current) return
    canvasRef.current.toBlob(function(blob) {
      onSave(blob)
    }, "image/jpeg", 0.92)
  }

  function resetAll() {
    setEdits(PRESETS[0].values)
    setActivePreset(0)
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.97)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", overflowY: "auto" }}>
      <div onClick={function(e) { e.stopPropagation() }} style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: S.gold, margin: "0 0 2px" }}>{mode === "suggest" ? "SUGGEST EDIT" : "PHOTO EDITOR"}</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", color: S.textMuted, margin: 0 }}>{mode === "suggest" ? "Your edit will appear as a suggestion" : "Forge your vision"}</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={resetAll} style={{ padding: "7px 14px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", cursor: "pointer" }}>RESET</button>
            <button onClick={handleSave} disabled={saving || !imgLoaded}
              style={{ padding: "7px 18px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: saving ? `${S.gold}66` : S.gold, fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? (mode === "suggest" ? "POSTING…" : "SAVING…") : mode === "suggest" ? "✦ SUGGEST" : "✦ SAVE"}
            </button>
            <button onClick={onClose} style={{ padding: "7px 12px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "9px", cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* Canvas preview */}
        <div style={{ padding: "16px 20px", backgroundColor: "#050403", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          {!imgLoaded ? (
            <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain", display: "block", borderRadius: "2px" }}
            />
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          {[["presets", "✦ PRESETS"], ["adjust", "⊙ ADJUST"]].map(function([key, label]) {
            return (
              <button key={key} onClick={function() { setActiveTab(key) }}
                style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === key ? S.gold : "transparent"}`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: activeTab === key ? S.gold : S.textMuted, transition: "all 0.15s" }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Controls */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>

          {activeTab === "presets" && (
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.textMuted, marginBottom: "16px" }}>MIDDLE-EARTH LOOKS</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
                {PRESETS.map(function(preset, i) {
                  const active = activePreset === i
                  return (
                    <button key={preset.name} onClick={function() { applyPreset(i) }}
                      style={{ padding: "12px 8px", border: `1px solid ${active ? S.gold : S.border}`, borderRadius: "6px", backgroundColor: active ? `${S.gold}12` : S.surface, cursor: "pointer", transition: "all 0.15s" }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: active ? S.gold : S.textMuted, margin: "0 0 4px" }}>{preset.name.toUpperCase()}</p>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "11px", color: S.textMuted, margin: 0, opacity: 0.7 }}>
                        {i === 0 ? "no filter" : i === 1 ? "warm & golden" : i === 2 ? "dark & desolate" : i === 3 ? "cool & ethereal" : i === 4 ? "sun-drenched" : i === 5 ? "deep shadows" : "cold steel"}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "adjust" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {SLIDERS.map(function(slider) {
                const val = edits[slider.key]
                return (
                  <div key={slider.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.textMuted }}>{slider.label.toUpperCase()}</label>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: val === 0 ? S.textMuted : S.gold }}>{val > 0 ? "+" : ""}{val}</span>
                    </div>
                    <div style={{ position: "relative", height: "4px", backgroundColor: S.border, borderRadius: "2px" }}>
                      <div style={{
                        position: "absolute", height: "100%", borderRadius: "2px",
                        backgroundColor: S.gold,
                        left: val >= 0 ? "50%" : `${50 + (val / slider.min) * 50}%`,
                        width: `${Math.abs(val) / (slider.max - slider.min) * 100 * (slider.min < 0 ? 2 : 1)}%`,
                      }} />
                    </div>
                    <input type="range" min={slider.min} max={slider.max} value={val}
                      onChange={function(e) { updateSlider(slider.key, e.target.value) }}
                      style={{ width: "100%", appearance: "none", background: "transparent", cursor: "pointer", height: "20px", marginTop: "-12px", position: "relative", zIndex: 1 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #c9a84c;
          border: 2px solid #0a0908;
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #c9a84c;
          border: 2px solid #0a0908;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
