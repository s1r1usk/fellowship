import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import { supabase } from "./supabase"
import { motion } from "framer-motion"
import FollowsModal from "./FollowsModal"
import UserProfile from "./UserProfile"

export default function Profile({ user, setPage, onLogout }) {

  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [albums, setAlbums] = useState([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("photos")
  const [newAlbumName, setNewAlbumName] = useState("")
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [addingToAlbum, setAddingToAlbum] = useState(null)
  const [followsModal, setFollowsModal] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)

  // Interaction state
  const [openComments, setOpenComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})

  useEffect(function() {
    async function fetchAll() {
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setBio(profileData.bio || "")
        setUsername(profileData.username || "")
        setFullName(profileData.full_name || "")
      }

      const { data: photoData } = await supabase
        .from("photos").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (photoData) {
        // Fetch like counts and liked status
        const { data: userLikes } = await supabase
          .from("likes").select("photo_id").eq("user_id", user.id)
        const likedIds = new Set((userLikes || []).map(function(l) { return l.photo_id }))

        const { data: likeCounts } = await supabase.from("likes").select("photo_id")
        const countMap = {}
        ;(likeCounts || []).forEach(function(l) {
          countMap[l.photo_id] = (countMap[l.photo_id] || 0) + 1
        })

        setPhotos(photoData.map(function(photo) {
          return {
            ...photo,
            likes: countMap[photo.id] || 0,
            liked: likedIds.has(photo.id),
            comments: []
          }
        }))
      }

      const { data: albumData } = await supabase
        .from("albums").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (albumData) setAlbums(albumData)

      const { count: followerCount } = await supabase
        .from("follows").select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
      setFollowers(followerCount || 0)

      const { count: followingCount } = await supabase
        .from("follows").select("*", { count: "exact", head: true })
        .eq("follower_id", user.id)
      setFollowing(followingCount || 0)

      setLoading(false)
    }
    fetchAll()
  }, [user])

  async function handleLike(id) {
    const photo = photos.find(function(p) { return p.id === id })
    if (!photo) return

    if (photo.liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("photo_id", id)
      setPhotos(photos.map(function(p) {
        if (p.id === id) return { ...p, likes: p.likes - 1, liked: false }
        return p
      }))
    } else {
      await supabase.from("likes").insert({ user_id: user.id, photo_id: id })
      setPhotos(photos.map(function(p) {
        if (p.id === id) return { ...p, likes: p.likes + 1, liked: true }
        return p
      }))
    }
  }

  async function toggleComments(id) {
    const isOpen = openComments[id]
    setOpenComments({ ...openComments, [id]: !isOpen })

    if (!isOpen) {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles!comments_user_id_fkey(username)")
        .eq("photo_id", id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        const formatted = data.map(function(c) {
          return { id: c.id, user: c.profiles?.username || "unknown", text: c.text, isEdit: c.is_edit }
        })
        setPhotos(photos.map(function(p) {
          if (p.id === id) return { ...p, comments: formatted }
          return p
        }))
      }
    }
  }

  async function handleComment(id) {
    const text = commentInputs[id]?.trim()
    if (!text) return

    const { data, error } = await supabase.from("comments").insert({
      photo_id: id,
      user_id: user.id,
      text: text,
      is_edit: false
    }).select("*, profiles!comments_user_id_fkey(username)").single()

    if (!error && data) {
      const newComment = { id: data.id, user: data.profiles?.username || "unknown", text: data.text, isEdit: false }
      setPhotos(photos.map(function(p) {
        if (p.id === id) return { ...p, comments: [...(p.comments || []), newComment] }
        return p
      }))
      setCommentInputs({ ...commentInputs, [id]: "" })
    }
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from("profiles").update({
      bio: bio,
      username: username.toLowerCase().trim(),
      full_name: fullName.trim()
    }).eq("id", user.id)

    if (!error) {
      setProfile({ ...profile, bio, username: username.toLowerCase().trim(), full_name: fullName.trim() })
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const fileExt = file.name.split(".").pop()
    const fileName = user.id + "/avatar." + fileExt
    await supabase.storage.from("photos").upload(fileName, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(fileName)
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)
    setProfile({ ...profile, avatar_url: publicUrl })
  }

  async function handlePin(photoId) {
    const newPinned = profile.pinned_photo_id === photoId ? null : photoId
    await supabase.from("profiles").update({ pinned_photo_id: newPinned }).eq("id", user.id)
    setProfile({ ...profile, pinned_photo_id: newPinned })
  }

  async function createAlbum() {
    if (!newAlbumName.trim()) return
    const { data, error } = await supabase.from("albums").insert({
      user_id: user.id,
      name: newAlbumName.trim()
    }).select().single()
    if (!error && data) {
      setAlbums([data, ...albums])
      setNewAlbumName("")
      setCreatingAlbum(false)
    }
  }

  async function deleteAlbum(albumId) {
    await supabase.from("albums").delete().eq("id", albumId)
    setAlbums(albums.filter(function(a) { return a.id !== albumId }))
    if (selectedAlbum?.id === albumId) setSelectedAlbum(null)
  }

  async function openAlbum(album) {
    setSelectedAlbum(album)
    const { data } = await supabase
      .from("album_photos")
      .select("*, photos(*)")
      .eq("album_id", album.id)
    if (data) setAlbumPhotos(data.map(function(ap) { return ap.photos }))
  }

  async function addPhotoToAlbum(albumId, photoId) {
    const { error } = await supabase.from("album_photos").insert({ album_id: albumId, photo_id: photoId })
    if (!error) {
      setAddingToAlbum(null)
      if (selectedAlbum?.id === albumId) {
        const photo = photos.find(function(p) { return p.id === photoId })
        if (photo) setAlbumPhotos([...albumPhotos, photo])
      }
    }
  }

  async function removeFromAlbum(albumId, photoId) {
    await supabase.from("album_photos").delete()
      .eq("album_id", albumId).eq("photo_id", photoId)
    setAlbumPhotos(albumPhotos.filter(function(p) { return p.id !== photoId }))
  }

  const pinnedPhoto = photos.find(function(p) { return p.id === profile?.pinned_photo_id })

  if (loading) return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#7a6f5e" }}>LOADING...</p>
    </div>
  )

  if (viewingUser) return (
    <UserProfile
      username={viewingUser}
      currentUser={user}
      setPage={function(p) { setPage(p); setViewingUser(null) }}
      onLogout={onLogout}
    />
  )

  return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh" }}>
      <Navbar setPage={setPage} onLogout={onLogout} user={user} />

      {followsModal && (
        <FollowsModal
          userId={user.id}
          mode={followsModal}
          onClose={function() { setFollowsModal(null) }}
          setViewingUser={function(u) { setFollowsModal(null); setViewingUser(u) }}
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
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#2a2520", border: "2px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <p style={{ fontFamily: "'RingBearer', serif", fontSize: "32px", color: "#c9a84c" }}>
                  {profile?.username?.[0]?.toUpperCase() || "?"}
                </p>
              )}
            </div>
            <label style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", color: "#0a0908", fontWeight: "bold" }}>
              +
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
            </label>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "6px" }}>FULL NAME</label>
                  <input value={fullName} onChange={function(e) { setFullName(e.target.value) }} placeholder="Your full name"
                    style={{ background: "#141210", border: "1px solid #2a2520", borderRadius: "4px", padding: "8px 12px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "6px" }}>USERNAME</label>
                  <input value={username} onChange={function(e) { setUsername(e.target.value) }}
                    style={{ background: "#141210", border: "1px solid #2a2520", borderRadius: "4px", padding: "8px 12px", color: "#f0ebe0", fontFamily: "'DM Mono', monospace", fontSize: "12px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e", display: "block", marginBottom: "6px" }}>BIO</label>
                  <textarea value={bio} onChange={function(e) { setBio(e.target.value) }} rows={3} placeholder="Tell the Fellowship about yourself..."
                    style={{ background: "#141210", border: "1px solid #2a2520", borderRadius: "4px", padding: "8px 12px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", resize: "none" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: "#c9a84c", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#0a0908", padding: "8px 16px", fontWeight: "bold" }}>
                    {saving ? "SAVING..." : "SAVE"}
                  </button>
                  <button onClick={function() { setEditing(false) }}
                    style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e", padding: "8px 16px" }}>
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profile?.full_name && (
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#f0ebe0", marginBottom: "4px", fontWeight: "600" }}>
                    {profile.full_name}
                  </p>
                )}
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "10px" }}>
                  @{profile?.username?.toUpperCase() || "UNKNOWN"}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", marginBottom: "20px", lineHeight: "1.6" }}>
                  {profile?.bio || "No bio yet."}
                </p>
                <div style={{ display: "flex", gap: "32px", marginBottom: "20px" }}>
                  <div>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{photos.length}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>PHOTOS</p>
                  </div>
                  <div onClick={function() { setFollowsModal("followers") }} style={{ cursor: "pointer" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{followers}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>FOLLOWERS</p>
                  </div>
                  <div onClick={function() { setFollowsModal("following") }} style={{ cursor: "pointer" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#c9a84c", fontWeight: "700" }}>{following}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>FOLLOWING</p>
                  </div>
                </div>
                <button onClick={function() { setEditing(true) }}
                  style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e", padding: "6px 16px" }}>
                  EDIT PROFILE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Photo */}
        {pinnedPhoto && (
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "16px" }}>
              📌 PINNED SHOT
            </p>
            <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #c9a84c" }}>
              <img src={pinnedPhoto.image_url} alt={pinnedPhoto.caption} style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "16px", backgroundColor: "#141210" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{pinnedPhoto.category}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080" }}>{pinnedPhoto.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "32px", borderBottom: "1px solid #2a2520" }}>
          {["photos", "albums"].map(function(tab) {
            return (
              <button key={tab} onClick={function() { setActiveTab(tab); setSelectedAlbum(null) }}
                style={{ background: "none", border: "none", borderBottom: "2px solid " + (activeTab === tab ? "#c9a84c" : "transparent"), cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: activeTab === tab ? "#c9a84c" : "#7a6f5e", padding: "0 24px 16px 0", transition: "all 0.2s" }}>
                {tab.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div>
            {photos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", color: "#7a6f5e", marginBottom: "12px" }}>No photos yet</p>
                <button onClick={function() { setPage("upload") }}
                  style={{ background: "#c9a84c", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#0a0908", padding: "10px 20px", fontWeight: "bold" }}>
                  SHARE YOUR FIRST SHOT
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {photos.map(function(photo) {
                  const isPinned = profile?.pinned_photo_id === photo.id
                  return (
                    <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid " + (isPinned ? "#c9a84c" : "#2a2520"), backgroundColor: "#141210" }}>
                      <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", maxHeight: "480px", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "16px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{photo.category}</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", marginBottom: "14px" }}>{photo.caption}</p>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                          <button onClick={function() { handleLike(photo.id) }}
                            style={{ background: photo.liked ? "#c9a84c22" : "none", border: "1px solid " + (photo.liked ? "#c9a84c" : "#2a2520"), borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: photo.liked ? "#c9a84c" : "#7a6f5e", padding: "6px 12px" }}>
                            ♥ {photo.likes || 0}
                          </button>
                          <button onClick={function() { toggleComments(photo.id) }}
                            style={{ background: openComments[photo.id] ? "#4c7ea822" : "none", border: "1px solid " + (openComments[photo.id] ? "#4c7ea8" : "#2a2520"), borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: openComments[photo.id] ? "#4c7ea8" : "#7a6f5e", padding: "6px 12px" }}>
                            ✦ COMMENTS
                          </button>
                          <button onClick={function() {
                            navigator.clipboard.writeText(window.location.origin + "?photo=" + photo.id)
                              .then(function() { alert("Link copied!") })
                          }}
                            style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#7a6f5e", padding: "6px 12px" }}>
                            SHARE
                          </button>
                          <button onClick={function() { handlePin(photo.id) }}
                            style={{ background: isPinned ? "#c9a84c22" : "none", border: "1px solid " + (isPinned ? "#c9a84c" : "#2a2520"), borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: isPinned ? "#c9a84c" : "#7a6f5e", padding: "6px 10px" }}>
                            {isPinned ? "📌 PINNED" : "PIN"}
                          </button>
                          <button onClick={function() { setAddingToAlbum(addingToAlbum === photo.id ? null : photo.id) }}
                            style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: "#7a6f5e", padding: "6px 10px" }}>
                            + ALBUM
                          </button>
                        </div>

                        {/* Add to album picker */}
                        {addingToAlbum === photo.id && (
                          <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            {albums.length === 0 ? (
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#4a4035", fontStyle: "italic" }}>No albums yet. Create one in the Albums tab first.</p>
                            ) : albums.map(function(album) {
                              return (
                                <button key={album.id} onClick={function() { addPhotoToAlbum(album.id, photo.id) }}
                                  style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: "#4c7ea8", padding: "4px 8px", textAlign: "left" }}>
                                  → {album.name.toUpperCase()}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Comments section */}
                        {openComments[photo.id] && (
                          <div>
                            {(!photo.comments || photo.comments.length === 0) && (
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#4a4035", marginBottom: "10px", fontStyle: "italic" }}>
                                No comments yet. Be the first.
                              </p>
                            )}
                            {(photo.comments || []).map(function(comment, i) {
                              return (
                                <div key={i} style={{ borderLeft: "2px solid " + (comment.isEdit ? "#4c7ea8" : "#2a2520"), paddingLeft: "10px", marginBottom: "8px" }}>
                                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: comment.isEdit ? "#4c7ea8" : "#c9a84c", letterSpacing: "1px" }}>
                                    {comment.isEdit ? "EDIT SUGGESTION — " : ""}@{comment.user.toUpperCase()}
                                  </span>
                                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>
                                    {comment.text}
                                  </p>
                                </div>
                              )
                            })}
                            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInputs[photo.id] || ""}
                                onChange={function(e) { setCommentInputs({ ...commentInputs, [photo.id]: e.target.value }) }}
                                onKeyDown={function(e) { if (e.key === "Enter") handleComment(photo.id) }}
                                style={{ flex: 1, background: "#0a0908", border: "1px solid #2a2520", borderRadius: "4px", padding: "6px 10px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", outline: "none" }}
                              />
                              <button onClick={function() { handleComment(photo.id) }}
                                style={{ background: "#c9a84c", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", color: "#0a0908", padding: "6px 12px", fontWeight: "bold" }}>
                                POST
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === "albums" && !selectedAlbum && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#7a6f5e" }}>
                {albums.length} {albums.length === 1 ? "ALBUM" : "ALBUMS"}
              </p>
              <button onClick={function() { setCreatingAlbum(!creatingAlbum) }}
                style={{ background: "#c9a84c", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#0a0908", padding: "6px 14px", fontWeight: "bold" }}>
                + NEW ALBUM
              </button>
            </div>

            {creatingAlbum && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                <input value={newAlbumName} onChange={function(e) { setNewAlbumName(e.target.value) }}
                  onKeyDown={function(e) { if (e.key === "Enter") createAlbum() }}
                  placeholder="Album name..."
                  style={{ flex: 1, background: "#141210", border: "1px solid #2a2520", borderRadius: "4px", padding: "8px 12px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none" }} />
                <button onClick={createAlbum}
                  style={{ background: "#c9a84c", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "1px", color: "#0a0908", padding: "8px 14px", fontWeight: "bold" }}>
                  CREATE
                </button>
              </div>
            )}

            {albums.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", color: "#7a6f5e" }}>No albums yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {albums.map(function(album) {
                  return (
                    <div key={album.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520", cursor: "pointer", backgroundColor: "#141210" }}
                      onClick={function() { openAlbum(album) }}>
                      <div style={{ height: "140px", backgroundColor: "#2a2520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontFamily: "'RingBearer', serif", fontSize: "24px", color: "#c9a84c", opacity: 0.5 }}>☰</p>
                      </div>
                      <div style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#f0ebe0" }}>{album.name.toUpperCase()}</p>
                        <button onClick={function(e) { e.stopPropagation(); deleteAlbum(album.id) }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#4a4035", fontSize: "12px", padding: "0" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Album Detail View */}
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
                No photos in this album yet. Go to PHOTOS tab and add some.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {albumPhotos.map(function(photo) {
                  return (
                    <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520", position: "relative" }}>
                      <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "12px", backgroundColor: "#141210" }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", marginBottom: "8px" }}>{photo.caption}</p>
                        <button onClick={function() { removeFromAlbum(selectedAlbum.id, photo.id) }}
                          style={{ background: "none", border: "1px solid #c44d2e22", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: "#c44d2e", padding: "4px 8px" }}>
                          REMOVE
                        </button>
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