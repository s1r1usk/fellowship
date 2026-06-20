import { useState } from "react"
import { supabase } from "./supabase"
import { motion } from "framer-motion"

export default function Auth({ onAuth }) {

  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true)
    setError(null)
    if (!username.trim()) { setError("Username is required"); setLoading(false); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return }

    // Check username availability first
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle()

    if (existing) { setError("Username already taken — choose another"); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim().toLowerCase() }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }

    // If email confirmation is disabled (auto-confirmed), create profile immediately
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: username.trim().toLowerCase(),
      })
      if (profileError && profileError.code !== "23505") {
        setError(profileError.message)
      }
      // onAuth will be called by the auth state change listener in App.jsx
    } else {
      // Email confirmation required — profile will be created on first confirmed login
      setMessage("Check your email to confirm your account, then sign in!")
    }
    setLoading(false)
  }

  return (
    <div style={{
      backgroundColor: "#0a0908",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          maxWidth: "400px"
        }}
      >

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontFamily: "'RingBearer', serif",
            fontSize: "32px",
            color: "#c9a84c",
            letterSpacing: "2px",
            marginBottom: "8px"
          }}>
            The Fellowship
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "15px",
            fontStyle: "italic",
            color: "#7a6f5e"
          }}>
            You Shall Not Crop
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "#141210",
          border: "1px solid #2a2520",
          borderRadius: "8px",
          padding: "32px"
        }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", marginBottom: "28px", borderBottom: "1px solid #2a2520" }}>
            {["login", "signup"].map(function(m) {
              return (
                <button
                  key={m}
                  onClick={function() { setMode(m); setError(null); setMessage(null) }}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "2px",
                    color: mode === m ? "#c9a84c" : "#7a6f5e",
                    padding: "0 0 16px 0",
                    borderBottom: "2px solid " + (mode === m ? "#c9a84c" : "transparent"),
                    transition: "all 0.2s"
                  }}
                >
                  {m.toUpperCase()}
                </button>
              )
            })}
          </div>

          {/* Error */}
          {error && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: "#c44d2e",
              marginBottom: "16px",
              padding: "10px",
              background: "rgba(196,77,46,0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(196,77,46,0.2)"
            }}>
              {error}
            </p>
          )}

          {/* Message */}
          {message && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: "#4caf7d",
              marginBottom: "16px",
              padding: "10px",
              background: "rgba(76,175,125,0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(76,175,125,0.2)"
            }}>
              {message}
            </p>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {mode === "signup" && (
              <div>
                <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "8px" }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={function(e) { setUsername(e.target.value) }}
                  style={{ width: "100%", background: "#0a0908", border: "1px solid #2a2520", borderRadius: "4px", padding: "10px 14px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "8px" }}>
                EMAIL
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={function(e) { setEmail(e.target.value) }}
                style={{ width: "100%", background: "#0a0908", border: "1px solid #2a2520", borderRadius: "4px", padding: "10px 14px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "8px" }}>
                PASSWORD
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={function(e) { setPassword(e.target.value) }}
                onKeyDown={function(e) { if (e.key === "Enter") mode === "login" ? handleLogin() : handleSignup() }}
                style={{ width: "100%", background: "#0a0908", border: "1px solid #2a2520", borderRadius: "4px", padding: "10px 14px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              style={{
                background: loading ? "#2a2520" : "#c9a84c",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                padding: "12px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                letterSpacing: "3px",
                color: loading ? "#4a4035" : "#0a0908",
                fontWeight: "bold",
                transition: "all 0.2s",
                marginTop: "8px"
              }}
            >
              {loading ? "PLEASE WAIT..." : mode === "login" ? "ENTER THE FELLOWSHIP" : "JOIN THE FELLOWSHIP"}
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  )
}