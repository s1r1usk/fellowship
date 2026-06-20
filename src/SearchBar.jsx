export default function SearchBar({ onSearch }) {
  let inputValue = ""

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      onSearch(e.target.value.trim())
    }
  }

  function handleChange(e) {
    inputValue = e.target.value
  }

  return (
    <div style={{ marginBottom: "32px", display: "flex", gap: "8px" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type="text"
          placeholder="Search photos, users, categories..."
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          id="main-search-input"
          style={{
            width: "100%",
            background: "#141210",
            border: "1px solid #2a2520",
            borderRadius: "4px",
            padding: "10px 16px 10px 36px",
            color: "#f0ebe0",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <span style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#7a6f5e",
          fontSize: "14px",
          pointerEvents: "none"
        }}>
          ⌕
        </span>
      </div>
      <button
        onClick={function() {
          const input = document.getElementById("main-search-input")
          if (input) onSearch(input.value.trim())
        }}
        style={{
          background: "#c9a84c",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          letterSpacing: "2px",
          color: "#0a0908",
          padding: "10px 16px",
          fontWeight: "bold",
          whiteSpace: "nowrap"
        }}
      >
        SEARCH
      </button>
    </div>
  )
}