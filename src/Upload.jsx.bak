import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"

async function generateTags(caption, category) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY
  if (!apiKey) return []

  const prompt = `You are an expert photography tagger for a cinematic photography platform called "The Fellowship" (Lord of the Rings themed).

Given the following photo details:
Caption: "${caption}"
Category: "${category}"

Generate exactly 5 short, relevant photography tags. Tags should relate to the subject, mood, technique, or visual style. Keep each tag 1-2 words, lowercase, no # symbol.

Respond ONLY with a JSON array of 5 strings. Example: ["golden hour", "portrait", "bokeh", "moody", "film noir"]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        }),
      }
    )
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
    const data = await response.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
    const clean = raw.replace(/```json|```/g, "").trim()
    const tags = JSON.parse(clean)
    if (Array.isArray(tags)) return tags.slice(0, 5).map(function(t) { return String(t).toLowerCase().trim() })
    return []
  } catch (err) {
    console.error("Auto-tagging failed:", err)
    return []
  }
}

async function detectGear(caption, category) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY
  if (!apiKey) return null

  const prompt = `You are an expert photography gear analyst for a cinematic platform called "The Fellowship".

Given this photo:
Caption: "${caption}"
Category: "${category}"

Guess the most likely camera gear used. Be specific but reasonable.

Respond ONLY with a JSON object with exactly these keys:
{"body": "camera body name", "lens": "lens focal length and aperture", "settings": "likely ISO, shutter speed, aperture"}

Example: {"body": "Sony A7III", "lens": "85mm f/1.8", "settings": "ISO 400, 1/500s, f/2.0"}
No explanation, no markdown, just the JSON object.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 120 },
        }),
      }
    )
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
    const data = await response.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
    const clean = raw.replace(/```json|```/g, "").trim()
    const gear = JSON.parse(clean)
    if (gear.body && gear.lens && gear.settings) return gear
    return null
  } catch (err) {
    console.error("Gear detection failed:", err)
    return null
  }
}

const CATEGORIES = [
  "Landscape", "Portrait", "Street", "Wildlife", "Architecture",
  "Astrophotography", "Macro", "Travel", "Abstract", "Documentary",
]

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
}

function TagChip({ tag, index }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "3px 10px", borderRadius: "2px",
        border: `1px solid ${S.gold}44`, backgroundColor: `${S.gold}12`,
        color: S.gold, fontFamily: "'DM Mono', monospace",
        fontSize: "11px", letterSpacing: "0.04em", whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.5 }}>#</span>{tag}
    </motion.span>
  )
}

function Spinner({ color }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      style={{
        width: "12px", height: "12px", borderRadius: "50%",
        border: `2px solid ${color}44`, borderTop: `2px solid ${color}`,
        display: "inline-block",
      }}
    />
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{
        fontFamily: "'DM Mono', monospace", fontSize: "10px",
        letterSpacing: "0.15em", textTransform: "uppercase",
        color: S.gold, opacity: 0.8,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle() {
  return {
    width: "100%", boxSizing: "border-box", padding: "12px 14px",
    backgroundColor: S.surface, border: `1px solid ${S.border}`,
    borderRadius: "3px", color: S.textPrimary,
    fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
    outline: "none", lineHeight: "1.5",
  }
}

export default function Upload({ setPage, user }) {
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [category, setCategory] = useState("")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [tags, setTags] = useState([])
  const [taggingState, setTaggingState] = useState("idle")
  const [gear, setGear] = useState(null)
  const [gearState, setGearState] = useState("idle")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(selected) {
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onloadend = function() { setPreview(reader.result) }
    reader.readAsDataURL(selected)
    setTags([])
    setTaggingState("idle")
    setGear(null)
    setGearState("idle")
  }

  function handleFileInput(e) { handleFile(e.target.files[0]) }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith("image/")) handleFile(dropped)
  }

  async function triggerAutoTag(cap, cat) {
    const c = cap ?? caption
    const k = cat ?? category
    if (!c.trim() || !k) return
    setTaggingState("generating")
    setTags([])
    const generated = await generateTags(c.trim(), k)
    if (generated.length > 0) { setTags(generated); setTaggingState("done") }
    else setTaggingState("error")
  }

  async function triggerGearDetection(cap, cat) {
    const c = cap ?? caption
    const k = cat ?? category
    if (!c.trim() || !k) return
    setGearState("generating")
    setGear(null)
    const detected = await detectGear(c.trim(), k)
    if (detected) { setGear(detected); setGearState("done") }
    else setGearState("error")
  }

  function handleCaptionBlur() {
    if (caption.trim() && category) {
      triggerAutoTag(caption, category)
      triggerGearDetection(caption, category)
    }
  }

  function handleCategoryChange(e) {
    const val = e.target.value
    setCategory(val)
    if (caption.trim() && val) {
      triggerAutoTag(caption, val)
      triggerGearDetection(caption, val)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file || !title || !category) {
      setError("A title, category, and image are required for the archives.")
      return
    }
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split(".").pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: storageErr } = await supabase.storage.from("photos").upload(path, file, { upsert: false })
      if (storageErr) throw storageErr

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
      const imageUrl = urlData?.publicUrl
      if (!imageUrl) throw new Error("Could not retrieve image URL.")

      let finalTags = tags
      if (finalTags.length === 0 && caption.trim() && category) {
        setTaggingState("generating")
        finalTags = await generateTags(caption.trim(), category)
        setTags(finalTags)
        setTaggingState(finalTags.length > 0 ? "done" : "error")
      }

      let finalGear = gear
      if (!finalGear && caption.trim() && category) {
        setGearState("generating")
        finalGear = await detectGear(caption.trim(), category)
        setGear(finalGear)
        setGearState(finalGear ? "done" : "error")
      }

      const { error: insertErr } = await supabase.from("photos").insert({
        user_id: user.id,
        caption: caption.trim(),
        category,
        image_url: imageUrl,
        tags: finalTags,
        gear: finalGear,
      })
      if (insertErr) throw insertErr

      setPage("home")
    } catch (err) {
      console.error(err)
      setError(err.message ?? "Something went wrong in the darkness.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: S.bg,
      padding: "60px 24px 80px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>

      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "48px" }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.2em", color: S.gold, opacity: 0.7, textTransform: "uppercase", marginBottom: "10px" }}>
          Add to the Archives
        </p>
        <h1 style={{ fontFamily: "'RingBearer', serif", fontSize: "clamp(22px, 4vw, 36px)", color: S.textPrimary, fontWeight: "normal", margin: 0, letterSpacing: "0.04em" }}>
          Preserve a Memory
        </h1>
        <div style={{ width: "48px", height: "1px", backgroundColor: S.gold, opacity: 0.4, margin: "16px auto 0" }} />
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "28px" }}
      >

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={function(e) { e.preventDefault(); setDragOver(true) }}
          onDragLeave={function() { setDragOver(false) }}
          style={{
            position: "relative",
            border: `1px dashed ${dragOver ? S.gold : S.border}`,
            borderRadius: "4px",
            backgroundColor: dragOver ? `${S.gold}08` : S.surface,
            overflow: "hidden", transition: "border-color 0.2s, background-color 0.2s",
            cursor: "pointer", minHeight: preview ? "auto" : "220px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <input type="file" accept="image/*" onChange={handleFileInput}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }} />
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.3, color: S.textPrimary }}>✦</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: S.textMuted, margin: "0 0 6px" }}>Drop your image here</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: S.textMuted, opacity: 0.6, margin: 0, textTransform: "uppercase" }}>or click to browse</p>
            </div>
          )}
        </div>

        <Field label="Title">
          <input type="text" value={title} onChange={function(e) { setTitle(e.target.value) }}
            placeholder="Name this memory…" required style={inputStyle()} />
        </Field>

        <Field label="Category">
          <select value={category} onChange={handleCategoryChange} required
            style={{
              ...inputStyle(), appearance: "none", cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "36px",
            }}>
            <option value="" disabled>Choose a realm…</option>
            {CATEGORIES.map(function(cat) { return <option key={cat} value={cat}>{cat}</option> })}
          </select>
        </Field>

        <Field label="Caption">
          <textarea value={caption} onChange={function(e) { setCaption(e.target.value) }}
            onBlur={handleCaptionBlur}
            placeholder="Describe the scene — AI will divine your tags and gear…"
            rows={4} style={{ ...inputStyle(), resize: "vertical", minHeight: "100px", lineHeight: "1.6" }} />
        </Field>

        {/* Auto-tag section */}
        <AnimatePresence>
          {(taggingState !== "idle" || tags.length > 0) && (
            <motion.div key="tag-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
              <div style={{ border: `1px solid ${S.border}`, borderRadius: "4px", backgroundColor: S.surface, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tags.length > 0 ? "12px" : "0" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.gold, textTransform: "uppercase", opacity: 0.8 }}>AI Tags</span>
                  {taggingState === "generating" && <Spinner color={S.blue} />}
                  {taggingState === "done" && <span style={{ color: S.gold, fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>✦ Tags bound</span>}
                  {taggingState === "error" && <span style={{ color: S.red, fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>✕ Failed</span>}
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {tags.map(function(tag, i) { return <TagChip key={tag} tag={tag} index={i} /> })}
                  </div>
                )}
                {taggingState === "done" && (
                  <button type="button" onClick={function() { triggerAutoTag(caption, category) }}
                    style={{ marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: S.textMuted, textTransform: "uppercase", padding: "4px 0", opacity: 0.7 }}>
                    ↺ Regenerate
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gear detection section */}
        <AnimatePresence>
          {(gearState !== "idle" || gear) && (
            <motion.div key="gear-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
              <div style={{ border: `1px solid ${S.blue}33`, borderRadius: "4px", backgroundColor: S.surface, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: gear ? "12px" : "0" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.blue, textTransform: "uppercase", opacity: 0.8 }}>⚙ Gear Detected</span>
                  {gearState === "generating" && <Spinner color={S.blue} />}
                  {gearState === "done" && <span style={{ color: S.blue, fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>✦ Identified</span>}
                  {gearState === "error" && <span style={{ color: S.red, fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>✕ Failed</span>}
                </div>
                {gear && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { label: "BODY", value: gear.body },
                      { label: "LENS", value: gear.lens },
                      { label: "SETTINGS", value: gear.settings },
                    ].map(function(row) {
                      return (
                        <div key={row.label} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: S.blue, opacity: 0.7, minWidth: "56px" }}>{row.label}</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: S.textPrimary, opacity: 0.85 }}>{row.value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: S.red, margin: 0, padding: "12px 16px", border: `1px solid ${S.red}44`, borderRadius: "4px", backgroundColor: `${S.red}0a` }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button type="submit" disabled={uploading || !file}
          whileHover={!uploading && file ? { scale: 1.01 } : {}}
          whileTap={!uploading && file ? { scale: 0.99 } : {}}
          style={{
            padding: "14px 32px", border: `1px solid ${S.gold}`, borderRadius: "3px",
            backgroundColor: uploading ? `${S.gold}22` : `${S.gold}18`,
            color: uploading ? `${S.gold}88` : S.gold,
            fontFamily: "'DM Mono', monospace", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: uploading || !file ? "not-allowed" : "pointer", transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}>
          {uploading ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${S.gold}44`, borderTop: `2px solid ${S.gold}`, display: "inline-block" }} />
              Preserving…
            </>
          ) : "✦ Commit to the Archives"}
        </motion.button>

      </motion.form>
    </div>
  )
}