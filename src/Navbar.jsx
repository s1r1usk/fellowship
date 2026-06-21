import { useState } from "react"

export default function Navbar({ setPage, user, onLogout, onNotifications, unreadCount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const primaryLinks = ["HOME", "EXPLORE", "UPLOAD"]
  const secondaryLinks = ["LEADERS", "CHALLENGES", "COLLECTIONS"]

  function go(link) { setPage(link.toLowerCase()); setMenuOpen(false) }

  const btnStyle = (active) => ({
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'DM Mono', monospace", fontSize: "11px",
    letterSpacing: "2px", color: active ? "#c9a84c" : "#7a6f5e", padding: "0",
    transition: "color 0.15s",
  })

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, backgroundColor: "#0a0908", borderBottom: "1px solid #2a2520", zIndex: 100 }}>
      <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Logo */}
        <div onClick={function() { go("home") }}
          style={{ fontFamily: "'RingBearer', serif", fontSize: "15px", color: "#c9a84c", letterSpacing: "2px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          The Fellowship
        </div>

        {/* Desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="desktop-nav">
          {/* Primary */}
          {primaryLinks.map(function(link) {
            return (
              <button key={link} onClick={function() { go(link) }} style={btnStyle(false)}
                onMouseEnter={function(e) { e.currentTarget.style.color = "#c9a84c" }}
                onMouseLeave={function(e) { e.currentTarget.style.color = "#7a6f5e" }}>
                {link}
              </button>
            )
          })}

          {/* Divider */}
          <div style={{ width: "1px", height: "16px", backgroundColor: "#2a2520" }} />

          {/* Secondary — smaller */}
          {secondaryLinks.map(function(link) {
            return (
              <button key={link} onClick={function() { go(link) }}
                style={{ ...btnStyle(false), fontSize: "10px", opacity: 0.7 }}
                onMouseEnter={function(e) { e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.opacity = "1" }}
                onMouseLeave={function(e) { e.currentTarget.style.color = "#7a6f5e"; e.currentTarget.style.opacity = "0.7" }}>
                {link}
              </button>
            )
          })}

          <div style={{ width: "1px", height: "16px", backgroundColor: "#2a2520" }} />

          {/* Profile */}
          <button onClick={function() { go("profile") }} style={btnStyle(false)}
            onMouseEnter={function(e) { e.currentTarget.style.color = "#c9a84c" }}
            onMouseLeave={function(e) { e.currentTarget.style.color = "#7a6f5e" }}>
            PROFILE
          </button>

          {/* Bell */}
          {user && (
            <button onClick={onNotifications} title="Notifications"
              style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "0", lineHeight: 1 }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-7px", backgroundColor: "#c44d2e", color: "#fff", borderRadius: "50%", width: "15px", height: "15px", fontSize: "8px", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {user && (
            <button onClick={onLogout}
              style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", padding: "4px 10px", transition: "all 0.15s" }}
              onMouseEnter={function(e) { e.currentTarget.style.color = "#c44d2e"; e.currentTarget.style.borderColor = "#c44d2e" }}
              onMouseLeave={function(e) { e.currentTarget.style.color = "#7a6f5e"; e.currentTarget.style.borderColor = "#2a2520" }}>
              OUT
            </button>
          )}
        </div>

        {/* Mobile right — bell + hamburger */}
        <div style={{ display: "none", alignItems: "center", gap: "14px" }} className="mobile-nav">
          {user && (
            <button onClick={onNotifications} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "0" }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-7px", backgroundColor: "#c44d2e", color: "#fff", borderRadius: "50%", width: "15px", height: "15px", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={function() { setMenuOpen(!menuOpen) }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#c9a84c", fontSize: "20px", padding: "0" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: "1px solid #2a2520", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "#0a0908" }}>
          {[...primaryLinks, ...secondaryLinks, "PROFILE"].map(function(link) {
            return (
              <button key={link} onClick={function() { go(link) }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "2px", color: "#7a6f5e", padding: "0", textAlign: "left" }}>
                {link}
              </button>
            )
          })}
          {user && (
            <button onClick={function() { onLogout(); setMenuOpen(false) }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "2px", color: "#c44d2e", padding: "0", textAlign: "left" }}>
              LOGOUT
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
