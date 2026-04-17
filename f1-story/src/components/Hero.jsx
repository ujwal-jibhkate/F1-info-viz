import { useEffect, useRef, useState } from 'react'
import { HERO_STATS, COLORS } from '../styles/theme'

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 2000, delay = 0, started = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!started) return
    let startTime = null
    let rafId

    const delayTimer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.floor(eased * target))
        if (progress < 1) rafId = requestAnimationFrame(step)
        else setValue(target)
      }
      rafId = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(delayTimer)
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, delay, started])

  return value
}

// ─── Single stat counter card ─────────────────────────────────────────────────
function StatCard({ stat, index, started }) {
  const count = useCounter(stat.value, 1800, index * 180, started)

  return (
    <div
      className="stat-card"
      style={{
        opacity: started ? 1 : 0,
        transform: started ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${index * 0.18}s, transform 0.6s ease ${index * 0.18}s`,
      }}
    >
      <div className="stat-value">
        {count.toLocaleString()}
        <span className="stat-suffix">{stat.suffix}</span>
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  )
}

// ─── Racing circuit SVG path (abstract F1 circuit silhouette) ─────────────────
function RacingLine() {
  const pathRef = useRef(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!pathRef.current) return
    const length = pathRef.current.getTotalLength()
    pathRef.current.style.strokeDasharray = length
    pathRef.current.style.strokeDashoffset = drawn ? 0 : length
  }, [drawn])

  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', maxWidth: '1100px', maxHeight: '18vh', opacity: 0.18 }}
      aria-hidden="true"
    >
      {/* Abstract F1-style circuit layout */}
      <path
        ref={pathRef}
        d="
          M 60 200
          L 120 200
          Q 160 200 160 160
          L 160 100
          Q 160 60 200 60
          L 380 60
          Q 440 60 460 100
          L 480 140
          Q 500 180 540 180
          L 620 180
          Q 660 180 680 160
          L 700 120
          Q 720 80 760 80
          L 860 80
          Q 920 80 940 120
          L 960 160
          Q 980 200 1020 210
          L 1080 220
          Q 1140 230 1140 270
          L 1140 290
        "
        fill="none"
        stroke={COLORS.racingRed}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'stroke-dashoffset 3.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {/* Speed dots along the path */}
      {[160, 300, 460, 620, 760, 940, 1080].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={i % 2 === 0 ? 110 : 175}
          r="4"
          fill={COLORS.racingRed}
          style={{
            opacity: drawn ? 0.6 : 0,
            transition: `opacity 0.4s ease ${1.5 + i * 0.2}s`,
          }}
        />
      ))}
    </svg>
  )
}

// ─── Scrolling ticker ─────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    '1950 — SILVERSTONE',
    'FERRARI — 243 WINS',
    'MONACO — THE JEWEL',
    'SENNA VS PROST',
    'BRAWN GP — THE MIRACLE',
    '2023 — 21 FROM 22',
    'HAMILTON — 103 VICTORIES',
    'RED BULL — 4 STRAIGHT',
    '75 SEASONS',
    '867 DRIVERS',
    '1,150 RACES',
  ]
  const repeated = [...items, ...items]

  return (
    <div
      style={{
        borderTop: `1px solid ${COLORS.carbonBorder}`,
        borderBottom: `1px solid ${COLORS.carbonBorder}`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '10px 0',
        background: COLORS.carbonMid,
      }}
    >
      <div className="ticker-track">
        {repeated.map((item, i) => (
          <span key={i} className="ticker-item">
            {item}
            <span className="ticker-dot">●</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Hero component ──────────────────────────────────────────────────────
export default function Hero({ onScrollDown }) {
  const [started, setStarted]     = useState(false)
  const [titleVisible, setTitle]  = useState(false)
  const [subVisible, setSub]      = useState(false)

  useEffect(() => {
    // Stagger entrance animations
    const t1 = setTimeout(() => setTitle(true), 100)
    const t2 = setTimeout(() => setSub(true), 500)
    const t3 = setTimeout(() => setStarted(true), 800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <section
      id="hero"
      className="hero-section"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,0,45,0.12) 0%, transparent 60%),
          ${COLORS.carbon}
        `,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: 'clamp(60px, 8vh, 120px)',
        paddingBottom: 'clamp(20px, 4vh, 60px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid lines — subtle carbon fiber feel */}
      <div className="bg-grid" aria-hidden="true" />

      {/* Year badge */}
      <div
        className="year-badge"
        style={{
          opacity: titleVisible ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        <span>1950</span>
        <span className="year-dash">—</span>
        <span>2025</span>
      </div>

      {/* Main title */}
      <div className="hero-title-block">
        <h1
          className="hero-title"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s',
          }}
        >
          <span className="title-f1">F1</span>
          <span className="title-colon">:</span>
          <br />
          <span className="title-years">75 Years</span>
          <br />
          <span className="title-of">of Speed</span>
        </h1>

        <p
          className="hero-sub"
          style={{
            opacity: subVisible ? 1 : 0,
            transform: subVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          A data-driven story of dynasties, circuits, and the drivers
          <br className="hidden-mobile" /> who shaped the fastest sport on Earth.
        </p>
      </div>

      {/* Racing line SVG */}
      <div className="racing-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(5px, 2vh, 20px) 40px 0' }}>
        <RacingLine />
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {HERO_STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} started={started} />
        ))}
      </div>

      {/* Ticker */}
      <div style={{ marginTop: 'clamp(10px, 4vh, 40px)' }}>
        <Ticker />
      </div>

      {/* Scroll CTA */}
      <div
        className="scroll-cta"
        style={{
          opacity: started ? 1 : 0,
          transition: 'opacity 1s ease 2.5s',
        }}
      >
        <button
          onClick={onScrollDown}
          className="scroll-btn"
          aria-label="Begin the story"
        >
          <span>BEGIN THE STORY</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v14M4 13l6 6 6-6" stroke={COLORS.racingRed} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Red accent line — left edge */}
      <div className="red-edge-line" aria-hidden="true" />
    </section>
  )
}
