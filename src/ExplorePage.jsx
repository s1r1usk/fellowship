import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import { supabase } from "./supabase"
import { motion } from "framer-motion"
import SearchBar from "./SearchBar"

const ALL_CATEGORIES = ["LANDSCAPE", "PORTRAIT", "ABSTRACT", "STREET", "MACRO", "ASTROPHOTOGRAPHY", "ARCHITECTURE", "WILDLIFE"]

export default function ExplorePage({ currentUser, setPage, setViewingUser, onLogout }) {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryPhotos, setCategoryPhotos] = useState([])
  const [loadingCategory, setLoadingCategory] = useState(false)

  useEffect(function() {
    async function fetchUsers() {
      const { data } = await supabase
        .from("profiles")
        .select("*, photos!photos_user_id_fkey(count)")
        .neq("id", currentUser.id)
        .order("created_at", { ascending: false })
      if (data) setUsers(data)
      setLoading(false)
    }
    fetchUsers()
  }, [])

  async function handleSearch(query) {
    if (!query) { setSearchResults(null); setSearchQuery(""); return }
    setSearchQuery(query)
    setSearching(true)
    setSelectedCategory(null)

    const q = query.toLowerCase()

    // Search photos
    const { data: photoData } = await supabase
      .from("photos")
      .select("*, profiles!photos_user_id_fkey(username, full_name)")
      .or("caption.ilike.%" + q + "%,category.ilike.%" + q + "%")
      .order("created_at", { ascending: false })
      .limit(20)

    // Search users
    const { data: userData } = await supabase
      .from("profiles")
      .select("*, photos!photos_user_id_fkey(count)")
      .or("username.ilike.%" + q + "%,full_name.ilike.%" + q + "%")
      .neq("id", currentUser.id)
      .limit(10)

    // Match categories
    const matchedCategories = ALL_CATEGORIES.filter(function(cat) {
      return cat.toLowerCase().includes(q)
    })

    setSearchResults({
      photos: photoData || [],
      users: userData || [],
      categories: matchedCategories
    })

    setSearching(false)
  }

  async function handleCategoryClick(cat) {
    setSelectedCategory(cat)
    setLoadingCategory(true)
    setSearchResults(null)

    const { data } = await supabase
      .from("photos")
      .select("*, profiles!photos_user_id_fkey(username)")
      .eq("category", cat)
      .order("created_at", { ascending: false })

    if (data) setCategoryPhotos(data)
    setLoadingCategory(false)
  }

  // Category filtered view
  if (selectedCategory) return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh" }}>
      <Navbar setPage={setPage} onLogout={onLogout} user={currentUser} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: "32px", paddingTop: "80px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button onClick={function() { setSelectedCategory(null); setCategoryPhotos([]) }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#7a6f5e" }}>
            ← BACK
          </button>
          <p style={{ fontFamily: "'RingBearer', serif", fontSize: "24px", color: "#c9a84c", letterSpacing: "2px" }}>
            {selectedCategory}
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#7a6f5e", letterSpacing: "2px" }}>
            {loadingCategory ? "..." : categoryPhotos.length + " PHOTOS"}
          </p>
        </div>

        {loadingCategory ? (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#7a6f5e" }}>LOADING...</p>
        ) : categoryPhotos.length === 0 ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#7a6f5e", textAlign: "center", padding: "60px 0" }}>
            No photos in this category yet
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {categoryPhotos.map(function(photo) {
              return (
                <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520", backgroundColor: "#141210" }}>
                  <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "12px" }}>
                    <p onClick={function() { setViewingUser(photo.profiles?.username) }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "4px", cursor: "pointer" }}>
                      @{photo.profiles?.username?.toUpperCase() || "UNKNOWN"}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>{photo.caption}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )

  return (
    <div style={{ backgroundColor: "#0a0908", minHeight: "100vh" }}>
      <Navbar setPage={setPage} onLogout={onLogout} user={currentUser} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: "32px", paddingTop: "80px", maxWidth: "1100px", margin: "0 auto" }}
      >

        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "8px" }}>EXPLORE</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontStyle: "italic", color: "#f0ebe0", marginBottom: "32px" }}>
          The Fellowship of Photographers
        </p>

        <SearchBar onSearch={handleSearch} />

        {/* Search Results */}
        {searchResults && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#7a6f5e" }}>
                RESULTS FOR
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#c9a84c" }}>
                "{searchQuery}"
              </p>
              <button onClick={function() { setSearchResults(null); setSearchQuery("") }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4a4035", marginLeft: "auto" }}>
                CLEAR ✕
              </button>
            </div>

            {searching ? (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#7a6f5e" }}>SEARCHING...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

                {/* Photos Section */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #2a2520" }}>
                    PHOTOS — {searchResults.photos.length} RESULTS
                  </p>
                  {searchResults.photos.length === 0 ? (
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#4a4035" }}>No photos found</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {searchResults.photos.map(function(photo) {
                        return (
                          <div key={photo.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2520", backgroundColor: "#141210" }}>
                            <img src={photo.image_url} alt={photo.caption} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                            <div style={{ padding: "12px" }}>
                              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#4c7ea8", marginBottom: "4px" }}>{photo.category}</p>
                              <p onClick={function() { setViewingUser(photo.profiles?.username) }}
                                style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "4px", cursor: "pointer" }}>
                                @{photo.profiles?.username?.toUpperCase() || "UNKNOWN"}
                              </p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300" }}>{photo.caption}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Categories Section */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #2a2520" }}>
                    CATEGORIES — {searchResults.categories.length} RESULTS
                  </p>
                  {searchResults.categories.length === 0 ? (
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#4a4035" }}>No categories found</p>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {searchResults.categories.map(function(cat) {
                        return (
                          <button key={cat} onClick={function() { handleCategoryClick(cat) }}
                            style={{ background: "#141210", border: "1px solid #c9a84c", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", padding: "8px 18px", transition: "all 0.2s" }}
                            onMouseEnter={function(e) { e.currentTarget.style.background = "#c9a84c22" }}
                            onMouseLeave={function(e) { e.currentTarget.style.background = "#141210" }}>
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Users Section */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #2a2520" }}>
                    USERS — {searchResults.users.length} RESULTS
                  </p>
                  {searchResults.users.length === 0 ? (
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontStyle: "italic", color: "#4a4035" }}>No users found</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
                      {searchResults.users.map(function(profile) {
                        return (
                          <div key={profile.id} onClick={function() { setViewingUser(profile.username) }}
                            style={{ backgroundColor: "#141210", border: "1px solid #2a2520", borderRadius: "8px", padding: "16px", cursor: "pointer", display: "flex", gap: "14px", alignItems: "center", transition: "border-color 0.2s" }}
                            onMouseEnter={function(e) { e.currentTarget.style.borderColor = "#c9a84c" }}
                            onMouseLeave={function(e) { e.currentTarget.style.borderColor = "#2a2520" }}>
                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#2a2520", border: "2px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <p style={{ fontFamily: "'RingBearer', serif", fontSize: "16px", color: "#c9a84c" }}>
                                  {profile.username?.[0]?.toUpperCase() || "?"}
                                </p>
                              )}
                            </div>
                            <div>
                              {profile.full_name && (
                                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#f0ebe0", marginBottom: "2px" }}>{profile.full_name}</p>
                              )}
                              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#c9a84c" }}>
                                @{profile.username?.toUpperCase()}
                              </p>
                              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: "#7a6f5e", marginTop: "2px" }}>
                                {profile.photos?.[0]?.count || 0} PHOTOS
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* Default view — no search */}
        {!searchResults && (
          <div>
            {/* Categories */}
            <div style={{ marginBottom: "48px" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#7a6f5e", marginBottom: "20px" }}>
                BROWSE BY CATEGORY
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {ALL_CATEGORIES.map(function(cat) {
                  return (
                    <button key={cat} onClick={function() { handleCategoryClick(cat) }}
                      style={{ background: "#141210", border: "1px solid #2a2520", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "2px", color: "#7a6f5e", padding: "8px 18px", transition: "all 0.2s" }}
                      onMouseEnter={function(e) { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#c9a84c" }}
                      onMouseLeave={function(e) { e.currentTarget.style.borderColor = "#2a2520"; e.currentTarget.style.color = "#7a6f5e" }}>
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Members */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "3px", color: "#7a6f5e", marginBottom: "20px" }}>
                MEMBERS
              </p>
              {loading ? (
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#7a6f5e" }}>LOADING...</p>
              ) : users.length === 0 ? (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontStyle: "italic", color: "#7a6f5e", textAlign: "center", padding: "40px 0" }}>
                  No other members yet. Share the link with friends.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                  {users.map(function(profile) {
                    return (
                      <div key={profile.id} onClick={function() { setViewingUser(profile.username) }}
                        style={{ backgroundColor: "#141210", border: "1px solid #2a2520", borderRadius: "8px", padding: "20px", cursor: "pointer", transition: "border-color 0.2s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.borderColor = "#c9a84c" }}
                        onMouseLeave={function(e) { e.currentTarget.style.borderColor = "#2a2520" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#2a2520", border: "2px solid #c9a84c", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <p style={{ fontFamily: "'RingBearer', serif", fontSize: "18px", color: "#c9a84c" }}>
                                {profile.username?.[0]?.toUpperCase() || "?"}
                              </p>
                            )}
                          </div>
                          <div>
                            {profile.full_name && (
                              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "#f0ebe0", marginBottom: "2px" }}>{profile.full_name}</p>
                            )}
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "1px", color: "#c9a84c" }}>
                              @{profile.username?.toUpperCase()}
                            </p>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "1px", color: "#7a6f5e", marginTop: "4px" }}>
                              {profile.photos?.[0]?.count || 0} PHOTOS
                            </p>
                          </div>
                        </div>
                        {profile.bio && (
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#a09080", fontWeight: "300", marginTop: "12px", lineHeight: "1.5" }}>
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}