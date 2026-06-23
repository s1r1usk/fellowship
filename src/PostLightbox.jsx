import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

export default function PostLightbox({ post, onClose, onLike, onNext, onPrev }) {
  useEffect(function() {
    function handleKey(e) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" && onNext) onNext()
      if (e.key === "ArrowLeft" && onPrev) onPrev()
    }
    window.addEventListener("keydown", handleKey)
    return function() { window.removeEventListener("keydown", handleKey) }
  }, [onClose, onNext, onPrev])

  if (!post) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.96)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* Close */}
      <button onClick={onClose}
        style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: "22px", zIndex: 10, padding: "8px" }}>
        ✕
      </button>

      {/* Prev */}
      {onPrev && (
        <button onClick={function(e) { e.stopPropagation(); onPrev() }}
          style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: `1px solid ${S.border}`, borderRadius: "50%", cursor: "pointer", color: S.textPrimary, fontSize: "18px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          ‹
        </button>
      )}

      {/* Next */}
      {onNext && (
        <button onClick={function(e) { e.stopPropagation(); onNext() }}
          style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: `1px solid ${S.border}`, borderRadius: "50%", cursor: "pointer", color: S.textPrimary, fontSize: "18px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          ›
        </button>
      )}

      <div onClick={function(e) { e.stopPropagation() }}
        style={{ display: "flex", maxWidth: "1100px", width: "100%", maxHeight: "100vh", padding: "20px", gap: "0", alignItems: "stretch" }}
        className="lightbox-inner"
      >
        {/* Image */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}
        >
          <img src={post.image_url} alt={post.caption}
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "4px", display: "block" }} />
        </motion.div>

        {/* Info panel */}
        <div style={{ width: "280px", flexShrink: 0, backgroundColor: S.surface, borderLeft: `1px solid ${S.border}`, display: "flex", flexDirection: "column", borderRadius: "0 8px 8px 0", overflow: "hidden" }}
          className="lightbox-panel">

          {/* User */}
          <div style={{ padding: "16px", borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: `${S.gold}18`, border: `1px solid ${S.gold}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {post.avatar_url
                  ? <img src={post.avatar_url} alt={post.user} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: S.gold }}>{post.user?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: S.gold, margin: 0, letterSpacing: "0.05em" }}>@{post.user}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.blue, margin: 0, letterSpacing: "0.1em" }}>{post.category}</p>
              </div>
            </div>
            {post.caption && (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: S.textPrimary, margin: 0, lineHeight: 1.6 }}>
                "{post.caption}"
              </p>
            )}
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {post.tags.map(function(tag) {
                return (
                  <span key={tag} style={{ padding: "2px 8px", borderRadius: "2px", border: `1px solid ${S.gold}33`, backgroundColor: `${S.gold}0a`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>
                    #{tag}
                  </span>
                )
              })}
            </div>
          )}

          {/* EXIF */}
          {post.exif && (
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}` }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: S.blue, letterSpacing: "0.15em", marginBottom: "8px" }}>EXIF</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                {[
                  ["Camera", post.exif.Make && post.exif.Model ? `${post.exif.Make} ${post.exif.Model}` : null],
                  ["Lens", post.exif.LensModel],
                  ["f/", post.exif.FNumber ? `f/${post.exif.FNumber}` : null],
                  ["Shutter", post.exif.ExposureTime ? (post.exif.ExposureTime < 1 ? `1/${Math.round(1/post.exif.ExposureTime)}s` : `${post.exif.ExposureTime}s`) : null],
                  ["ISO", post.exif.ISO ? `ISO ${post.exif.ISO}` : null],
                  ["FL", post.exif.FocalLength ? `${post.exif.FocalLength}mm` : null],
                ].filter(function(r) { return r[1] }).map(function(r) {
                  return (
                    <div key={r[0]}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "7px", color: S.textMuted, letterSpacing: "0.1em", display: "block" }}>{r[0]}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: S.textPrimary }}>{r[1]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Likes */}
          <div style={{ padding: "16px", marginTop: "auto", borderTop: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={function() { onLike && onLike(post.id) }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: post.liked ? S.red : "#4a4035", padding: 0, lineHeight: 1, transition: "transform 0.1s" }}
              onMouseEnter={function(e) { e.currentTarget.style.transform = "scale(1.2)" }}
              onMouseLeave={function(e) { e.currentTarget.style.transform = "scale(1)" }}>
              {post.liked ? "♥" : "♡"}
            </button>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: S.textMuted }}>{post.likes}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted, marginLeft: "auto", letterSpacing: "0.05em" }}>💬 {post.comments?.length || 0}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .lightbox-inner { flex-direction: column !important; padding: 0 !important; gap: 0 !important; }
          .lightbox-panel { width: 100% !important; border-left: none !important; border-top: 1px solid #2a2520; border-radius: 0 !important; max-height: 35vh; overflow-y: auto; }
        }
      `}</style>
    </motion.div>
  )
}
