import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

export default function SaveModal({ post, user, onClose }) {
  const [collections, setCollections] = useState([])
  const [savedIds, setSavedIds] = useState(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    async function load() {
      const { data: cols } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (cols) setCollections(cols)

      // Check which collections already have this photo
      const { data: existing } = await supabase
        .from("collection_photos")
        .select("collection_id")
        .eq("photo_id", post.id)

      if (existing) setSavedIds(new Set(existing.map(e => e.collection_id)))
      setLoading(false)
    }
    load()
  }, [post.id, user.id])

  async function toggle(col) {
    if (savedIds.has(col.id)) {
      await supabase.from("collection_photos")
        .delete().eq("collection_id", col.id).eq("photo_id", post.id)
      setSavedIds(prev => { const s = new Set(prev); s.delete(col.id); return s })
    } else {
      await supabase.from("collection_photos")
        .insert({ collection_id: col.id, photo_id: post.id })
      setSavedIds(prev => new Set([...prev, col.id]))
    }
  }

  async function createAndSave() {
    if (!newName.trim()) return
    const { data } = await supabase.from("collections")
      .insert({ user_id: user.id, name: newName.trim() }).select().single()
    if (data) {
      await supabase.from("collection_photos").insert({ collection_id: data.id, photo_id: post.id })
      setCollections([data, ...collections])
      setSavedIds(prev => new Set([...prev, data.id]))
      setNewName("")
      setCreating(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.88)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <motion.div onClick={function(e) { e.stopPropagation() }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{ backgroundColor: S.surface, borderTop: `1px solid ${S.border}`, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "480px", padding: "0 0 32px" }}>

        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: S.border }} />
        </div>

        <div style={{ padding: "4px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${S.border}` }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.18em", color: S.gold, marginBottom: "2px" }}>SAVE TO</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted }}>"{post.caption || "untitled"}"</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: S.textMuted }}>CLOSE</button>
        </div>

        <div style={{ padding: "16px 20px", maxHeight: "60vh", overflowY: "auto" }}>
          {/* New collection */}
          {creating ? (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input autoFocus value={newName} onChange={function(e) { setNewName(e.target.value) }}
                onKeyDown={function(e) { if (e.key === "Enter") createAndSave(); if (e.key === "Escape") setCreating(false) }}
                placeholder="Collection name…"
                style={{ flex: 1, padding: "8px 12px", backgroundColor: S.bg, border: `1px solid ${S.gold}`, borderRadius: "3px", color: S.textPrimary, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none" }} />
              <button onClick={createAndSave} style={{ padding: "8px 14px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "10px", cursor: "pointer" }}>CREATE</button>
              <button onClick={function() { setCreating(false) }} style={{ padding: "8px 12px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "10px", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <button onClick={function() { setCreating(true) }}
              style={{ width: "100%", padding: "10px", border: `1px dashed ${S.gold}44`, borderRadius: "6px", background: "none", color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", cursor: "pointer", marginBottom: "12px" }}>
              + NEW COLLECTION
            </button>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
            </div>
          ) : collections.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.textMuted, textAlign: "center", padding: "12px 0" }}>No collections yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {collections.map(function(col) {
                const saved = savedIds.has(col.id)
                return (
                  <button key={col.id} onClick={function() { toggle(col) }}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", backgroundColor: saved ? `${S.gold}12` : S.bg, border: `1px solid ${saved ? S.gold + "55" : S.border}`, borderRadius: "6px", cursor: "pointer", transition: "all 0.15s", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: "16px" }}>{saved ? "🔖" : "📁"}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: saved ? S.gold : S.textPrimary, flex: 1 }}>{col.name}</span>
                    {saved && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: S.gold }}>SAVED</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
