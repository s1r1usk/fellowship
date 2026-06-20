import Navbar from "./Navbar"
import BeforeAfter from "./BeforeAfter"
import EditModal from "./EditModal"
import LikesModal from "./LikesModal"
import { useState } from "react"
import { motion } from "framer-motion"

export default function CategoryPage({ category, posts, setPage, onLike, onComment, onShare, onEditSubmit, user, setViewingUser }) {

  const [commentInputs, setCommentInputs] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [revealedNsfw, setRevealedNsfw] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [likesModal, setLikesModal] = useState(null)

  const categoryPosts = posts.filter(function(post) {
  return post.category?.toUpperCase() === category?.toUpperCase()
})

  

  function toggleComments(id) {
    setOpenComments({ ...openComments, [id]: !openComments[id] })
  }

  function handleComment(id) {
    const text = (commentInputs[id] || "").trim()
    if (!text) return
    onComment(id, text)
    setCommentInputs({ ...commentInputs, [id]: "" })
  }

  return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh" }}>
      <Navbar setPage={setPage} />

      {editingPost && (
        <EditModal
          post={editingPost}
          onClose={function() { setEditingPost(null) }}
          onSubmit={function(suggestion) { onEditSubmit(suggestion); setEditingPost(null) }}
        />
      )}

      {likesModal && (
        <LikesModal
          photoId={likesModal}
          onClose={function() { setLikesModal(null) }}
          setViewingUser={setViewingUser}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: "32px", paddingTop: "80px" }}
      >

        {/* Header */}
        <div style={{ marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #2a2520" }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            letterSpacing: "3px",
            color: "#7a6f5e",
            marginBottom: "8px"
          }}>
            CATEGORY
          </p>
          <h1 style={{
            fontFamily: "'RingBearer', serif",
            fontSize: "clamp(24px, 4vw, 42px)",
            color: "#c9a84c",
            letterSpacing: "2px",
            marginBottom: "8px"
          }}>
            {category}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: "#7a6f5e"
          }}>
            {categoryPosts.length} {categoryPosts.length === 1 ? "photo" : "photos"}
          </p>
        </div>

        {/* Empty state */}
        {categoryPosts.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px",
              fontStyle: "italic",
              color: "#7a6f5e",
              marginBottom: "12px"
            }}>
              No photos here yet
            </p>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "2px",
              color: "#4a4035"
            }}>
              BE THE FIRST TO SHARE A {category} PHOTO
            </p>
          </div>
        )}

        {/* Feed */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {categoryPosts.map(function(post) {
            return (
              <div key={post.id} style={{
                backgroundColor: "#141210",
                border: "1px solid #2a2520",
                borderRadius: "8px",
                width: "100%",
                overflow: "hidden"
              }}>

                {/* Photo */}
                <div style={{ position: "relative" }}>
                  <img
                    src={post.image_url}
                    alt="photo"
                    style={{
                      width: "100%",
                      display: "block",
                      filter: post.nsfw && !revealedNsfw[post.id] ? "blur(20px)" : "none",
                      transition: "filter 0.3s"
                    }}
                  />
                  {post.nsfw && !revealedNsfw[post.id] && (
                    <div
                      onClick={function() { setRevealedNsfw({ ...revealedNsfw, [post.id]: true }) }}
                      style={{
                        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", cursor: "pointer",
                        backgroundColor: "rgba(10,9,8,0.4)"
                      }}
                    >
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#f0ebe0", marginBottom: "8px" }}>
                        SENSITIVE CONTENT
                      </p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#7a6f5e" }}>
                        Click to reveal
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ padding: "16px" }}>

                  {/* Category + username */}
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>
                    {post.category}
                  </p>
                  <p
                    onClick={function() { if (setViewingUser) setViewingUser(post.user) }}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "6px", cursor: "pointer" }}>
                    @{post.user.toUpperCase()}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#a09080", fontWeight: "300", marginBottom: "14px" }}>
                    {post.caption}
                  </p>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <button onClick={function() { onLike(post.id) }}
                      style={{ background: "none", border: "1px solid " + (post.liked ? "#c44d2e" : "#2a2520"), borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: post.liked ? "#c44d2e" : "#7a6f5e", padding: "6px 12px" }}>
                      {post.liked ? "LIKED" : "LIKE"}
                    </button>
                    <button onClick={function() { setLikesModal(post.id) }}
                      style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#7a6f5e", padding: "6px 8px" }}>
                      {post.likes} ♥
                    </button>
                    <button onClick={function() { toggleComments(post.id) }}
                      style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#7a6f5e", padding: "6px 12px" }}>
                      COMMENTS {post.comments ? post.comments.length : 0}
                    </button>
                    <button onClick={function() { onShare(post) }}
                      style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#7a6f5e", padding: "6px 12px" }}>
                      SHARE
                    </button>
                    <button onClick={function() { setEditingPost(post) }}
                      style={{ background: "none", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#4c7ea8", padding: "6px 12px" }}>
                      SUGGEST EDIT
                    </button>
                  </div>

                  {/* Comments */}
                  {openComments[post.id] && (
                    <div>
                      {(!post.comments || post.comments.length === 0) && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#4a4035", marginBottom: "10px", fontStyle: "italic" }}>
                          No comments yet. Be the first.
                        </p>
                      )}
                      {(post.comments || []).map(function(comment, i) {
                        return (
                          <div key={i} style={{ borderLeft: "2px solid " + (comment.isEdit ? "#4c7ea8" : "#2a2520"), paddingLeft: "10px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: comment.isEdit ? "#4c7ea8" : "#c9a84c", letterSpacing: "1px" }}>
                              {comment.isEdit ? "EDIT SUGGESTION — " : ""}@{comment.user.toUpperCase()}
                            </span>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>
                              {comment.text}
                            </p>
                            {comment.isEdit && <BeforeAfter postId={post.id} imageUrl={post.image_url} />}
                          </div>
                        )
                      })}
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={function(e) { setCommentInputs({ ...commentInputs, [post.id]: e.target.value }) }}
                          onKeyDown={function(e) { if (e.key === "Enter") handleComment(post.id) }}
                          style={{ flex: 1, background: "#0a0908", border: "1px solid #2a2520", borderRadius: "4px", padding: "6px 10px", color: "#f0ebe0", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", outline: "none" }}
                        />
                        <button onClick={function() { handleComment(post.id) }}
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
      </motion.div>
    </div>
  )
}