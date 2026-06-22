import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

const PRESETS = [
  { name: "Original", desc: "no filter", values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, shadows: 0, highlights: 0, vignette: 0 } },
  { name: "Shire", desc: "warm & golden", values: { brightness: 8, contrast: 10, saturation: 20, warmth: 30, shadows: 10, highlights: -5, vignette: 20 } },
  { name: "Mordor", desc: "dark & desolate", values: { brightness: -15, contrast: 30, saturation: -40, warmth: 20, shadows: -20, highlights: -10, vignette: 50 } },
  { name: "Rivendell", desc: "cool & ethereal", values: { brightness: 10, contrast: -5, saturation: -15, warmth: -25, shadows: 15, highlights: 10, vignette: 15 } },
  { name: "Rohan", desc: "sun-drenched", values: { brightness: 12, contrast: 15, saturation: 10, warmth: 40, shadows: -5, highlights: 20, vignette: 25 } },
  { name: "Mirkwood", desc: "deep shadows", values: { brightness: -10, contrast: 20, saturation: -20, warmth: -10, shadows: -30, highlights: -15, vignette: 40 } },
  { name: "Isengard", desc: "cold steel", values: { brightness: -5, contrast: 40, saturation: -60, warmth: 0, shadows: -10, highlights: -20, vignette: 30 } },
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

const CROP_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4/3 },
  { label: "16:9", value: 16/9 },
  { label: "3:4", value: 3/4 },
]

function applyEdits(ctx, img, w, h, edits) {
  ctx.clearRect(0, 0, w, h)
  const brightness = 1 + edits.brightness / 100
  const contrast = 1 + edits.contrast / 100
  const saturation = 1 + edits.saturation / 100
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = "none"
  if (edits.warmth !== 0) {
    const alpha = Math.abs(edits.warmth) / 400
    ctx.globalCompositeOperation = "multiply"
    ctx.fillStyle = edits.warmth > 0 ? `rgba(255,180,50,${alpha})` : `rgba(50,120,255,${alpha})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
  }
  if (edits.shadows !== 0) {
    const alpha = Math.abs(edits.shadows) / 300
    ctx.globalCompositeOperation = edits.shadows < 0 ? "multiply" : "screen"
    ctx.fillStyle = edits.shadows < 0 ? `rgba(0,0,0,${alpha})` : `rgba(60,40,20,${alpha})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
  }
  if (edits.highlights !== 0) {
    const alpha = Math.abs(edits.highlights) / 300
    ctx.globalCompositeOperation = edits.highlights > 0 ? "screen" : "multiply"
    ctx.fillStyle = edits.highlights > 0 ? `rgba(255,255,220,${alpha})` : `rgba(200,200,200,${alpha})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
  }
  if (edits.vignette > 0) {
    const g = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.75)
    g.addColorStop(0, "rgba(0,0,0,0)")
    g.addColorStop(1, `rgba(0,0,0,${edits.vignette/120})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

export default function PhotoEditor({ imageUrl, onSave, onClose, saving, mode = "save" }) {
  const canvasRef = useRef(null)
  const cropCanvasRef = useRef(null)
  const imgRef = useRef(null)
  const [edits, setEdits] = useState(PRESETS[0].values)
  const [activePreset, setActivePreset] = useState(0)
  const [activeTab, setActiveTab] = useState("presets")
  const [imgLoaded, setImgLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })

  // Crop state
  const [cropRatio, setCropRatio] = useState(null)
  const [crop, setCrop] = useState(null) // { x, y, w, h } in canvas pixels
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const previewRef = useRef(null)

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
    // Draw crop overlay
    if (crop && cropRatio !== null) {
      ctx.strokeStyle = "#c9a84c"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)
      ctx.setLineDash([])
      // Darken outside crop
      ctx.fillStyle = "rgba(0,0,0,0.45)"
      ctx.fillRect(0, 0, canvasSize.w, crop.y)
      ctx.fillRect(0, crop.y + crop.h, canvasSize.w, canvasSize.h - crop.y - crop.h)
      ctx.fillRect(0, crop.y, crop.x, crop.h)
      ctx.fillRect(crop.x + crop.w, crop.y, canvasSize.w - crop.x - crop.w, crop.h)
    }
  }, [edits, imgLoaded, canvasSize, crop, cropRatio])

  function getCanvasCoords(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasSize.w / rect.width
    const scaleY = canvasSize.h / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function handleCropMouseDown(e) {
    if (cropRatio === null && activeTab !== "crop") return
    const pos = getCanvasCoords(e)
    setDragging(true)
    setDragStart(pos)
    setCrop(null)
  }

  function handleCropMouseMove(e) {
    if (!dragging || !dragStart) return
    const pos = getCanvasCoords(e)
    let x = Math.min(dragStart.x, pos.x)
    let y = Math.min(dragStart.y, pos.y)
    let w = Math.abs(pos.x - dragStart.x)
    let h = Math.abs(pos.y - dragStart.y)
    if (cropRatio) {
      h = w / cropRatio
    }
    x = Math.max(0, Math.min(x, canvasSize.w - w))
    y = Math.max(0, Math.min(y, canvasSize.h - h))
    w = Math.min(w, canvasSize.w - x)
    h = Math.min(h, canvasSize.h - y)
    setCrop({ x, y, w, h })
  }

  function handleCropMouseUp() { setDragging(false) }

  function applyPreset(i) { setActivePreset(i); setEdits({ ...PRESETS[i].values }) }
  function updateSlider(key, val) { setActivePreset(-1); setEdits(function(p) { return { ...p, [key]: Number(val) } }) }
  function resetAll() { setEdits(PRESETS[0].values); setActivePreset(0); setCrop(null) }

  function handleSave() {
    if (!canvasRef.current) return
    if (crop && crop.w > 10 && crop.h > 10) {
      // Export only cropped region
      const tmp = document.createElement("canvas")
      tmp.width = Math.round(crop.w)
      tmp.height = Math.round(crop.h)
      const tmpCtx = tmp.getContext("2d")
      tmpCtx.drawImage(canvasRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)
      tmp.toBlob(function(blob) { onSave(blob) }, "image/jpeg", 0.92)
    } else {
      canvasRef.current.toBlob(function(blob) { onSave(blob) }, "image/jpeg", 0.92)
    }
  }

  const tabs = [["presets", "✦ PRESETS"], ["adjust", "⊙ ADJUST"], ["crop", "⊡ CROP"]]

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.98)", zIndex: 500, display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${S.border}`, flexShrink: 0, backgroundColor: S.bg }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: S.gold, margin: "0 0 1px" }}>{mode === "suggest" ? "SUGGEST EDIT" : "PHOTO EDITOR"}</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "12px", color: S.textMuted, margin: 0 }}>{mode === "suggest" ? "Your edit posts as a suggestion" : "Forge your vision"}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={resetAll} style={{ padding: "7px 14px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", cursor: "pointer" }}>RESET</button>
          <button onClick={handleSave} disabled={saving || !imgLoaded}
            style={{ padding: "7px 20px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: saving ? `${S.gold}55` : S.gold, fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? (mode === "suggest" ? "POSTING…" : "SAVING…") : mode === "suggest" ? "✦ SUGGEST" : "✦ SAVE"}
          </button>
          <button onClick={onClose} style={{ padding: "7px 12px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "9px", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Body — side by side on desktop, stacked on mobile */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: "row" }} className="editor-body">

        {/* Canvas — left/top */}
        <div style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#050403", overflow: "hidden", position: "relative" }}>
          {!imgLoaded ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
          ) : (
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              onMouseDown={activeTab === "crop" ? handleCropMouseDown : undefined}
              onMouseMove={activeTab === "crop" ? handleCropMouseMove : undefined}
              onMouseUp={activeTab === "crop" ? handleCropMouseUp : undefined}
              onTouchStart={activeTab === "crop" ? handleCropMouseDown : undefined}
              onTouchMove={activeTab === "crop" ? handleCropMouseMove : undefined}
              onTouchEnd={activeTab === "crop" ? handleCropMouseUp : undefined}
              style={{
                maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block",
                cursor: activeTab === "crop" ? "crosshair" : "default",
              }}
            />
          )}
          {activeTab === "crop" && imgLoaded && (
            <p style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.textMuted, letterSpacing: "0.1em", whiteSpace: "nowrap", backgroundColor: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "3px" }}>
              DRAG TO SELECT CROP AREA
            </p>
          )}
        </div>

        {/* Controls — right/bottom */}
        <div style={{ width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${S.border}`, backgroundColor: S.bg, overflow: "hidden" }} className="editor-controls">

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            {tabs.map(function([key, label]) {
              return (
                <button key={key} onClick={function() { setActiveTab(key) }}
                  style={{ flex: 1, padding: "12px 4px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === key ? S.gold : "transparent"}`, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: activeTab === key ? S.gold : S.textMuted, transition: "all 0.15s" }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

            {activeTab === "presets" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {PRESETS.map(function(preset, i) {
                  const active = activePreset === i
                  return (
                    <button key={preset.name} onClick={function() { applyPreset(i) }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: `1px solid ${active ? S.gold : S.border}`, borderRadius: "6px", backgroundColor: active ? `${S.gold}10` : S.surface, cursor: "pointer", transition: "all 0.15s", width: "100%", textAlign: "left" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", color: active ? S.gold : S.textPrimary }}>{preset.name}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "12px", color: S.textMuted }}>{preset.desc}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === "adjust" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {SLIDERS.map(function(slider) {
                  const val = edits[slider.key]
                  return (
                    <div key={slider.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: S.textMuted }}>{slider.label.toUpperCase()}</label>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: val === 0 ? S.textMuted : S.gold, minWidth: "32px", textAlign: "right" }}>{val > 0 ? "+" : ""}{val}</span>
                      </div>
                      <input type="range" min={slider.min} max={slider.max} value={val}
                        onChange={function(e) { updateSlider(slider.key, e.target.value) }}
                        style={{ width: "100%", appearance: "none", background: `linear-gradient(to right, ${S.gold} ${((val - slider.min) / (slider.max - slider.min)) * 100}%, #2a2520 ${((val - slider.min) / (slider.max - slider.min)) * 100}%)`, borderRadius: "3px", height: "4px", cursor: "pointer", outline: "none" }} />
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "crop" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.textMuted, margin: 0 }}>ASPECT RATIO</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {CROP_RATIOS.map(function(r) {
                    const active = cropRatio === r.value
                    return (
                      <button key={r.label} onClick={function() { setCropRatio(r.value); setCrop(null) }}
                        style={{ padding: "8px 14px", border: `1px solid ${active ? S.gold : S.border}`, borderRadius: "4px", backgroundColor: active ? `${S.gold}12` : "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: active ? S.gold : S.textMuted }}>
                        {r.label}
                      </button>
                    )
                  })}
                </div>
                {crop && (
                  <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.blue, letterSpacing: "0.1em", marginBottom: "8px" }}>
                      {Math.round(crop.w)} × {Math.round(crop.h)}px selected
                    </p>
                    <button onClick={function() { setCrop(null) }}
                      style={{ padding: "6px 14px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.textMuted }}>
                      CLEAR CROP
                    </button>
                  </div>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: S.textMuted, lineHeight: 1.5, margin: 0 }}>
                  Select a ratio then drag on the image to define the crop area. The cropped region will be exported when you save.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px;
          border-radius: 50%; background: #c9a84c;
          border: 2px solid #0a0908; cursor: pointer; margin-top: -7px;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #c9a84c; border: 2px solid #0a0908; cursor: pointer;
        }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 3px; }
        input[type=range]::-moz-range-track { height: 4px; border-radius: 3px; background: #2a2520; }
        @media (max-width: 640px) {
          .editor-body { flex-direction: column !important; }
          .editor-controls { width: 100% !important; border-left: none !important; border-top: 1px solid #2a2520; max-height: 45vh; }
        }
      `}</style>
    </div>
  )
}
