import { useState } from "react"

export default function Navbar({ setPage, user, onLogout }) {

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "#0a0908",
      borderBottom: "1px solid #2a2520",
      zIndex: 100
    }}>

      {/* Main bar */}
      <div style={{
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px"
      }}>

        {/* Logo */}
        <div
          onClick={function() { setPage("home"); setMenuOpen(false) }}
          style={{
            fontFamily: "'RingBearer', serif",
            fontSize: "16px",
            color: "#c9a84c",
            letterSpacing: "2px",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          The Fellowship
        </div>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }} className="desktop-nav">
          {["HOME", "EXPLORE", "LEADERS", "CHALLENGES", "UPLOAD", "PROFILE"].map(function(link) {
            return (
              <button
                key={link}
                onClick={function() { setPage(link.toLowerCase()) }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  color: "#7a6f5e",
                  padding: "0"
                }}
                onMouseEnter={function(e) { e.target.style.color = "#c9a84c" }}
                onMouseLeave={function(e) { e.target.style.color = "#7a6f5e" }}
              >
                {link}
              </button>
            )
          })}

          {user && (
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: "1px solid #2a2520",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                letterSpacing: "2px",
                color: "#7a6f5e",
                padding: "4px 12px"
              }}
              onMouseEnter={function(e) { e.target.style.color = "#c44d2e"; e.target.style.borderColor = "#c44d2e" }}
              onMouseLeave={function(e) { e.target.style.color = "#7a6f5e"; e.target.style.borderColor = "#2a2520" }}
            >
              LOGOUT
            </button>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={function() { setMenuOpen(!menuOpen) }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#c9a84c",
            fontSize: "20px",
            padding: "0",
            display: "none"
          }}
          className="hamburger"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          borderTop: "1px solid #2a2520",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {["HOME", "EXPLORE", "LEADERS", "CHALLENGES", "UPLOAD", "PROFILE"].map(function(link) {
            return (
              <button
                key={link}
                onClick={function() { setPage(link.toLowerCase()); setMenuOpen(false) }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  letterSpacing: "2px",
                  color: "#7a6f5e",
                  padding: "0",
                  textAlign: "left"
                }}
              >
                {link}
              </button>
            )
          })}
          {user && (
            <button
              onClick={function() { onLogout(); setMenuOpen(false) }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                letterSpacing: "2px",
                color: "#c44d2e",
                padding: "0",
                textAlign: "left"
              }}
            >
              LOGOUT
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>

    </nav>
  )
}