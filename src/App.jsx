import { useState, useEffect } from "react"
import CritiqueModal from "./CritiqueModal"
import Navbar from "./Navbar"
import Upload from "./Upload"
import LoadingScreen from "./LoadingScreen"
import EditModal from "./EditModal"
import BeforeAfter from "./BeforeAfter"
import CategoryPage from "./CategoryPage"
import Auth from "./Auth"
import { supabase } from "./supabase"
import { motion, AnimatePresence } from "framer-motion"
import Profile from "./Profile"
import UserProfile from "./UserProfile"
import ExplorePage from "./ExplorePage"
import LikesModal from "./LikesModal"
import ShareModal from "./ShareModal"
import LeaderboardPage from "./LeaderboardPage"
import ChallengesPage from "./ChallengesPage"
import CollectionsPage from "./CollectionsPage"
import SaveModal from "./SaveModal"
import NotificationsPanel from "./NotificationsPanel"
import AdminPanel from "./AdminPanel"

const CATEGORIES = ["ALL", "LANDSCAPE", "PORTRAIT", "ABSTRACT", "STREET", "MACRO", "ASTROPHOTOGRAPHY", "ARCHITECTURE", "WILDLIFE"]

export default function App() {

  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [revealedNsfw, setRevealedNsfw] = useState({})
  const [page, setPage] = useState("home")
  const [editingPost, setEditingPost] = useState(null)
  const [categoryPage, setCategoryPage] = useState(null)
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [posts, setPosts] = useState([])
  const [commentInputs, setCommentInputs] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [openGear, setOpenGear] = useState({})
  const [viewingUser, setViewingUser] = useState(null)
  const [likesModal, setLikesModal] = useState(null)
  const [sharePost, setSharePost] = useState(null)
  const [savePost, setSavePost] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [critiquePost, setCritiquePost] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(function() {
    window.history.pushState({ page: page, viewingUser: viewingUser, categoryPage: categoryPage }, "")
  }, [page, viewingUser, categoryPage])

  useEffect(function() {
    function handlePopState(e) {
      if (e.state) {
        setPage(e.state.page || "home")
        setViewingUser(e.state.viewingUser || null)
        setCategoryPage(e.state.categoryPage || null)
      } else {
        setPage("home")
        setViewingUser(null)
        setCategoryPage(null)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return function() { window.removeEventListener("popstate", handlePopState) }
  }, [])

  useEffect(function() {
    var minTimeDone = false
    var authDone = false

    function tryFinish() {
      if (minTimeDone && authDone) setLoading(false)
    }

    setTimeout(function() { minTimeDone = true; tryFinish() }, 1500)

    supabase.auth.getSession().then(function({ data: { session } }) {
      setUser(session?.user ?? null)
      setAuthChecked(true)
      authDone = true
      tryFinish()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async function(event, session) {
      setUser(session?.user ?? null)
      // Create profile on first sign-in (handles email-confirmation flow)
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        const username = session.user.user_metadata?.username
        if (username) {
          // Upsert so it's safe to call multiple times
          await supabase.from("profiles").upsert(
            { id: session.user.id, username },
            { onConflict: "id", ignoreDuplicates: true }
          )
        }
      }
    })

    return function() { subscription.unsubscribe() }
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("photos")
      .select("*, profiles!photos_user_id_fkey(username, verified)")
      .order("created_at", { ascending: false })

    if (error) { console.log(error); return }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
    if (profileData) setProfile(profileData)

    const { data: userLikes } = await supabase
      .from("likes")
      .select("photo_id")
      .eq("user_id", user.id)

    const likedIds = new Set((userLikes || []).map(function(l) { return l.photo_id }))

    const { data: likeCounts } = await supabase
      .from("likes")
      .select("photo_id")

    const countMap = {}
    ;(likeCounts || []).forEach(function(l) {
      countMap[l.photo_id] = (countMap[l.photo_id] || 0) + 1
    })

    const formatted = data.map(function(photo) {
      return {
        id: photo.id,
        user: photo.profiles?.username || "unknown",
        verified: photo.profiles?.verified || false,
        caption: photo.caption,
        category: photo.category,
        image_url: photo.image_url,
        nsfw: photo.nsfw,
        likes: countMap[photo.id] || 0,
        liked: likedIds.has(photo.id),
        comments: [],
        gear: photo.gear || null,
        exif: photo.exif || null,
      }
    })

    setPosts(formatted)
  }

  useEffect(function() {
    if (user) {
      fetchPosts()
      supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", user.id).eq("read", false)
        .then(function({ count }) { setUnreadCount(count || 0) })
    }
  }, [user])

  const filteredPosts = activeCategory === "ALL"
    ? posts
    : posts.filter(function(post) { return post.category?.toUpperCase() === activeCategory.toUpperCase() })

  async function handleLike(id) {
    const post = posts.find(function(p) { return p.id === id })
    if (!post) return

    if (post.liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("photo_id", id)
      setPosts(posts.map(function(p) {
        if (p.id === id) return { ...p, likes: p.likes - 1, liked: false }
        return p
      }))
    } else {
      await supabase.from("likes").insert({ user_id: user.id, photo_id: id })
      setPosts(posts.map(function(p) {
        if (p.id === id) return { ...p, likes: p.likes + 1, liked: true }
        return p
      }))
      // Notify post owner
      const post = posts.find(function(p) { return p.id === id })
      if (post) {
        const { data: owner } = await supabase.from("photos").select("user_id").eq("id", id).single()
        if (owner && owner.user_id !== user.id) {
          await supabase.from("notifications").insert({ user_id: owner.user_id, from_user_id: user.id, type: "like", photo_id: id })
        }
      }
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
        setPosts(posts.map(function(p) {
          if (p.id === id) return { ...p, comments: formatted }
          return p
        }))
      }
    }
  }

  async function handleComment(id, text) {
    const commentText = text || (commentInputs[id] || "").trim()
    if (!commentText) return

    const { data, error } = await supabase.from("comments").insert({
      user_id: user.id,
      photo_id: id,
      text: commentText,
      is_edit: false
    }).select("*, profiles!comments_user_id_fkey(username)").single()

    if (!error && data) {
      setPosts(posts.map(function(post) {
        if (post.id === id) {
          return { ...post, comments: [...post.comments, { id: data.id, user: data.profiles?.username || "you", text: data.text, isEdit: false }] }
        }
        return post
      }))
      setCommentInputs({ ...commentInputs, [id]: "" })
      // Notify post owner
      const { data: owner } = await supabase.from("photos").select("user_id").eq("id", id).single()
      if (owner && owner.user_id !== user.id) {
        await supabase.from("notifications").insert({ user_id: owner.user_id, from_user_id: user.id, type: "comment", photo_id: id })
      }
    }
  }

  function handleShare(post) {
    console.log("handleShare called", post)
    setSharePost(post)
  }

  async function handleEditSubmit(editSuggestion) {
    const { data, error } = await supabase.from("comments").insert({
      user_id: user.id,
      photo_id: editSuggestion.postId,
      text: editSuggestion.note,
      is_edit: true
    }).select("*, profiles!comments_user_id_fkey(username)").single()

    if (!error && data) {
      setPosts(posts.map(function(post) {
        if (post.id === editSuggestion.postId) {
          return { ...post, comments: [...post.comments, { id: data.id, user: data.profiles?.username || "you", text: data.text, isEdit: true }] }
        }
        return post
      }))
    }
  }

  function handleCategoryClick(cat) {
    if (cat === "ALL") {
      setActiveCategory("ALL")
      setCategoryPage(null)
    } else {
      setCategoryPage(cat)
      setActiveCategory(cat)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setPosts([])
  }

  if (loading) return <LoadingScreen />
  if (!authChecked) return <LoadingScreen />
  if (!user) return <Auth />

  if (page === "upload") return (
    <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <Upload setPage={function(p) { setPage(p); if (p === "home") fetchPosts() }} user={user} />
    </motion.div>
  )

  if (page === "profile") return (
    <Profile user={user} setPage={setPage} onLogout={handleLogout} />
  )

  if (viewingUser) return (
    <UserProfile
      username={viewingUser}
      currentUser={user}
      setPage={function(p) { setPage(p); setViewingUser(null) }}
      onLogout={handleLogout}
    />
  )

  if (page === "explore") return (
    <ExplorePage
      currentUser={user}
      setPage={setPage}
      setViewingUser={setViewingUser}
      onLogout={handleLogout}
    />
  )

  if (page === "leaders") return (
    <LeaderboardPage setPage={setPage} setViewingUser={setViewingUser} />
  )

  if (page === "challenges") return (
    <ChallengesPage user={user} setViewingUser={setViewingUser} setPage={setPage} />
  )

  if (page === "collections") return (
    <CollectionsPage user={user} setPage={setPage} />
  )

  if (page === "admin") return (
    <AdminPanel user={user} setPage={setPage} />
  )

  if (categoryPage) return (
    <CategoryPage
      category={categoryPage}
      posts={posts}
      setPage={function(p) { setPage(p); if (p === "home") setCategoryPage(null) }}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onEditSubmit={handleEditSubmit}
    />
  )

  return (
    <div style={{ background: "linear-gradient(180deg, #1a1714 0%, #161411 100%)", minHeight: "100vh" }}>
      <Navbar setPage={function(p) { setPage(p); setCategoryPage(null); setViewingUser(null) }} onLogout={handleLogout} user={user} onNotifications={function() { setShowNotifications(true) }} unreadCount={unreadCount} />

      {likesModal && (
        <LikesModal photoId={likesModal} onClose={function() { setLikesModal(null) }} setViewingUser={setViewingUser} />
      )}
      {sharePost && (
        <ShareModal post={sharePost} onClose={function() { setSharePost(null) }} />
      )}
      {savePost && (
        <SaveModal post={savePost} user={user} onClose={function() { setSavePost(null) }} />
      )}
      {showNotifications && (
        <NotificationsPanel user={user} onClose={function() { setShowNotifications(false); setUnreadCount(0) }} setViewingUser={setViewingUser} setPage={setPage} />
      )}

      {critiquePost && (
        <CritiqueModal post={critiquePost} onClose={function() { setCritiquePost(null) }} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ padding: "32px", paddingTop: "80px" }}
        >

          {editingPost && (
            <EditModal post={editingPost} onClose={function() { setEditingPost(null) }} onSubmit={handleEditSubmit} />
          )}

          {/* Category Menu */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #2a2520", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            {CATEGORIES.map(function(cat) {
              return (
                <button key={cat} onClick={function() { handleCategoryClick(cat) }}
                  style={{
                    background: activeCategory === cat ? "#c8a95d" : "none",
                    border: "1px solid " + (activeCategory === cat ? "#c8a95d" : "#2a2520"),
                    borderRadius: "4px", cursor: "pointer", fontSize: "10px",
                    fontFamily: "'DM Mono', monospace", letterSpacing: "2px",
                    color: activeCategory === cat ? "#0a0908" : "#7a6f5e",
                    padding: "6px 14px", transition: "all 0.2s",
                    whiteSpace: "nowrap", flexShrink: 0
                  }}>
                  {cat}
                </button>
              )
            })}
          </div>

          {filteredPosts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", color: "#9a8f80" }}>No photos found</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4a4035", marginTop: "8px" }}>NOT ALL THOSE WHO WANDER ARE LOST</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filteredPosts.map(function(post) {
              return (
                <div key={post.id} style={{ backgroundColor: "#211d19", border: "1px solid #3b342d", borderRadius: "8px", width: "100%", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>

                  <div style={{ position: "relative" }}>
                    <img
                      src={post.image_url || "https://picsum.photos/320/240?random=" + post.id}
                      alt="photo"
                      style={{ width: "100%", display: "block", filter: post.nsfw && !revealedNsfw[post.id] ? "blur(20px)" : "none", transition: "filter 0.3s" }}
                    />
                    {post.nsfw && !revealedNsfw[post.id] && (
                      <div onClick={function() { setRevealedNsfw({ ...revealedNsfw, [post.id]: true }) }}
                        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "rgba(10,9,8,0.4)" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#f0ebe0", marginBottom: "8px" }}>SENSITIVE CONTENT</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9a8f80" }}>Click to reveal</p>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "16px" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px", cursor: "pointer" }}
                      onClick={function() { handleCategoryClick(post.category) }}>
                      {post.category}
                    </p>
                    <p onClick={function() { setViewingUser(post.user) }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c8a95d", marginBottom: "6px", cursor: "pointer" }}>
                      @{post.user.toUpperCase()}
                      {post.verified && (
                        <span title="Verified — Council of Photographers" style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "16px", height: "16px", borderRadius: "50%",
                          backgroundColor: "#c9a84c", color: "#0a0908",
                          fontSize: "9px", fontWeight: "bold", marginLeft: "6px",
                          verticalAlign: "middle", flexShrink: 0,
                        }}>✦</span>
                      )}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#c7bcaa", fontWeight: "300", marginBottom: "14px" }}>
                      {post.caption}
                    </p>

                    {/* Gear section */}
                    {post.gear && (
                      <div style={{ marginBottom: "12px" }}>
                        <button
                          onClick={function() { setOpenGear({ ...openGear, [post.id]: !openGear[post.id] }) }}
                          style={{
                            background: "none", border: "1px solid #2a2520", borderRadius: "4px",
                            cursor: "pointer", fontSize: "10px", fontFamily: "'DM Mono', monospace",
                            letterSpacing: "2px", color: "#4c7ea8", padding: "4px 10px",
                            display: "flex", alignItems: "center", gap: "6px"
                          }}>
                          ⚙ GEAR {openGear[post.id] ? "▲" : "▼"}
                        </button>
                        <AnimatePresence>
                          {openGear[post.id] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ marginTop: "8px", padding: "10px 12px", backgroundColor: "#141210", borderRadius: "4px", border: "1px solid #4c7ea822", display: "flex", flexDirection: "column", gap: "5px" }}>
                                {[
                                  { label: "BODY", value: post.gear.body },
                                  { label: "LENS", value: post.gear.lens },
                                  { label: "SETTINGS", value: post.gear.settings },
                                ].map(function(row) {
                                  return (
                                    <div key={row.label} style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#4c7ea8", opacity: 0.7, minWidth: "52px" }}>{row.label}</span>
                                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#a09080" }}>{row.value}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {post.exif && (
                      <div style={{ marginBottom: "12px" }}>
                        <button
                          onClick={function() { setOpenGear({ ...openGear, [`exif_${post.id}`]: !openGear[`exif_${post.id}`] }) }}
                          style={{
                            background: "none", border: "1px solid #2a2520", borderRadius: "4px",
                            cursor: "pointer", fontSize: "10px", fontFamily: "'DM Mono', monospace",
                            letterSpacing: "2px", color: "#c9a84c", padding: "4px 10px",
                            display: "flex", alignItems: "center", gap: "6px"
                          }}>
                          ✦ EXIF {openGear[`exif_${post.id}`] ? "▲" : "▼"}
                        </button>
                        <AnimatePresence>
                          {openGear[`exif_${post.id}`] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ marginTop: "8px", padding: "10px 12px", backgroundColor: "#141210", borderRadius: "4px", border: "1px solid #c9a84c22", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                                {[
                                  ["Camera", post.exif.Make && post.exif.Model ? `${post.exif.Make} ${post.exif.Model}` : null],
                                  ["Lens", post.exif.LensModel || null],
                                  ["Focal Length", post.exif.FocalLength ? `${post.exif.FocalLength}mm` : null],
                                  ["Aperture", post.exif.FNumber ? `f/${post.exif.FNumber}` : null],
                                  ["Shutter", post.exif.ExposureTime ? (post.exif.ExposureTime < 1 ? `1/${Math.round(1/post.exif.ExposureTime)}s` : `${post.exif.ExposureTime}s`) : null],
                                  ["ISO", post.exif.ISO ? `ISO ${post.exif.ISO}` : null],
                                  ["Resolution", post.exif.ImageWidth && post.exif.ImageHeight ? `${post.exif.ImageWidth} × ${post.exif.ImageHeight}` : null],
                                  ["Date", post.exif.DateTimeOriginal ? new Date(post.exif.DateTimeOriginal).toLocaleDateString() : null],
                                ].filter(function(r) { return r[1] }).map(function(r) {
                                  return (
                                    <div key={r[0]}>
                                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#c9a84c", opacity: 0.6, letterSpacing: "0.1em", display: "block" }}>{r[0].toUpperCase()}</span>
                                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#a09080" }}>{r[1]}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Delete button */}
                    {post.user === profile?.username && (
                      <button
                        onClick={async function() {
                          if (!window.confirm("Delete this photo?")) return
                          await supabase.storage.from("photos").remove([user.id + "/" + post.image_url.split("/").pop()])
                          await supabase.from("photos").delete().eq("id", post.id)
                          setPosts(posts.filter(function(p) { return p.id !== post.id }))
                        }}
                        style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#c44d2e", padding: "4px 10px", marginBottom: "10px" }}>
                        DELETE
                      </button>
                    )}

                    <div style={{ display: "flex", gap: "6px", marginBottom: "14px", alignItems: "center" }}>
                      {/* Like */}
                      <button onClick={function() { handleLike(post.id) }} title={post.liked ? "Unlike" : "Like"}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: post.liked ? "#c44d2e" : "#4a4035", padding: "6px 4px", lineHeight: 1, transition: "color 0.15s, transform 0.1s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.transform = "scale(1.2)" }}
                        onMouseLeave={function(e) { e.currentTarget.style.transform = "scale(1)" }}>
                        {post.liked ? "♥" : "♡"}
                      </button>
                      {/* Like count */}
                      <button onClick={function() { setLikesModal(post.id) }} title="See likes"
                        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e", padding: "6px 2px", minWidth: "20px" }}>
                        {post.likes}
                      </button>

                      <div style={{ width: "1px", height: "18px", backgroundColor: "#2a2520", margin: "0 4px" }} />

                      {/* Comment */}
                      <button onClick={function() { toggleComments(post.id) }} title="Comments"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "17px", color: openComments[post.id] ? "#4c7ea8" : "#4a4035", padding: "6px 4px", lineHeight: 1, transition: "color 0.15s, transform 0.1s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.transform = "scale(1.2)" }}
                        onMouseLeave={function(e) { e.currentTarget.style.transform = "scale(1)" }}>
                        💬
                      </button>
                      {post.comments.length > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#7a6f5e" }}>{post.comments.length}</span>
                      )}

                      <div style={{ width: "1px", height: "18px", backgroundColor: "#2a2520", margin: "0 4px" }} />

                      {/* Share */}
                      <button onClick={function() { handleShare(post) }} title="Share"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "17px", color: "#4a4035", padding: "6px 4px", lineHeight: 1, transition: "color 0.15s, transform 0.1s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.color = "#9a8f80"; e.currentTarget.style.transform = "scale(1.2)" }}
                        onMouseLeave={function(e) { e.currentTarget.style.color = "#4a4035"; e.currentTarget.style.transform = "scale(1)" }}>
                        📤
                      </button>

                      {/* Save */}
                      <button onClick={function() { setSavePost(post) }} title="Save to collection"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "17px", color: "#4a4035", padding: "6px 4px", lineHeight: 1, transition: "color 0.15s, transform 0.1s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.color = "#c9a84c"; e.currentTarget.style.transform = "scale(1.2)" }}
                        onMouseLeave={function(e) { e.currentTarget.style.color = "#4a4035"; e.currentTarget.style.transform = "scale(1)" }}>
                        🔖
                      </button>

                      {/* Suggest Edit */}
                      <button onClick={function() { setEditingPost(post) }} title="Suggest edit"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "17px", color: "#4a4035", padding: "6px 4px", lineHeight: 1, transition: "color 0.15s, transform 0.1s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.color = "#4c7ea8"; e.currentTarget.style.transform = "scale(1.2)" }}
                        onMouseLeave={function(e) { e.currentTarget.style.color = "#4a4035"; e.currentTarget.style.transform = "scale(1)" }}>
                        ✏️
                      </button>
                    </div>

                    {openComments[post.id] && (
                      <div>
                        {post.comments.length === 0 && (
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#4a4035", marginBottom: "10px", fontStyle: "italic" }}>
                            No comments yet. Be the first.
                          </p>
                        )}
                        {post.comments.map(function(comment, i) {
                          return (
                            <div key={i} style={{ borderLeft: "2px solid " + (comment.isEdit ? "#4c7ea8" : "#2a2520"), paddingLeft: "10px", marginBottom: "8px" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: comment.isEdit ? "#4c7ea8" : "#c8a95d", letterSpacing: "1px" }}>
                                {comment.isEdit ? "EDIT SUGGESTION — " : ""}@{comment.user.toUpperCase()}
                              </span>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#c7bcaa", fontWeight: "300" }}>
                                {comment.text}
                              </p>
                              {comment.isEdit && <BeforeAfter postId={post.id} imageUrl={post.image_url} />}
                            </div>
                          )
                        })}

                        <button onClick={function() { setCritiquePost(post) }} title="AI Critique"
                          style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#c8a95d", padding: "6px 12px" }}>
                          🧙 CRITIQUE
                        </button>

                        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={function(e) { setCommentInputs({ ...commentInputs, [post.id]: e.target.value }) }}
                            onKeyDown={function(e) { if (e.key === "Enter") handleComment(post.id) }}
                            style={{ flex: 1, background: "#1b1714", border: "1px solid #2a2520", borderRadius: "4px", padding: "6px 10px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", outline: "none" }}
                          />
                          <button onClick={function() { handleComment(post.id) }}
                            style={{ background: "#c8a95d", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", color: "#0a0908", padding: "6px 12px", fontWeight: "bold" }}>
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

        </motion.div>
      </AnimatePresence>
    </div>
  )
}