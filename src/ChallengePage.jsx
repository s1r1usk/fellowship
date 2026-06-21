import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

function timeLeft(deadline) {
  const diff = new Date(deadline) - new Date()
  if (diff <= 0) return "Ended"
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `${d}d ${h}h left`
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m left`
}

export default function ChallengePage({ user, setPage }) {
  const [challenges, setChallenges] = useState([])
  const [selected, setSelected] = useState(null) // active challenge
  const [entries, setEntries] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [submitted, setSubmitted] = useState(new Set())
  const [showSubmit, setShowSubmit] = useState(false)

  useEffect(function() {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) setChallenges(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(function() {
    if (!selected) return
    async function loadEntries() {
      setEntriesLoading(true)

      const { data: cpData } = await supabase
        .from("challenge_photos")
        .select("photo_id, user_id, submitted_at")
        .eq("challenge_id", selected.id)

      if (!cpData || cpData.length === 0) { setEntries([]); setEntriesLoading(false); return }

      const submittedIds = new Set(cpData.map(function(cp) { return cp.photo_id }))
      setSubmitted(submittedIds)

      const photoIds = cpData.map(function(cp) { return cp.photo_id })
      const { data: photos } = await supabase
        .from("photos")
        .select("*, profiles!photos_user_id_fkey(username, verified)")
        .in("id", photoIds)

      const { data: likeCounts } = await supabase
        .from("likes")
        .select("photo_id")
        .in("photo_id", photoIds)

      const countMap = {}
      ;(likeCounts || []).forEach(function(l) {
        countMap[l.photo_id] = (countMap[l.photo_id] || 0) + 1
      })

      const formatted = (photos || []).map(function(p) {
        return {
          id: p.id,
          user: p.profiles?.username || "unknown",
          verified: p.profiles?.verified || false,
          image_url: p.image_url,
          caption: p.caption,
          likes: countMap[p.id] || 0,
        }
      }).sort(function(a, b) { return b.likes - a.likes })

      setEntries(formatted)
      setEntriesLoading(false)
    }
    loadEntries()
  }, [selected])

  useEffect(function() {
    if (!user || !showSubmit || !selected) return
    async function loadMyPosts() {
      const { data } = await supabase
        .from("photos")
        .select("id, image_url, caption")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) setMyPosts(data)
    }
    loadMyPosts()
  }, [showSubmit, user, selected])

  async function submitPhoto(photoId) {
    if (!user) return
    setSubmitting(true)
    const { error } = await supabase.from("challenge_photos").insert({
      challenge_id: selected.id,
      photo_id: photoId,
      user_id: user.id,
    })
    if (!error) {
      setSubmitted(new Set([...submitted, photoId]))
      setShowSubmit(false)
      // Refresh entries
      const trigger = { ...selected }
      setSelected(null)
      setTimeout(function() { setSelected(trigger) }, 100)
    }
    setSubmitting(false)
  }

  async function withdrawPhoto(photoId) {
    await supabase.from("challenge_photos")
      .delete()
      .eq("challenge_id", selected.id)
      .eq("photo_id", photoId)
      .eq("user_id", user.id)
    setSubmitted(new Set([...submitted].filter(function(id) { return id !== photoId })))
    setEntries(entries.filter(function(e) { return e.id !== photoId }))
  }

  const isActive = selected && new Date(selected.deadline) > new Date()

  if (!selected) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "48px" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, textTransform: "uppercase", marginBottom: "10px" }}>
          The Fellowship
        </p>
        <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(24px, 5vw, 42px)", color: S.textPrimary, fontWeight: "normal", margin: "0 0 8px" }}>
          Weekly Challenges
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textMuted, margin: "0 0 24px" }}>
          "All we have to decide is what to do with the time that is given us."
        </p>
        <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.4, margin: "0 auto" }} />
      </motion.div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
        </div>
      ) : (
        <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {challenges.map(function(c, i) {
            const active = new Date(c.deadline) > new Date()
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={function() { setSelected(c); setEntries([]); setShowSubmit(false) }}
                style={{
                  padding: "20px 24px", backgroundColor: S.surface,
                  border: `1px solid ${active ? S.gold + "44" : S.border}`,
                  borderRadius: "6px", cursor: "pointer", transition: "border-color 0.2s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h2 style={{ fontFamily: "'RingBearer', serif", fontSize: "20px", color: active ? S.gold : S.textMuted, fontWeight: "normal", margin: 0 }}>
                    {c.title}
                  </h2>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: active ? S.blue : S.textMuted, whiteSpace: "nowrap", marginLeft: "12px" }}>
                    {timeLeft(c.deadline)}
                  </span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted, margin: 0, lineHeight: 1.5 }}>
                  {c.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      {/* Back */}
      <div style={{ maxWidth: "720px", margin: "0 auto 24px" }}>
        <button onClick={function() { setSelected(null) }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: 0 }}>
          ← ALL CHALLENGES
        </button>
      </div>

      {/* Challenge header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: "720px", margin: "0 auto 40px", padding: "24px", backgroundColor: S.surface, border: `1px solid ${S.gold}33`, borderRadius: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(20px, 4vw, 32px)", color: S.gold, fontWeight: "normal", margin: 0 }}>
            {selected.title}
          </h1>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: isActive ? S.blue : S.textMuted, letterSpacing: "0.1em", whiteSpace: "nowrap", marginLeft: "16px" }}>
            {timeLeft(selected.deadline)}
          </span>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: S.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
          {selected.description}
        </p>
        {isActive && user && (
          <button onClick={function() { setShowSubmit(!showSubmit) }}
            style={{
              padding: "8px 20px", border: `1px solid ${S.gold}`, borderRadius: "3px",
              backgroundColor: `${S.gold}18`, color: S.gold,
              fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em",
              cursor: "pointer", transition: "all 0.2s",
            }}>
            {showSubmit ? "✕ CANCEL" : "✦ SUBMIT A PHOTO"}
          </button>
        )}
      </motion.div>

      {/* Submit panel */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ maxWidth: "720px", margin: "0 auto 32px", overflow: "hidden" }}>
            <div style={{ padding: "20px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.blue, marginBottom: "16px" }}>
                SELECT A PHOTO TO SUBMIT
              </p>
              {myPosts.length === 0 ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted }}>
                  You have no photos yet. <button onClick={function() { setPage("upload") }} style={{ background: "none", border: "none", color: S.gold, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0, textDecoration: "underline" }}>Upload one</button> first.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
                  {myPosts.map(function(p) {
                    const alreadyIn = submitted.has(p.id)
                    return (
                      <div key={p.id} style={{ position: "relative", cursor: alreadyIn ? "default" : "pointer" }}
                        onClick={function() { if (!alreadyIn && !submitting) submitPhoto(p.id) }}>
                        <img src={p.image_url} alt={p.caption}
                          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "4px", border: `1px solid ${alreadyIn ? S.gold : S.border}`, opacity: alreadyIn ? 0.5 : 1, display: "block" }} />
                        {alreadyIn && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                            <span style={{ color: S.gold, fontSize: "20px" }}>✦</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries leaderboard */}
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, marginBottom: "16px" }}>
          {entries.length} {entries.length === 1 ? "ENTRY" : "ENTRIES"} — RANKED BY LIKES
        </p>
        {entriesLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
          </div>
        ) : entries.length === 0 ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: S.textMuted, textAlign: "center", padding: "40px 0" }}>
            No entries yet. Be the first to submit.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {entries.map(function(e, i) {
              const isOwn = user && e.user === user.email
              const medals = ["🥇", "🥈", "🥉"]
              return (
                <motion.div key={e.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: `1px solid ${i < 3 ? S.gold + "55" : S.border}` }}>
                  <img src={e.image_url} alt={e.caption} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: "4px", padding: "2px 8px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.gold }}>
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </div>
                  <div style={{ padding: "10px 12px", backgroundColor: S.surface }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: S.textPrimary }}>
                        @{e.user}{e.verified && <span style={{ marginLeft: "4px", color: S.gold }}>✦</span>}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: S.red }}>♥ {e.likes}</span>
                    </div>
                    {submitted.has(e.id) && user && (
                      <button onClick={function() { withdrawPhoto(e.id) }}
                        style={{ marginTop: "6px", background: "none", border: `1px solid ${S.red}44`, borderRadius: "3px", padding: "3px 8px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.red, letterSpacing: "0.1em" }}>
                        WITHDRAW
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
