import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsPanel({ user, onClose, setViewingUser, setPage }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_from_user_id_fkey(username), photos(image_url, caption)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30)
      if (data) setNotifs(data)
      setLoading(false)
      // Mark all as read
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
    }
    load()
  }, [user.id])

  function notifText(n) {
    const who = n.profiles?.username || "someone"
    if (n.type === "like") return { who, action: "liked your photo" }
    if (n.type === "comment") return { who, action: "commented on your photo" }
    if (n.type === "follow") return { who, action: "started following you" }
    return { who, action: "interacted with you" }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", justifyContent: "flex-end" }}>
      <motion.div onClick={function(e) { e.stopPropagation() }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{ backgroundColor: S.surface, borderLeft: `1px solid ${S.border}`, width: "100%", maxWidth: "360px", height: "100%", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "20px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.18em", color: S.gold, margin: "0 0 2px" }}>NOTIFICATIONS</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", color: S.textMuted, margin: 0 }}>Your fellowship activity</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted }}>CLOSE</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textMuted }}>No notifications yet.</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted, opacity: 0.5, marginTop: "8px" }}>When someone likes or comments on your photos, it will appear here.</p>
            </div>
          ) : notifs.map(function(n, i) {
            const { who, action } = notifText(n)
            const icon = n.type === "like" ? "♥" : n.type === "comment" ? "💬" : "✦"
            const iconColor = n.type === "like" ? S.red : n.type === "follow" ? S.gold : S.blue
            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                style={{ display: "flex", gap: "12px", padding: "12px", borderRadius: "6px", backgroundColor: n.read ? "transparent" : `${S.gold}08`, border: `1px solid ${n.read ? "transparent" : S.gold + "22"}`, marginBottom: "6px", cursor: "pointer" }}
                onClick={function() { if (n.profiles?.username) { setViewingUser(n.profiles.username); setPage("home"); onClose() } }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: `${iconColor}18`, border: `1px solid ${iconColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px", color: iconColor }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textPrimary, margin: "0 0 2px", lineHeight: 1.4 }}>
                    <span style={{ color: S.gold, fontWeight: 500 }}>@{who}</span> {action}
                  </p>
                  {n.photos?.caption && (
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "12px", color: S.textMuted, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      "{n.photos.caption}"
                    </p>
                  )}
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.textMuted, margin: 0 }}>{timeAgo(n.created_at)}</p>
                </div>
                {n.photos?.image_url && (
                  <img src={n.photos.image_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
