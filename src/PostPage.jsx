import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "./supabase"
import { motion } from "framer-motion"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

export default function PostPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(function() {
    async function load() {
      const { data, error } = await supabase
        .from("photos")
        .select("*, profiles!photos_user_id_fkey(username)")
        .eq("id", id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      const { data: likeCounts } = await supabase
        .from("likes").select("photo_id").eq("photo_id", id)

      let liked = false
      if (user) {
        const { data: userLike } = await supabase
          .from("likes").select("photo_id").eq("photo_id", id).eq("user_id", user.id).single()
        liked = !!userLike
      }

      setPost({
        id: data.id,
        user: data.profiles?.username || "unknown",
        caption: data.caption,
        category: data.category,
        image_url: data.image_url,
        likes: (likeCounts || []).length,
        liked,
        gear: data.gear || null,
        tags: data.tags || [],
      })
      setLoading(false)
    }
    load()
  }, [id, user])

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <p style={{ fontFamily: "'RingBearer', serif", fontSize: "24px", color: S.gold }}>Not in the Archives</p>
      <button onClick={function() { navigate("/") }}
        style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: "4px", padding: "10px 24px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: S.textMuted }}>
        RETURN TO THE FELLOWSHIP
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Back */}
      <div style={{ width: "100%", maxWidth: "680px", marginBottom: "24px" }}>
        <button onClick={function() { navigate("/") }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: 0 }}>
          ← BACK
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: "680px" }}>

        {/* Image */}
        <img src={post.image_url} alt={post.caption}
          style={{ width: "100%", borderRadius: "4px", display: "block", border: `1px solid ${S.border}` }} />

        {/* Meta */}
        <div style={{ padding: "20px 0", borderBottom: `1px solid ${S.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", letterSpacing: "0.12em", color: S.gold }}>
              @{post.user}
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: S.blue }}>
              {post.category}
            </p>
          </div>
          {post.caption && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontStyle: "italic", color: S.textPrimary, lineHeight: 1.6 }}>
              "{post.caption}"
            </p>
          )}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "16px 0", borderBottom: `1px solid ${S.border}` }}>
            {post.tags.map(function(tag) {
              return (
                <span key={tag} style={{ padding: "3px 10px", borderRadius: "2px", border: `1px solid ${S.gold}44`, backgroundColor: `${S.gold}12`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>
                  <span style={{ opacity: 0.5 }}>#</span>{tag}
                </span>
              )
            })}
          </div>
        )}

        {/* Gear */}
        {post.gear && (
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${S.border}` }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.blue, marginBottom: "10px" }}>⚙ GEAR</p>
            {[["BODY", post.gear.body], ["LENS", post.gear.lens], ["SETTINGS", post.gear.settings]].map(function(row) {
              return (
                <div key={row[0]} style={{ display: "flex", gap: "12px", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.blue, opacity: 0.7, minWidth: "56px" }}>{row[0]}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: S.textPrimary, opacity: 0.85 }}>{row[1]}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Likes */}
        <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: post.liked ? S.red : S.textMuted }}>
            {post.liked ? "♥" : "♡"} {post.likes}
          </span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "8px", padding: "20px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px", textAlign: "center" }}>
          <p style={{ fontFamily: "'RingBearer', serif", fontSize: "20px", color: S.gold, marginBottom: "8px" }}>The Fellowship</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted, marginBottom: "16px" }}>Join the cinematic photography community</p>
          <button onClick={function() { navigate("/") }}
            style={{ padding: "10px 28px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer" }}>
            ENTER THE FELLOWSHIP
          </button>
        </div>
      </motion.div>
    </div>
  )
}
