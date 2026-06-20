import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

const MEDALS = ["🥇", "🥈", "🥉"]

const RANK_TITLES = [
  "Ringbearer", "Evenstar", "Wizard of the Order", "Knight of Gondor",
  "Rider of Rohan", "Ranger of the North", "Hobbit of the Shire",
  "Dwarf of Erebor", "Elf of Rivendell", "Wanderer",
]

export default function LeaderboardPage({ setPage, setViewingUser }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("likes")

  useEffect(function() {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order(tab === "likes" ? "total_likes" : "total_posts", { ascending: false })
        .limit(50)
      if (!error && data) setLeaders(data)
      setLoading(false)
    }
    load()
  }, [tab])

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "40px" }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, textTransform: "uppercase", marginBottom: "10px" }}>
          The Fellowship
        </p>
        <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(24px, 5vw, 42px)", color: S.textPrimary, fontWeight: "normal", margin: "0 0 8px", letterSpacing: "0.04em" }}>
          Hall of Renown
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textMuted, margin: "0 0 24px" }}>
          "Even the smallest person can change the course of the future."
        </p>
        <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.4, margin: "0 auto" }} />
      </motion.div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
        <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", border: `1px solid ${S.border}` }}>
          {[["likes", "♥ BY LIKES"], ["posts", "✦ BY POSTS"]].map(function([key, label]) {
            return (
              <button key={key} onClick={function() { setTab(key) }} style={{
                padding: "10px 20px", background: tab === key ? `${S.gold}18` : "none",
                borderLeft: key === "posts" ? `1px solid ${S.border}` : "none",
                border: "none", cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontSize: "10px",
                letterSpacing: "0.12em", color: tab === key ? S.gold : S.textMuted,
                transition: "all 0.2s",
              }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
          </div>
        ) : leaders.length === 0 ? (
          <p style={{ textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: S.textMuted, padding: "60px 0" }}>
            No fellowship members found.
          </p>
        ) : leaders.map(function(leader, i) {
          const isTop3 = i < 3
          const rankTitle = RANK_TITLES[Math.min(i, RANK_TITLES.length - 1)]
          return (
            <motion.div
              key={leader.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={function() { setViewingUser(leader.username); setPage("home") }}
              style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "14px 18px",
                backgroundColor: isTop3 ? `${S.gold}08` : S.surface,
                border: `1px solid ${isTop3 ? S.gold + "33" : S.border}`,
                borderRadius: "6px", cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ minWidth: "36px", textAlign: "center" }}>
                {isTop3 ? (
                  <span style={{ fontSize: "22px" }}>{MEDALS[i]}</span>
                ) : (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: S.textMuted }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: isTop3 ? S.gold : S.textPrimary, margin: "0 0 2px", letterSpacing: "0.05em" }}>
                  @{leader.username}
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "11px", color: S.textMuted, margin: 0 }}>
                  {rankTitle}
                </p>
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", color: tab === "likes" ? S.gold : S.textMuted, margin: 0 }}>
                    {leader.total_likes}
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: S.textMuted, letterSpacing: "0.1em", margin: 0 }}>LIKES</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", color: tab === "posts" ? S.gold : S.textMuted, margin: 0 }}>
                    {leader.total_posts}
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: S.textMuted, letterSpacing: "0.1em", margin: 0 }}>POSTS</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
