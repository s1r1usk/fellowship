import { useState, useEffect } from "react"
import { supabase } from "./supabase"

export default function FollowsModal({ userId, mode, onClose, setViewingUser }) {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    async function fetchUsers() {
      if (mode === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("*, profiles!follows_follower_id_fkey(username, avatar_url, full_name)")
          .eq("following_id", userId)
        if (data) setUsers(data.map(function(f) { return f.profiles }))
      } else {
        const { data } = await supabase
          .from("follows")
          .select("*, profiles!follows_following_id_fkey(username, avatar_url, full_name)")
          .eq("follower_id", userId)
        if (data) setUsers(data.map(function(f) { return f.profiles }))
      }
      setLoading(false)
    }
    fetchUsers()
  }, [userId, mode])

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{ backgroundColor: "#141210", border: "1px solid #2a2520", borderRadius: "8px", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2520", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c" }}>
            {mode === "followers" ? "FOLLOWERS" : "FOLLOWING"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e" }}>
            CLOSE
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e", letterSpacing: "2px" }}>LOADING...</p>
          ) : users.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#7a6f5e" }}>
              {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : users.map(function(profile, i) {
            return (
              <div key={i}
                onClick={function() { onClose(); setViewingUser(profile?.username) }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #2a2520", cursor: "pointer" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2a2520", border: "1px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <p style={{ fontFamily: "'RingBearer', serif", fontSize: "14px", color: "#c9a84c" }}>
                      {profile?.username?.[0]?.toUpperCase() || "?"}
                    </p>
                  )}
                </div>
                <div>
                  {profile?.full_name && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#f0ebe0" }}>{profile.full_name}</p>
                  )}
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#c9a84c" }}>
                    @{profile?.username?.toUpperCase()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}