import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "./supabase"
import * as exifr from "exifr"

const CATEGORIES = [
  "Landscape", "Portrait", "Street", "Wildlife", "Architecture",
  "Astrophotography", "Macro", "Travel", "Abstract", "Documentary",
]

const S = {
  bg: "#0a0908", surface: "#141210", border: "#2a2520",
  gold: "#c9a84c", blue: "#4c7ea8", red: "#c44d2e",
  textPrimary: "#e8dcc8", textMuted: "#7a6e62",
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [exifData, setExifData] = useState(null)

  const [exifData, setExifData] = useState(null)

  function handleFile(selected) {
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onloadend = function() { setPreview(reader.result) }
    reader.readAsDataURL(selected)
    // Extract EXIF
    exifr.parse(selected, {
      pick: ["Make", "Model", "LensModel", "FocalLength", "FNumber", "ExposureTime", "ISO", "DateTimeOriginal", "GPSLatitude", "GPSLongitude", "ExposureProgram", "MeteringMode", "Flash", "WhiteBalance", "ImageWidth", "ImageHeight"]
    }).then(function(exif) {
      if (exif) setExifData(exif)
    }).catch(function() { setExifData(null) })
  }

  function handleFileInput(e) { handleFile(e.target.files[0]) }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith("image/")) handleFile(dropped)
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

      const { error: insertErr } = await supabase.from("photos").insert({
        user_id: user.id,
        caption: caption.trim(),
        category,
        image_url: imageUrl,
        tags: [],
        gear: null,
        exif: exifData || null,
        exif: exifData || null,
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

        {exifData && (
          <div style={{ padding: "14px 16px", backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: "4px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: S.blue, marginBottom: "10px" }}>⬡ EXIF DETECTED</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
              {[
                exifData.Make && exifData.Model && ["Camera", `${exifData.Make} ${exifData.Model}`],
                exifData.LensModel && ["Lens", exifData.LensModel],
                exifData.FocalLength && ["Focal Length", `${exifData.FocalLength}mm`],
                exifData.FNumber && ["Aperture", `f/${exifData.FNumber}`],
                exifData.ExposureTime && ["Shutter", exifData.ExposureTime < 1 ? `1/${Math.round(1/exifData.ExposureTime)}s` : `${exifData.ExposureTime}s`],
                exifData.ISO && ["ISO", exifData.ISO],
                exifData.ImageWidth && exifData.ImageHeight && ["Resolution", `${exifData.ImageWidth} × ${exifData.ImageHeight}`],
                exifData.DateTimeOriginal && ["Date", new Date(exifData.DateTimeOriginal).toLocaleDateString()],
              ].filter(Boolean).map(function(row) {
                return (
                  <div key={row[0]}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: S.blue, opacity: 0.7 }}>{row[0].toUpperCase()}</span>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: S.textPrimary, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[1]}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Field label="Title">
          <input type="text" value={title} onChange={function(e) { setTitle(e.target.value) }}
            placeholder="Name this memory…" required style={inputStyle()} />
        </Field>

        <Field label="Category">
          <select value={category} onChange={function(e) { setCategory(e.target.value) }} required
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
            placeholder="Describe the scene…"
            rows={4} style={{ ...inputStyle(), resize: "vertical", minHeight: "100px", lineHeight: "1.6" }} />
        </Field>

        {exifData && (
          <div style={{ padding: "14px 16px", backgroundColor: "#0d0c0b", border: "1px solid #2a2520", borderRadius: "4px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#4c7ea8", marginBottom: "10px" }}>
              ⚡ EXIF DETECTED
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
              {[
                ["Camera", exifData.Make && exifData.Model ? `${exifData.Make} ${exifData.Model}` : null],
                ["Lens", exifData.LensModel || null],
                ["Focal Length", exifData.FocalLength ? `${exifData.FocalLength}mm` : null],
                ["Aperture", exifData.FNumber ? `f/${exifData.FNumber}` : null],
                ["Shutter", exifData.ExposureTime ? (exifData.ExposureTime < 1 ? `1/${Math.round(1/exifData.ExposureTime)}s` : `${exifData.ExposureTime}s`) : null],
                ["ISO", exifData.ISO ? `ISO ${exifData.ISO}` : null],
                ["Resolution", exifData.ImageWidth && exifData.ImageHeight ? `${exifData.ImageWidth} × ${exifData.ImageHeight}` : null],
                ["Date", exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toLocaleDateString() : null],
              ].filter(function(row) { return row[1] }).map(function(row) {
                return (
                  <div key={row[0]}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#4c7ea8", opacity: 0.7, letterSpacing: "0.1em", display: "block" }}>{row[0].toUpperCase()}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#e8dcc8" }}>{row[1]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
