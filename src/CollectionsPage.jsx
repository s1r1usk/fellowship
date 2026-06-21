import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

export default function CollectionsPage({ user, setPage }) {
  const [collections, setCollections] = useState([])
  const [selected, setSelected] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(function() { loadCollections() }, [])

  async function loadCollections() {
    setLoading(true)
    const { data } = await supabase
      .from("collections")
      .select("*, collection_photos(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setCollections(data)
    setLoading(false)
  }

  async function loadCollection(col) {
    setSelected(col)
    const { data } = await supabase
      .from("collection_photos")
      .select("*, photos(id, image_url, caption, profiles!photos_user_id_fkey(username))")
      .eq("collection_id", col.id)
      .order("added_at", { ascending: false })
    if (data) setPhotos(data.filter(d => d.photos).map(d => ({
      id: d.id,
      photo_id: d.photo_id,
      image_url: d.photos.image_url,
      caption: d.photos.caption,
      username: d.photos.profiles?.username || "unknown",
    })))
  }

  async function createCollection() {
    if (!newName.trim()) return
    const { data } = await supabase.from("collections").insert({
      user_id: user.id, name: newName.trim()
    }).select().single()
    if (data) {
      setCollections([data, ...collections])
      setNewName("")
      setCreating(false)
    }
  }

  async function deleteCollection(id) {
    await supabase.from("collections").delete().eq("id", id)
    setCollections(collections.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function removePhoto(collectionPhotoId) {
    await supabase.from("collection_photos").delete().eq("id", collectionPhotoId)
    setPhotos(photos.filter(p => p.id !== collectionPhotoId))
  }

  if (selected) return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <button onClick={function() { setSelected(null); setPhotos([]) }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: "0 0 24px", display: "block" }}>
          ← MY COLLECTIONS
        </button>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, marginBottom: "6px" }}>COLLECTION</p>
          <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(22px, 4vw, 36px)", color: S.textPrimary, fontWeight: "normal", margin: 0 }}>{selected.name}</h1>
          <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.3, marginTop: "12px" }} />
        </motion.div>

        {photos.length === 0 ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: S.textMuted, fontSize: "16px" }}>
            No photos yet. Save photos from the feed using the bookmark icon.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
            {photos.map(function(photo) {
              return (
                <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ position: "relative", borderRadius: "4px", overflow: "hidden", border: `1px solid ${S.border}` }}>
                  <img src={photo.image_url} alt={photo.caption}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "8px 10px", backgroundColor: S.surface }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.gold, margin: "0 0 2px" }}>@{photo.username}</p>
                    {photo.caption && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "12px", color: S.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.caption}</p>}
                  </div>
                  <button onClick={function() { removePhoto(photo.id) }}
                    style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", color: S.textMuted, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "60px 24px 80px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <button onClick={function() { setPage("home") }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.textMuted, padding: "0 0 32px", display: "block" }}>
          ← HOME
        </button>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, marginBottom: "10px" }}>THE FELLOWSHIP</p>
          <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(22px, 4vw, 36px)", color: S.textPrimary, fontWeight: "normal", margin: "0 0 8px" }}>My Collections</h1>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: S.textMuted, margin: "0 0 20px" }}>Curate your own fellowship of images</p>
          <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.4, margin: "0 auto" }} />
        </motion.div>

        {/* Create new */}
        <div style={{ marginBottom: "32px" }}>
          {creating ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                autoFocus value={newName} onChange={function(e) { setNewName(e.target.value) }}
                onKeyDown={function(e) { if (e.key === "Enter") createCollection(); if (e.key === "Escape") setCreating(false) }}
                placeholder="Collection name…"
                style={{ flex: 1, padding: "10px 14px", backgroundColor: S.surface, border: `1px solid ${S.gold}`, borderRadius: "3px", color: S.textPrimary, fontFamily: "'DM Sans', sans-serif", fontSize: "14px", outline: "none" }}
              />
              <button onClick={createCollection} style={{ padding: "10px 20px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.12em", cursor: "pointer" }}>CREATE</button>
              <button onClick={function() { setCreating(false); setNewName("") }} style={{ padding: "10px 16px", border: `1px solid ${S.border}`, borderRadius: "3px", background: "none", color: S.textMuted, fontFamily: "'DM Mono', monospace", fontSize: "11px", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <button onClick={function() { setCreating(true) }}
              style={{ padding: "10px 24px", border: `1px solid ${S.gold}`, borderRadius: "3px", backgroundColor: `${S.gold}18`, color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer" }}>
              + NEW COLLECTION
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${S.gold}33`, borderTop: `2px solid ${S.gold}` }} />
          </div>
        ) : collections.length === 0 ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: S.textMuted, fontSize: "16px", textAlign: "center", padding: "40px 0" }}>
            No collections yet. Create one and start saving photos.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {collections.map(function(col, i) {
              const count = col.collection_photos?.[0]?.count || 0
              return (
                <motion.div key={col.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "6px", cursor: "pointer", transition: "border-color 0.2s" }}
                  onClick={function() { loadCollection(col) }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "4px", backgroundColor: `${S.gold}18`, border: `1px solid ${S.gold}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "16px" }}>📁</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: S.textPrimary, margin: "0 0 2px" }}>{col.name}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: S.textMuted, margin: 0 }}>{count} photo{count !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={function(e) { e.stopPropagation(); deleteCollection(col.id) }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: "14px", padding: "4px", opacity: 0.5 }}>
                    🗑
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
