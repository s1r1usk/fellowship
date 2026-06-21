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
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h left`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m left`
}

export default function ChallengesPage({ user, setViewingUser, setPage }) {
  const [challenges, setChallenges] = useState([])
  const [selected, setSelected] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [entries, setEntries] = useState([])
  const [userPosts, setUserPosts] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittedIds, setSubmittedIds] = useState(new Set())

  useEffect(function() {
    async function load() {
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) setChallenges(data)
      setLoading(false)
    }
    load()
  }, [])

  async function loadChallenge(challenge) {
    setSelected(challenge)
    setEntries([])
    setSubmittedIds(new Set())

    const { data: entryData } = await supabase
      .from("challenge_photos")
      .select("*, photos(id, image_url, caption, user_id, profiles!photos_user_id_fkey(username, verified)), likes(count)")
      .eq("challenge_id", challenge.id)
      .order("submitted_at", { ascending: false })

    if (entryData) {
      // Get like counts per photo
      const photoIds = entryData.map(e => e.photo_id)
      const { data: likeCounts } = await supabase
        .from("likes")
        .select("photo_id")
        .in("photo_id", photoIds)

      const countMap = {}
      ;(likeCounts || []).forEach(function(l) {
        countMap[l.photo_id] = (countMap[l.photo_id] || 0) + 1
      })

      const formatted = entryData
        .filter(e => e.photos)
        .map(function(e) {
          return {
            id: e.id,
            photo_id: e.photo_id,
            image_url: e.photos.image_url,
            caption: e.photos.caption,
            username: e.photos.profiles?.username || "unknown",
            verified: e.photos.profiles?.verified || false,
            likes: countMap[e.photo_id] || 0,
            user_id: e.user_id,
          }
        })
        .sort(function(a, b) { return b.likes - a.likes })

      setEntries(formatted)

      if (user) {
        const myIds = new Set(entryData.filter(e => e.user_id === user.id).map(e => e.photo_id))
        setSubmittedIds(myIds)
      }
    }

    // Load user's own posts for submission
    if (user) {
      const { data: myPosts } = await supabase
        .from("photos")
        .select("id, image_url, caption")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
      if (myPosts) setUserPosts(myPosts)
    }
  }

  async function submitPhoto(photoId) {
    if (!user || submittedIds.has(photoId)) return
    setSubmitting(true)
    const { error } = await supabase.from("challenge_photos").insert({
      challenge_id: selected.id,
      photo_id: photoId,
      user_id: user.id,
    })
    if (!error) {
      setSubmittedIds(new Set([...submittedIds, photoId]))
      await loadChallenge(selected)
    }
    setSubmitting(false)
    setShowSubmit(false)
  }

  async function withdrawPhoto(photoId) {
    if (!user) return
    await supabase.from("challenge_photos")
      .delete()
      .eq("challenge_id", selected.id)
      .eq("photo_id", photoId)
      .eq("user_id", user.id)
    setSubmittedIds(prev => { const s = new Set(prev); s.delete(photoId); return s })
    await loadChallenge(selected)
  }

  const isActive = selected && new Date(selected.deadline) > new Date()

  if (selected) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        {/* Back */}
        <button onClick={function() { setSelected(null) }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: "0 0 24px", display: "block" }}>
          ← ALL CHALLENGES
        </button>

        {/* Challenge header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, marginBottom: "6px" }}>
                WEEKLY CHALLENGE
              </p>
              <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(22px, 4vw, 36px)", color: S.textPrimary, fontWeight: "normal", margin: 0 }}>
                {selected.title}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.1em",
                color: isActive ? S.gold : S.red,
                border: `1px solid ${isActive ? S.gold + "44" : S.red + "44"}`,
                padding: "4px 10px", borderRadius: "3px",
              }}>
                {timeLeft(selected.deadline)}
              </span>
            </div>
          </div>
          {selected.description && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textMuted, lineHeight: 1.6 }}>
              {selected.description}
            </p>
          )}
          <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.3, marginTop: "16px" }} />
        </motion.div>

        {/* Submit button */}
        {isActive && user && (
          <div style={{ marginBottom: "32px" }}>
            <button onClick={function() { setShowSubmit(!showSubmit) }}
              style={{
                padding: "10px 24px", border: `1px solid ${S.gold}`, borderRadius: "3px",
                backgroundColor: `${S.gold}18`, color: S.gold,
                fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em",
                cursor: "pointer",
              }}>
              {showSubmit ? "✕ CANCEL" : "+ SUBMIT A PHOTO"}
            </button>

            <AnimatePresence>
              {showSubmit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginTop: "16px" }}
                >
                  {userPosts.length === 0 ? (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted }}>
                      Upload some photos first to submit them.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
                      {userPosts.map(function(post) {
                        const already = submittedIds.has(post.id)
                        return (
                          <div key={post.id} style={{ position: "relative", cursor: already ? "default" : "pointer" }}
                            onClick={function() { if (!already && !submitting) submitPhoto(post.id) }}>
                            <img src={post.image_url} alt={post.caption}
                              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "4px", border: `1px solid ${already ? S.gold : S.border}`, opacity: already ? 0.6 : 1 }} />
                            {already && (
                              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "4px" }}>
                                <span style={{ color: S.gold, fontSize: "20px" }}>✓</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Entries leaderboard */}
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.blue, marginBottom: "16px" }}>
            {entries.length} {entries.length === 1 ? "ENTRY" : "ENTRIES"}
          </p>

          {entries.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: S.textMuted, fontSize: "16px" }}>
              No entries yet. Be the first to submit.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {entries.map(function(entry, i) {
                const isOwn = user && entry.user_id === user.id
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px", backgroundColor: S.surface, border: `1px solid ${i < 3 ? S.gold + "33" : S.border}`, borderRadius: "6px" }}
                  >
                    {/* Rank */}
                    <div style={{ minWidth: "28px", textAlign: "center" }}>
                      {i < 3
                        ? <span style={{ fontSize: "18px" }}>{"🥇🥈🥉"[i * 2]}{"🥇🥈🥉"[i * 2 + 1]}</span>
                        : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: S.textMuted }}>{String(i + 1).padStart(2, "0")}</span>
                      }
                    </div>

                    {/* Image */}
                    <img src={entry.image_url} alt={entry.caption}
                      style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "4px", border: `1px solid ${S.border}`, flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <button onClick={function() { setViewingUser(entry.username); setPage("home") }}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: S.gold, letterSpacing: "0.05em", padding: 0 }}>
                          @{entry.username}
                        </button>
                        {entry.verified && (
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "13px", height: "13px", borderRadius: "50%", backgroundColor: S.gold, color: S.bg, fontSize: "7px", fontWeight: "bold" }}>✦</span>
                        )}
                      </div>
                      {entry.caption && (
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", color: S.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{entry.caption}"
                        </p>
                      )}
                    </div>

                    {/* Likes + withdraw */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: S.red }}>♥ {entry.likes}</span>
                      {isOwn && isActive && (
                        <button onClick={function() { withdrawPhoto(entry.photo_id) }}
                          style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "8px", letterSpacing: "0.1em", color: S.textMuted, padding: "2px 6px" }}>
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
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
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
          {challenges.map(function(challenge, i) {
            const active = new Date(challenge.deadline) > new Date()
            const isExpanded = expandedId === challenge.id
            return (
              <motion.div key={challenge.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  backgroundColor: S.surface,
                  border: `1px solid ${isExpanded ? S.gold + "88" : active ? S.gold + "44" : S.border}`,
                  borderRadius: "6px", overflow: "hidden", transition: "border-color 0.2s",
                }}
              >
                {/* Card header — always visible */}
                <div
                  onClick={function() { setExpandedId(isExpanded ? null : challenge.id) }}
                  style={{ padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: active ? S.gold : S.textMuted, opacity: 0.7, marginBottom: "6px" }}>
                      {active ? "● ACTIVE" : "○ ENDED"}
                    </p>
                    <h2 style={{ fontFamily: "'RingBearer', serif", fontSize: "20px", color: S.textPrimary, fontWeight: "normal", margin: 0 }}>
                      {challenge.title}
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "10px",
                      color: active ? S.gold : S.textMuted,
                      border: `1px solid ${active ? S.gold + "33" : S.border}`,
                      padding: "3px 8px", borderRadius: "3px", whiteSpace: "nowrap",
                    }}>
                      {timeLeft(challenge.deadline)}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.blue, letterSpacing: "0.08em" }}>
                      {isExpanded ? "▲ COLLAPSE" : "▼ LEARN MORE"}
                    </span>
                  </div>
                </div>

                {/* Expanded detail panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ borderTop: `1px solid ${S.border}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* What is the challenge */}
                        {challenge.description && (
                          <div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.gold, marginBottom: "8px" }}>THE CHALLENGE</p>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textPrimary, lineHeight: 1.7, margin: 0 }}>
                              {challenge.description}
                            </p>
                          </div>
                        )}

                        {/* What to do */}
                        <div>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.gold, marginBottom: "10px" }}>HOW TO PARTICIPATE</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[
                              ["01", "Upload a photo that fits the theme from the Upload page"],
                              ["02", "Return here and click \"Enter Challenge\" below"],
                              ["03", "Select your photo from your gallery to submit it"],
                              ["04", "The community votes with likes — most liked wins"],
                            ].map(function([num, text]) {
                              return (
                                <div key={num} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.gold, opacity: 0.5, flexShrink: 0, paddingTop: "2px" }}>{num}</span>
                                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted, lineHeight: 1.5 }}>{text}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Deadline */}
                        <div style={{ display: "flex", gap: "24px", padding: "12px 16px", backgroundColor: S.bg, borderRadius: "4px", border: `1px solid ${S.border}` }}>
                          <div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: S.textMuted, letterSpacing: "0.1em", marginBottom: "3px" }}>DEADLINE</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textPrimary, margin: 0 }}>
                              {new Date(challenge.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: S.textMuted, letterSpacing: "0.1em", marginBottom: "3px" }}>TIME LEFT</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: active ? S.gold : S.red, margin: 0 }}>
                              {timeLeft(challenge.deadline)}
                            </p>
                          </div>
                        </div>

                        {/* CTA buttons */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <button
                            onClick={function() { loadChallenge(challenge) }}
                            style={{
                              padding: "10px 24px", border: `1px solid ${S.gold}`, borderRadius: "3px",
                              backgroundColor: `${S.gold}18`, color: S.gold,
                              fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em",
                              cursor: "pointer",
                            }}>
                            {active ? "✦ ENTER CHALLENGE" : "VIEW ENTRIES"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
