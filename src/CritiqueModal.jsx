import { useState } from "react"
import { motion } from "framer-motion"

const VOICES = {
  gandalf: {
    label: "GANDALF",
    system: `You are Gandalf the Grey, wise wizard and mentor, giving photography critique. 
Speak exactly as Gandalf would — wise, poetic, occasionally stern but always encouraging. 
Use LOTR language and metaphors (fellowship, shadow, light of Valinor, etc.) but make the photography feedback genuinely useful.
Respond ONLY with valid JSON, no markdown, no backticks. 
Return this exact structure:
{
  "score": <number 1-10>,
  "score_explanation": "<one sentence on why this score>",
  "composition": "<2-3 sentences on composition as Gandalf>",
  "lighting": "<2-3 sentences on lighting as Gandalf>",
  "mood": "<2-3 sentences on mood/emotion as Gandalf>",
  "suggestion": "<one clear improvement suggestion phrased as Gandalf advice>"
}`
  },
  professional: {
    label: "PROFESSIONAL",
    system: `You are a senior photography editor at a prestigious magazine giving constructive critique.
Be precise, technical, and encouraging. Use proper photography terminology.
Respond ONLY with valid JSON, no markdown, no backticks.
Return this exact structure:
{
  "score": <number 1-10>,
  "score_explanation": "<one sentence on why this score>",
  "composition": "<2-3 sentences on composition>",
  "lighting": "<2-3 sentences on lighting>",
  "mood": "<2-3 sentences on mood/emotion>",
  "suggestion": "<one clear, actionable improvement suggestion>"
}`
  }
}

export default function CritiqueModal({ post, onClose }) {

  const [voice, setVoice] = useState("gandalf")
  const [critique, setCritique] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function toBase64(url) {
    var response = await fetch(url)
    var blob = await response.blob()
    return new Promise(function(resolve, reject) {
      var reader = new FileReader()
      reader.onloadend = function() { resolve(reader.result) }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function fetchCritique() {
    setLoading(true)
    setError(null)
    setCritique(null)

    try {
      var imageBase64 = await toBase64(post.image_url)
      var base64Data = imageBase64.split(",")[1]
      var mimeType = "image/jpeg"

      var prompt = voice === "gandalf"
        ? `You are Gandalf the Grey critiquing a photograph. Speak in Gandalf's voice — wise, dramatic, with LOTR references. The photo caption is: "${post.caption || "untitled"}". Category: ${post.category || "general"}. Score honestly based on what you see — scores should vary widely (a poor photo might get 3-5, an average one 6-7, an excellent one 8-10). Respond ONLY with valid JSON, no markdown, no backticks: {"score": <integer 1-10>, "score_explanation": "...", "composition": "...", "lighting": "...", "mood": "...", "suggestion": "..."}`
        : `You are a professional photography editor. The photo caption is: "${post.caption || "untitled"}". Category: ${post.category || "general"}. Score honestly based on what you see — scores should vary widely (a poor photo might get 3-5, an average one 6-7, an excellent one 8-10). Respond ONLY with valid JSON, no markdown, no backticks: {"score": <integer 1-10>, "score_explanation": "...", "composition": "...", "lighting": "...", "mood": "...", "suggestion": "..."}`

      var response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }]
          })
        }
      )

      var data = await response.json()
      console.log("GEMINI RESPONSE:", JSON.stringify(data))
      var text = data.candidates[0].content.parts[0].text
      var clean = text.replace(/```json|```/g, "").trim()
      var result = JSON.parse(clean)
      setCritique(result)

    } catch(err) {
      console.log("GEMINI ERROR:", err)
      console.log("MESSAGE:", err.message)
      setError("The palantír is clouded. Try again.")
    }

    setLoading(false)
  }

  function handleVoiceSwitch(newVoice) {
    setVoice(newVoice)
    setCritique(null)
    setError(null)
  }

  const scoreColor = critique
    ? critique.score >= 8 ? "#c9a84c"
    : critique.score >= 5 ? "#4c7ea8"
    : "#c44d2e"
    : "#c9a84c"

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)",
      zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "20px", overflowY: "auto"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: "#141210", border: "1px solid #2a2520",
          borderRadius: "8px", width: "100%", maxWidth: "560px",
          marginTop: "20px", marginBottom: "20px"
        }}
      >

        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #2a2520",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c" }}>
            AI CRITIQUE
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e" }}>
            CLOSE
          </button>
        </div>

        <div style={{ padding: "20px" }}>

          {/* Photo preview */}
          <img
            src={post.image_url}
            alt={post.caption}
            style={{ width: "100%", borderRadius: "4px", marginBottom: "16px", maxHeight: "240px", objectFit: "cover", border: "1px solid #2a2520" }}
          />

          {/* Caption + category */}
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>
            {post.category}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", marginBottom: "20px" }}>
            {post.caption}
          </p>

          {/* Voice toggle */}
          <div style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid #2a2520" }}>
            {Object.keys(VOICES).map(function(v) {
              return (
                <button key={v} onClick={function() { handleVoiceSwitch(v) }} style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px",
                  color: voice === v ? "#c9a84c" : "#7a6f5e",
                  padding: "0 0 14px 0",
                  borderBottom: "2px solid " + (voice === v ? "#c9a84c" : "transparent"),
                  transition: "all 0.2s"
                }}>
                  {VOICES[v].label}
                </button>
              )
            })}
          </div>

          {/* Get Critique button */}
          {!critique && !loading && (
            <button
              onClick={fetchCritique}
              style={{
                width: "100%", background: "#c9a84c", border: "none", borderRadius: "4px",
                cursor: "pointer", padding: "12px", fontFamily: "'DM Mono', monospace",
                fontSize: "11px", letterSpacing: "3px", color: "#0a0908",
                fontWeight: "bold", transition: "all 0.2s"
              }}
            >
              {voice === "gandalf" ? "SEEK GANDALF'S WISDOM" : "GET PROFESSIONAL CRITIQUE"}
            </button>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#f0ebe0", marginBottom: "12px" }}>
                {voice === "gandalf" ? "Gandalf is studying your work..." : "Analysing your photograph..."}
              </p>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                {[0, 1, 2].map(function(i) {
                  return (
                    <div key={i} style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      backgroundColor: "#c9a84c", opacity: 0.4,
                      animation: "pulse 1.4s ease-in-out " + (i * 0.2) + "s infinite"
                    }} />
                  )
                })}
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#c44d2e", padding: "10px", background: "rgba(196,77,46,0.1)", borderRadius: "4px", border: "1px solid rgba(196,77,46,0.2)", marginBottom: "12px" }}>
                {error}
              </p>
              <button onClick={fetchCritique} style={{ width: "100%", background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", padding: "10px", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e" }}>
                TRY AGAIN
              </button>
            </div>
          )}

          {/* Critique result */}
          {critique && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              {/* Score */}
              <div style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "16px", backgroundColor: "#0a0908", borderRadius: "6px",
                border: "1px solid " + scoreColor, marginBottom: "20px"
              }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontFamily: "'RingBearer', serif", fontSize: "36px", color: scoreColor, lineHeight: 1 }}>
                    {critique.score}
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#7a6f5e" }}>
                    / 10
                  </p>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontStyle: "italic", color: "#f0ebe0", lineHeight: 1.5 }}>
                  {critique.score_explanation}
                </p>
              </div>

              {/* Sections */}
              {[
                { key: "composition", label: "COMPOSITION" },
                { key: "lighting", label: "LIGHTING" },
                { key: "mood", label: "MOOD" },
                { key: "suggestion", label: "SUGGESTION" }
              ].map(function(section) {
                return (
                  <div key={section.key} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #2a2520" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "8px" }}>
                      {section.label}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", lineHeight: "1.7" }}>
                      {critique[section.key]}
                    </p>
                  </div>
                )
              })}

              {/* Refresh button */}
              <button
                onClick={fetchCritique}
                style={{
                  width: "100%", background: "none", border: "1px solid #2a2520",
                  borderRadius: "4px", cursor: "pointer", padding: "10px",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px",
                  letterSpacing: "2px", color: "#7a6f5e", marginTop: "4px"
                }}
              >
                REFRESH CRITIQUE
              </button>

            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  )
}