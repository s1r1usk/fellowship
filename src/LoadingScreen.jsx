import { useState, useEffect } from "react"

const QUOTES = [
  { text: "Not all those who wander are lost.", source: "The Fellowship of the Ring" },
  { text: "Even the smallest person can change the course of the future.", source: "The Fellowship of the Ring" },
  { text: "All we have to decide is what to do with the time that is given us.", source: "The Fellowship of the Ring" },
  { text: "It's a dangerous business, going out your door.", source: "The Fellowship of the Ring" },
  { text: "The world is indeed full of peril and in it there are many dark places.", source: "The Fellowship of the Ring" },
  { text: "Even darkness must pass. A new day will come.", source: "The Two Towers" },
  { text: "There is some good in this world, and it's worth fighting for.", source: "The Two Towers" },
  { text: "I will not say do not weep, for not all tears are an evil.", source: "The Return of the King" },
  { text: "End? No, the journey doesn't end here.", source: "The Return of the King" },
  { text: "In a hole in the ground there lived a hobbit.", source: "The Hobbit" },
  { text: "If more of us valued food and cheer above hoarded gold, it would be a merrier world.", source: "The Hobbit" },
  { text: "Short cuts make long delays.", source: "The Fellowship of the Ring" },
]

export default function LoadingScreen() {

  const [quote, setQuote] = useState(QUOTES[0])
  const [visible, setVisible] = useState(true)
  const [index, setIndex] = useState(0)

  useEffect(function() {
    const interval = setInterval(function() {
      setVisible(false)
      setTimeout(function() {
        setIndex(function(prev) {
          const next = (prev + 1) % QUOTES.length
          setQuote(QUOTES[next])
          return next
        })
        setVisible(true)
      }, 600)
    }, 4000)
    return function() { clearInterval(interval) }
  }, [])

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "#0a0908",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999
    }}>

      {/* Ring Bearer Title */}
      <p style={{
        fontFamily: "'RingBearer', serif",
        fontSize: "18px",
        color: "#c9a84c",
        letterSpacing: "4px",
        marginBottom: "64px",
        opacity: 0.6
      }}>
        The Fellowship
      </p>

      {/* Quote */}
      <div style={{
        maxWidth: "560px",
        textAlign: "center",
        padding: "0 32px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease"
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(18px, 3vw, 26px)",
          fontStyle: "italic",
          color: "#f0ebe0",
          lineHeight: "1.6",
          marginBottom: "20px",
          fontWeight: "300"
        }}>
          "{quote.text}"
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "3px",
          color: "#7a6f5e"
        }}>
          — {quote.source.toUpperCase()}
        </p>
      </div>

      {/* Loading dots */}
      <div style={{
        display: "flex",
        gap: "6px",
        marginTop: "64px"
      }}>
        {[0, 1, 2].map(function(i) {
          return (
            <div key={i} style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#c9a84c",
              opacity: 0.4,
              animation: "pulse 1.4s ease-in-out " + (i * 0.2) + "s infinite"
            }} />
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>

    </div>
  )
}