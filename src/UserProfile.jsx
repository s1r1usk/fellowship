import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import { supabase } from "./supabase"
import { motion } from "framer-motion"
import FollowsModal from "./FollowsModal"

export default function UserProfile({ username, currentUser, setPage, onLogout, setViewingUser }) {

  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [albums, setAlbums] = useState([])
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [activeTab, setActiveTab] = useState("photos")
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followsModal, setFollowsModal] = useState(null)

  useEffect(function() {
    async function fetchAll() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (!profileData) { setLoading(false); return }
      setProfile(profileData)

      const { data: photoData } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })
      if (photoData) setPhotos(photoData)

      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })
      if (albumData) setAlbums(albumData)

      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id)
      setFollowers(followerCount || 0)

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id)
      setFollowing(followingCount || 0)

      if (currentUser) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profileData.id)
          .single()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }
    fetchAll()
  }, [username])

  async function handleFollow() {
    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id)
      setIsFollowing(false)
      setFollowers(followers - 1)
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUser.id,
        following_id: profile.id
      })
      await supabase.from("notifications").insert({
        user_id: profile.id,
        from_user_id: currentUser.id,
        type: "follow",
        photo_id: null
      })
      setIsFollowing(true)
      setFollowers(followers + 1)
    }
  }

  async function openAlbum(album) {
    setSelectedAlbum(album)
    setAlbumPhotos([])

    // Fetch photo_ids from album_photos, then fetch each photo separately
    // This avoids RLS join issues when viewing another user's albums
    const { data: apData } = await supabase
      .from("album_photos")
      .select("photo_id")
      .eq("album_id", album.id)

    if (!apData || apData.length === 0) return

    const photoIds = apData.map(function(ap) { return ap.photo_id })

    const { data: photoData } = await supabase
      .from("photos")
      .select("*")
      .in("id", photoIds)

    if (photoData) setAlbumPhotos(photoData)
  }

  if (loading) return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#7a6f5e" }}>LOADING...</p>
    </div>
  )

  if (!profile) return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", color: "#7a6f5e" }}>User not found</p>
    </div>
  )

  const isOwnProfile = currentUser && currentUser.id === profile.id
  const pinnedPhoto = photos.find(function(p) { return p.id === profile.pinned_photo_id })

  return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh" }}>
      <Navbar setPage={setPage} onLogout={onLogout} user={currentUser} />

      {followsModal && (
        <FollowsModal
          userId={profile.id}
          mode={followsModal}
          onClose={function() { setFollowsModal(null) }}
          setViewingUser={setViewingUser || function() {}}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: "32px", paddingTop: "80px", maxWidth: "900px", margin: "0 auto" }}
      >

        {/* Profile Header */}
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", marginBottom: "48px", paddingBottom: "48px", borderBottom: "1px solid #2a2520", flexWrap: "wrap" }}>

          {/* Avatar */}
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#2a2520", border: "2px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <p style={{ fontFamily: "'RingBearer', serif", fontSize: "32px", color: "#c9a84c" }}>
                {profile.username?.[0]?.toUpperCase() || "?"}
              </p>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {profile.full_name && (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#f0ebe0", marginBottom: "4px", fontWeight: "600" }}>
                {profile.full_name}
              </p>
            )}
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "10px" }}>
              @{profile.username?.toUpperCase()}
              {profile.verified && (
                <span title="Council of Photographers" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "18px", height: "18px", borderRadius: "50%",
                  backgroundColor: "#c9a84c", color: "#0a0908",
                  fontSize: "10px", fontWeight: "bold", marginLeft: "8px",
                  verticalAlign: "middle", flexShrink: 0,
                }}>✦</span>
              )}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", marginBottom: "20px", lineHeight: "1.6" }}>
              {profile.bio || "No bio yet."}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "32px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{photos.length}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>PHOTOS</p>
              </div>
              <div onClick={function() { setFollowsModal("followers") }} style={{ cursor: "pointer" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{followers}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>FOLLOWERS</p>
              </div>
              <div onClick={function() { setFollowsModal("following") }} style={{ cursor: "pointer" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{following}</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>FOLLOWING</p>
              </div>
            </div>

            {!isOwnProfile && (
              <button onClick={handleFollow}
                style={{
                  background: isFollowing ? "none" : "#c9a84c",
                  border: "1px solid " + (isFollowing ? "#2a2520" : "#c9a84c"),
                  borderRadius: "4px", cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px",
                  color: isFollowing ? "#7a6f5e" : "#0a0908",
                  padding: "8px 20px",
                  fontWeight: isFollowing ? "normal" : "bold",
                  transition: "all 0.2s"
                }}>
                {isFollowing ? "FOLLOWING" : "FOLLOW"}
              </button>
            )}

            {isOwnProfile && (
              <button onClick={function() { setPage("profile") }}
                style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e", padding: "8px 20px" }}>
                EDIT PROFILE
              </button>
            )}
          </div>
        </div>

        {/* Pinned Photo */}
        {pinnedPhoto && (
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "16px" }}>
              📌 PINNED SHOT
            </p>
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #c9a84c" }}>
              <img src={pinnedPhoto.image_url} alt={pinnedPhoto.caption} style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "16px", backgroundColor: "#141210" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{pinnedPhoto.category}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080" }}>{pinnedPhoto.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid #2a2520" }}>
          {["photos", "albums"].map(function(tab) {
            return (
              <button key={tab} onClick={function() { setActiveTab(tab); setSelectedAlbum(null) }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px",
                  color: activeTab === tab ? "#c9a84c" : "#7a6f5e",
                  padding: "0 24px 14px 0",
                  borderBottom: "2px solid " + (activeTab === tab ? "#c9a84c" : "transparent"),
                  transition: "all 0.2s"
                }}>
                {tab.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Photos Tab */}
        {activeTab === "photos" && (
          photos.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#7a6f5e", textAlign: "center", padding: "40px 0" }}>
              No photos yet
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
              {photos.map(function(photo) {
                return (
                  <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520" }}>
                    <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "12px", backgroundColor: "#141210" }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{photo.category}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>{photo.caption}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Albums Tab — list */}
        {activeTab === "albums" && !selectedAlbum && (
          albums.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#7a6f5e", textAlign: "center", padding: "40px 0" }}>
              No albums yet
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
              {albums.map(function(album) {
                return (
                  <div key={album.id} onClick={function() { openAlbum(album) }}
                    style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520", cursor: "pointer", backgroundColor: "#141210" }}>
                    <div style={{ height: "140px", backgroundColor: "#2a2520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontFamily: "'RingBearer', serif", fontSize: "24px", color: "#c9a84c", opacity: 0.5 }}>☰</p>
                    </div>
                    <div style={{ padding: "12px" }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#f0ebe0" }}>
                        {album.name.toUpperCase()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Albums Tab — detail */}
        {activeTab === "albums" && selectedAlbum && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <button onClick={function() { setSelectedAlbum(null) }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>
                ← BACK
              </button>
              <p style={{ fontFamily: "'RingBearer', serif", fontSize: "20px", color: "#c9a84c", letterSpacing: "2px" }}>
                {selectedAlbum.name.toUpperCase()}
              </p>
            </div>

            {albumPhotos.length === 0 ? (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#7a6f5e", textAlign: "center", padding: "40px 0" }}>
                No photos in this album yet
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {albumPhotos.map(function(photo) {
                  return (
                    <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520" }}>
                      <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "12px", backgroundColor: "#141210" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{photo.category}</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>{photo.caption}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  )
}