import { useState, useEffect } from 'react'
import { COLORS, FONTS } from '../styles/theme'

const NAV_ITEMS = [
  { id: 'hero',       label: 'Start' },
  { id: 'dynasty',    label: 'Dynasties' },
  { id: 'grid',       label: 'The Grid' },
  { id: 'network',    label: 'Network' },
  { id: 'conclusion', label: 'Finale' },
]

export default function NavBar() {
  const [scrolled, setScrolled]   = useState(false)
  const [active, setActive]       = useState('hero')
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)

      // Update active section based on scroll position
      const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean)
      const current = sections.reduce((acc, el) => {
        return el.getBoundingClientRect().top < window.innerHeight * 0.4 ? el : acc
      }, sections[0])
      if (current) setActive(current.id)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled
          ? 'rgba(10, 10, 10, 0.95)'
          : 'transparent',
        borderBottom: scrolled
          ? `1px solid ${COLORS.carbonBorder}`
          : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => scrollTo('hero')}
        style={{
          fontFamily: FONTS.display,
          fontSize: '20px',
          color: 'white',
          letterSpacing: '3px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: COLORS.racingRed }}>F1</span>
        <span style={{ color: COLORS.carbonBorder, fontWeight: 300 }}>|</span>
        <span style={{ fontSize: '13px', letterSpacing: '2px', color: COLORS.silver }}>
          75 YEARS
        </span>
      </button>

      {/* Desktop nav links */}
      <div
        className="nav-links"
        style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            style={{
              fontFamily: FONTS.body,
              fontSize: '12px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '6px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active === item.id ? COLORS.racingRed : COLORS.silver,
              borderBottom: active === item.id
                ? `2px solid ${COLORS.racingRed}`
                : '2px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          fontSize: '20px',
        }}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            background: 'rgba(10,10,10,0.98)',
            borderBottom: `1px solid ${COLORS.carbonBorder}`,
            padding: '16px 0',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 32px',
                fontFamily: FONTS.body,
                fontSize: '14px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active === item.id ? COLORS.racingRed : COLORS.silver,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
