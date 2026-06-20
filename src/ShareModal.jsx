import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

const APP_URL = "https://fellowship-nine.vercel.app"
const APP_NAME = "The Fellowship"

function getPostUrl(post) {
  return `${APP_URL}/post/${post.id}`
}

async function buildWatermarkedBlob(imageUrl, username) {
  return new Promise(async function(resolve, reject) {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const bitmapUrl = URL.createObjectURL(blob)
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = function() {
        const canvas = document.createElement("canvas")
        const MAX = 1080
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX / w, MAX / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, w, h)

        // Watermark bar
        const barH = Math.max(36, Math.round(h * 0.055))
        const pad = Math.round(barH * 0.28)
        ctx.fillStyle = "rgba(10, 9, 8, 0.72)"
        ctx.fillRect(0, h - barH, w, barH)

        // App name (left)
        const fontSize = Math.round(barH * 0.42)
        ctx.font = `${fontSize}px 'DM Sans', sans-serif`
        ctx.fillStyle = "#c9a84c"
        ctx.textBaseline = "middle"
        ctx.fillText(APP_NAME, pad, h - barH / 2)

        // URL (right)
        const urlFontSize = Math.round(barH * 0.33)
        ctx.font = `${urlFontSize}px 'DM Mono', monospace`
        ctx.fillStyle = "rgba(201,168,76,0.6)"
        const urlText = APP_URL.replace("https://", "")
        const urlW = ctx.measureText(urlText).width
        ctx.fillText(urlText, w - urlW - pad, h - barH / 2)

        URL.revokeObjectURL(bitmapUrl)
        canvas.toBlob(function(b) { resolve(b) }, "image/jpeg", 0.92)
      }
      img.onerror = reject
      img.src = bitmapUrl
    } catch(e) { reject(e) }
  })
}

export default function ShareModal({ post, onClose }) {
  const [watermarkedBlob, setWatermarkedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState(null)

  const postUrl = getPostUrl(post)
  const shareText = `@${post.user} shared a photo on ${APP_NAME} — "${post.caption || "untitled"}"`
  const fullShareText = `${shareText}\n${postUrl}`

  useEffect(function() {
    setGenerating(true)
    buildWatermarkedBlob(post.image_url, post.user).then(function(blob) {
      setWatermarkedBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      setGenerating(false)
    }).catch(function() {
      setGenerating(false)
      setShareError("Couldn't prepare image.")
    })
    return function() { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [post.image_url])

  async function nativeShare() {
    try {
      const file = new File([watermarkedBlob], "fellowship.jpg", { type: "image/jpeg" })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: APP_NAME, text: fullShareText, files: [file] })
      } else if (navigator.share) {
        await navigator.share({ title: APP_NAME, text: shareText, url: postUrl })
      } else {
        copyLink()
      }
    } catch(e) {
      if (e.name !== "AbortError") copyLink()
    }
  }

  function downloadImage() {
    const a = document.createElement("a")
    a.href = previewUrl
    a.download = `fellowship-${post.user}.jpg`
    a.click()
  }

  function copyLink() {
    navigator.clipboard.writeText(fullShareText).then(function() {
      setCopied(true)
      setTimeout(function() { setCopied(false) }, 2000)
    })
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, "_blank")
  }

  function shareEmail() {
    window.open(`mailto:?subject=${encodeURIComponent("Check this out on " + APP_NAME)}&body=${encodeURIComponent(fullShareText)}`, "_blank")
  }

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, "_blank")
  }

  const targets = [
    {
      label: "WHATSAPP",
      icon: "💬",
      action: shareWhatsApp,
      color: "#25D366",
    },
    {
      label: "EMAIL",
      icon: "✉",
      action: shareEmail,
      color: S.gold,
    },
    {
      label: "TWITTER / X",
      icon: "𝕏",
      action: shareTwitter,
      color: "#1DA1F2",
    },
    {
      label: copied ? "COPIED!" : "COPY LINK",
      icon: copied ? "✓" : "⧉",
      action: copyLink,
      color: copied ? "#4caf7d" : S.textMuted,
    },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.88)",
        zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
      }}
    >
      <motion.div
        onClick={function(e) { e.stopPropagation() }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          backgroundColor: S.surface, borderTop: `1px solid ${S.border}`,
          borderRadius: "16px 16px 0 0",
          width: "100%", maxWidth: "520px",
          padding: "0 0 32px 0", overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: S.border }} />
        </div>

        {/* Header */}
        <div style={{ padding: "4px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${S.border}` }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.18em", color: S.gold, textTransform: "uppercase", marginBottom: "2px" }}>
              Share
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted }}>
              by <span style={{ color: S.textPrimary }}>@{post.user}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: S.textMuted }}>
            CLOSE
          </button>
        </div>

        {/* Watermarked preview */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{
            position: "relative", borderRadius: "6px", overflow: "hidden",
            border: `1px solid ${S.border}`, backgroundColor: S.bg,
            minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {generating ? (
              <div style={{ padding: "32px", textAlign: "center" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}`, margin: "0 auto 8px" }}
                />
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted, letterSpacing: "0.1em" }}>Adding watermark…</p>
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="preview" style={{ width: "100%", display: "block", maxHeight: "280px", objectFit: "cover" }} />
            ) : null}
          </div>

          {/* Download + native share row */}
          {!generating && previewUrl && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={downloadImage}
                style={{
                  flex: 1, padding: "10px", background: "none",
                  border: `1px solid ${S.border}`, borderRadius: "6px",
                  cursor: "pointer", fontFamily: "'DM Mono', monospace",
                  fontSize: "10px", letterSpacing: "0.12em", color: S.textMuted,
                  textTransform: "uppercase",
                }}
              >
                ↓ Save Image
              </button>
              <button
                onClick={nativeShare}
                style={{
                  flex: 1, padding: "10px",
                  background: `${S.gold}18`, border: `1px solid ${S.gold}55`,
                  borderRadius: "6px", cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", fontSize: "10px",
                  letterSpacing: "0.12em", color: S.gold, textTransform: "uppercase",
                }}
              >
                ↑ Share / Story
              </button>
            </div>
          )}
        </div>

        {/* Share targets */}
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {targets.map(function(t) {
            return (
              <button
                key={t.label}
                onClick={t.action}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", background: "none",
                  border: `1px solid ${S.border}`, borderRadius: "8px",
                  cursor: "pointer", transition: "border-color 0.15s",
                  width: "100%", textAlign: "left",
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = t.color }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = S.border }}
              >
                <span style={{ fontSize: "18px", width: "24px", textAlign: "center" }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.12em", color: t.color, margin: 0 }}>
                    {t.label}
                  </p>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted }}>→</span>
              </button>
            )
          })}
        </div>

        {shareError && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: S.red, padding: "12px 20px 0", margin: 0 }}>
            {shareError}
          </p>
        )}
      </motion.div>
    </div>
  )
}
