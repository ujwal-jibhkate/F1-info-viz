import { COLORS, FONTS } from '../styles/theme'

// Generic placeholder for screens not yet built
function ComingSoon({ screenNumber, title, description, icon }) {
  return (
    <section
      style={{
        minHeight: '100vh',
        background: screenNumber % 2 === 0 ? COLORS.carbon : COLORS.carbonMid,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Screen number */}
      <div style={{
        fontFamily: FONTS.mono,
        fontSize: '11px',
        letterSpacing: '4px',
        color: COLORS.racingRed,
        marginBottom: '24px',
        textTransform: 'uppercase',
      }}>
        Chapter {screenNumber}
      </div>

      {/* Icon */}
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>{icon}</div>

      {/* Title */}
      <h2 style={{
        fontFamily: FONTS.display,
        fontSize: 'clamp(36px, 6vw, 72px)',
        color: 'white',
        letterSpacing: '3px',
        textAlign: 'center',
        marginBottom: '16px',
        lineHeight: 1,
      }}>
        {title}
      </h2>

      {/* Description */}
      <p style={{
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: COLORS.silver,
        textAlign: 'center',
        maxWidth: '480px',
        lineHeight: 1.7,
        marginBottom: '40px',
      }}>
        {description}
      </p>

      {/* Coming soon badge */}
      <div style={{
        border: `1px solid ${COLORS.carbonBorder}`,
        padding: '8px 20px',
        fontFamily: FONTS.mono,
        fontSize: '11px',
        letterSpacing: '3px',
        color: COLORS.steel,
        textTransform: 'uppercase',
      }}>
        Visualization Loading — Session {screenNumber}
      </div>
    </section>
  )
}

export function Dynasty() {
  return (
    <ComingSoon
      screenNumber={2}
      title="CONSTRUCTOR DYNASTIES"
      description="How team empires rose, dominated, and collapsed across 75 years of racing history."
      icon="🏆"
    />
  )
}

export function TheGrid() {
  return (
    <ComingSoon
      screenNumber={3}
      title="THE GRID"
      description="Does qualifying predict the race? Street circuits vs permanent tracks — the data tells a surprising story."
      icon="🏁"
    />
  )
}

export function ChaosOrOrder() {
  return (
    <ComingSoon
      screenNumber={4}
      title="CHAOS OR ORDER"
      description="How much does starting position matter? The distribution of gains and losses reveals where racing is truly free."
      icon="📊"
    />
  )
}

export function Network() {
  return (
    <ComingSoon
      screenNumber={5}
      title="THE WEB OF AMBITION"
      description="867 drivers. 209 constructors. A network of loyalty, betrayal, and the relentless search for speed."
      icon="🕸️"
    />
  )
}

export function Conclusion() {
  return (
    <ComingSoon
      screenNumber={6}
      title="THE DATA NEVER LIES"
      description="Six facts from 75 years of racing that tell the whole story."
      icon="🏎️"
    />
  )
}
