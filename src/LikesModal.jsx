import { useState, useEffect } from "react"
import { supabase } from "./supabase"

export default function LikesModal({ photoId, onClose, setViewingUser }) {

  const [likers, setLikers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    async function fetchLikers() {
      const { data } = await supabase
        .from("likes")
        .select("*, profiles!likes_user_id_fkey(username, avatar_url, full_name)")
        .eq("photo_id", photoId)

      if (data) setLikers(data)
      setLoading(false)
    }
    fetchLikers()
  }, [photoId])

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div onClick={function(e) { e.stopPropagation() }} style={{ backgroundColor: "#141210", border: "1px solid #2a2520", borderRadius: "8px", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2520", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c" }}>
            LIKED BY
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e" }}>
            CLOSE
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e", letterSpacing: "2px" }}>LOADING...</p>
          ) : likers.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#7a6f5e" }}>No likes yet</p>
          ) : likers.map(function(like, i) {
            return (
              <div key={i}
                onClick={function() { onClose(); setViewingUser(like.profiles?.username) }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #2a2520", cursor: "pointer" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#2a2520", border: "1px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {like.profiles?.avatar_url ? (
                    <img src={like.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <p style={{ fontFamily: "'RingBearer', serif", fontSize: "14px", color: "#c9a84c" }}>
                      {like.profiles?.username?.[0]?.toUpperCase() || "?"}
                    </p>
                  )}
                </div>
                <div>
                  {like.profiles?.full_name && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#f0ebe0" }}>{like.profiles.full_name}</p>
                  )}
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#c9a84c" }}>
                    @{like.profiles?.username?.toUpperCase()}
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