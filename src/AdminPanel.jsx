import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

const ADMIN_USERNAME = "s1r1usk"

export default function AdminPanel({ user, setPage }) {
  const [tab, setTab] = useState("challenges")
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // New challenge form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [days, setDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(function() {
    async function check() {
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single()
      setProfile(data)
      if (data?.username !== ADMIN_USERNAME) { setLoading(false); return }
      loadAll()
    }
    check()
  }, [user.id])

  async function loadAll() {
    const [u, c, p] = await Promise.all([
      supabase.from("profiles").select("id, username, verified").order("username"),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("photos").select("id, caption, image_url, user_id, profiles!photos_user_id_fkey(username)").order("id", { ascending: false }).limit(30),
    ])
    if (u.data) setUsers(u.data)
    if (c.data) setChallenges(c.data)
    if (p.data) setPosts(p.data)
    setLoading(false)
  }

  async function toggleVerified(u) {
    await supabase.from("profiles").update({ verified: !u.verified }).eq("id", u.id)
    setUsers(users.map(x => x.id === u.id ? { ...x, verified: !x.verified } : x))
  }

  async function createChallenge() {
    if (!title.trim()) return
    setSaving(true)
    const { error } = await supabase.from("challenges").insert({
      title: title.trim(), description: description.trim(),
      deadline: new Date(Date.now() + days * 86400000).toISOString(),
    })
    if (!error) {
      setMsg("Challenge created!")
      setTitle(""); setDescription(""); setDays(7)
      loadAll()
    }
    setSaving(false)
    setTimeout(function() { setMsg(null) }, 3000)
  }

  async function deleteChallenge(id) {
    if (!confirm("Delete this challenge?")) return
    await supabase.from("challenges").delete().eq("id", id)
    setChallenges(challenges.filter(c => c.id !== id))
  }

  async function deletePost(id) {
    if (!confirm("Delete this post?")) return
    await supabase.from("photos").delete().eq("id", id)
    setPosts(posts.filter(p => p.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
    </div>
  )

  if (profile?.username !== ADMIN_USERNAME) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <p style={{ fontFamily: "'RingBearer', serif", fontSize: "24px", color: S.red }}>You shall not pass.</p>
      <button onClick={function() { setPage("home") }} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: "4px", padding: "10px 24px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: S.textMuted }}>GO BACK</button>
    </div>
  )

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "10px 14px", backgroundColor: S.bg, border: `1px solid ${S.border}`, borderRadius: "3px", color: S.textPrimary, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none" }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <button onClick={function() { setPage("home") }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: "0 0 24px", display: "block" }}>
          ← HOME
        </button>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.red, marginBottom: "6px" }}>RESTRICTED</p>
          <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "32px", color: S.textPrimary, fontWeight: "normal", margin: 0 }}>Admin Panel</h1>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "32px", borderBottom: `1px solid ${S.border}` }}>
          {[["challenges", "Challenges"], ["users", "Users"], ["posts", "Posts"]].map(function([key, label]) {
            return (
              <button key={key} onClick={function() { setTab(key) }} style={{
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: `2px solid ${tab === key ? S.gold : "transparent"}`,
                cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px",
                letterSpacing: "0.1em", color: tab === key ? S.gold : S.textMuted,
                transition: "all 0.2s", marginBottom: "-1px",
              }}>{label.toUpperCase()}</button>
            )
          })}
        </div>

        {/* Challenges tab */}
        {tab === "challenges" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Create form */}
            <div style={{ padding: "20px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.gold, marginBottom: "16px" }}>NEW CHALLENGE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input value={title} onChange={function(e) { setTitle(e.target.value) }} placeholder="Title…" style={inputStyle} />
                <textarea value={description} onChange={function(e) { setDescription(e.target.value) }} placeholder="Description…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted }}>DURATION</label>
                  <select value={days} onChange={function(e) { setDays(Number(e.target.value)) }} style={{ ...inputStyle, width: "auto" }}>
                    {[3, 5, 7, 10, 14].map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                {msg && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#4caf7d", margin: 0 }}>{msg}</p>}
                <button onClick={createChallenge} disabled={saving || !title.trim()} style={{ padding: "10px 24px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer", alignSelf: "flex-start" }}>
                  {saving ? "CREATING…" : "✦ CREATE CHALLENGE"}
                </button>
              </div>
            </div>

            {/* Existing challenges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {challenges.map(function(c) {
                const active = new Date(c.deadline) > new Date()
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px" }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: S.textPrimary, margin: "0 0 2px" }}>{c.title}</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: active ? S.gold : S.textMuted, margin: 0 }}>{active ? "● ACTIVE" : "○ ENDED"} · {new Date(c.deadline).toLocaleDateString()}</p>
                    </div>
                    <button onClick={function() { deleteChallenge(c.id) }} style={{ background: "none", border: `1px solid ${S.red}44`, borderRadius: "3px", padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.red, letterSpacing: "0.1em" }}>DELETE</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {users.map(function(u) {
              return (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: S.textPrimary, margin: 0 }}>@{u.username}</p>
                    {u.verified && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: S.gold, color: S.bg, fontSize: "8px", fontWeight: "bold" }}>✦</span>}
                  </div>
                  <button onClick={function() { toggleVerified(u) }}
                    style={{ padding: "4px 12px", border: `1px solid ${u.verified ? S.red + "44" : S.gold + "44"}`, borderRadius: "3px", background: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: u.verified ? S.red : S.gold, letterSpacing: "0.1em" }}>
                    {u.verified ? "UNVERIFY" : "VERIFY"}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Posts tab */}
        {tab === "posts" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            {posts.map(function(p) {
              return (
                <div key={p.id} style={{ position: "relative", borderRadius: "4px", overflow: "hidden", border: `1px solid ${S.border}` }}>
                  <img src={p.image_url} alt={p.caption} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "6px 8px", backgroundColor: S.surface }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.gold, margin: "0 0 2px" }}>@{p.profiles?.username}</p>
                    {p.caption && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: S.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption}</p>}
                  </div>
                  <button onClick={function() { deletePost(p.id) }}
                    style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(196,77,46,0.85)", border: "none", borderRadius: "3px", padding: "3px 7px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#fff", letterSpacing: "0.05em" }}>
                    DELETE
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
