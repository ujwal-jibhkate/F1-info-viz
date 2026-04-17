import { useState, useEffect, useRef } from 'react'
import { COLORS, FONTS } from '../styles/theme'

const STAT_CARDS = [
  {
    stat:    '93.8%',
    label:   'McLaren, 1988',
    front:   'Most Dominant Single Season',
    back:    'Senna and Prost between them won 15 of 16 races. Only Monza escaped them — after they collided with each other.',
    color:   COLORS.constructors?.McLaren || '#ff8000',
  },
  {
    stat:    '25%',
    label:   'F1, 1982',
    front:   'Most Chaotic Season Ever',
    back:    'Eleven different race winners in sixteen races. No team won more than a quarter of the season. Pure anarchy.',
    color:   '#4ecdc4',
  },
  {
    stat:    '8',
    label:   'Mercedes, 2014–2021',
    front:   'Consecutive Constructors\' Titles',
    back:    'The longest dynasty in modern Formula 1. Built from the ashes of a team Honda abandoned for £1 in 2008.',
    color:   COLORS.constructors?.Mercedes || '#00d2be',
  },
  {
    stat:    '1',
    label:   'Brawn GP, 2009',
    front:   'Seasons Raced. Zero Defeats.',
    back:    'The only team in F1 history to enter the championship once and win it. They were unbeaten forever. Then they became Mercedes.',
    color:   '#f5f5f5',
  },
  {
    stat:    '47%',
    label:   'Street Circuits',
    front:   'Pole-to-Win Rate on Streets',
    back:    'On street circuits, qualifying practically writes the result. At Monaco 2024 the top 10 in qualifying were the top 10 at the flag.',
    color:   '#ff6b35',
  },
  {
    stat:    '103',
    label:   'Lewis Hamilton',
    front:   'Career Race Victories',
    back:    '73 of those came with Mercedes. Then, in 2025, he put on red for the first time. Some edges in the network never fully break.',
    color:   COLORS.constructors?.Ferrari || '#dc0000',
  },
]

function StatCard({ card, index }) {
  const [flipped, setFlipped] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        flex: '1 1 280px',
        height: '220px',
        perspective: '1000px',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
        cursor: 'pointer',
      }}
      onClick={() => setFlipped(f => !f)}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          background: COLORS.carbonLight,
          border: `1px solid ${COLORS.carbonBorder}`,
          borderTop: `3px solid ${card.color}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: 'clamp(36px, 6vw, 56px)',
              color: card.color,
              lineHeight: 1,
              letterSpacing: '-1px',
            }}>
              {card.stat}
            </div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: '10px',
              color: COLORS.steel,
              letterSpacing: '2px',
              marginTop: '6px',
            }}>
              {card.label.toUpperCase()}
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: FONTS.body,
              fontSize: '15px',
              color: 'white',
              fontWeight: 500,
              lineHeight: 1.3,
              marginBottom: '12px',
            }}>
              {card.front}
            </div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: '9px',
              color: COLORS.asphalt,
              letterSpacing: '1.5px',
            }}>
              TAP TO REVEAL →
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: COLORS.carbon,
          border: `1px solid ${card.color}`,
          borderLeft: `3px solid ${card.color}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: FONTS.body,
            fontSize: '14px',
            color: COLORS.silver,
            lineHeight: 1.75,
          }}>
            {card.back}
          </div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize: '9px',
            color: COLORS.asphalt,
            letterSpacing: '1.5px',
            marginTop: '16px',
          }}>
            ← TAP TO FLIP BACK
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Conclusion() {
  const [titleVisible, setTitle] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTitle(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="conclusion"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 110%, rgba(232,0,45,0.1) 0%, transparent 60%),
          ${COLORS.carbonMid}
        `,
        padding: 'clamp(40px, 6vh, 80px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
        position: 'relative',
      }}
    >
      <div ref={ref} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-eyebrow">The Finale</div>
        <h2
          className="section-title"
          style={{
            marginBottom: '16px',
            opacity:    titleVisible ? 1 : 0,
            transform:  titleVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          THE DATA<br />NEVER LIES
        </h2>
        <p
          className="section-body"
          style={{
            marginBottom: '56px',
            opacity:    titleVisible ? 1 : 0,
            transition: 'opacity 0.8s ease 0.3s',
          }}
        >
          75 seasons. Six facts. The whole story in numbers.
          Tap each card to reveal what's behind the stat.
        </p>

        {/* Flip cards grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '80px' }}>
          {STAT_CARDS.map((card, i) => (
            <StatCard key={card.label} card={card} index={i} />
          ))}
        </div>

        {/* Closing quote */}
        <div style={{
          borderLeft: `3px solid ${COLORS.racingRed}`,
          paddingLeft: '32px',
          maxWidth: '680px',
          margin: '0 auto 64px',
        }}>
          <p style={{
            fontFamily: FONTS.display,
            fontSize: 'clamp(20px, 3.5vw, 32px)',
            color: 'white',
            lineHeight: 1.3,
            letterSpacing: '1px',
          }}>
            F1 IS A SPORT OF DYNASTIES INTERRUPTED BY REVOLUTION. EVERY ERA OF DOMINANCE ENDS THE SAME WAY.
          </p>
          <p style={{
            fontFamily: FONTS.body,
            fontSize: '14px',
            color: COLORS.steel,
            marginTop: '16px',
            fontStyle: 'italic',
          }}>
            A regulation change. A bankrupt engine supplier. Or a prodigy in a car nobody believed in.
          </p>
        </div>

        {/* Red line end mark */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', paddingBottom: '40px' }}>
          <div style={{ height: '1px', flex: 1, background: COLORS.carbonBorder }} />
          <div style={{
            width: '40px', height: '40px',
            border: `2px solid ${COLORS.racingRed}`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONTS.mono, fontSize: '16px', color: COLORS.racingRed,
          }}>
            🏁
          </div>
          <div style={{ height: '1px', flex: 1, background: COLORS.carbonBorder }} />
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: FONTS.mono,
          fontSize: '10px',
          color: COLORS.asphalt,
          letterSpacing: '2px',
        }}>
          ILS-Z637 INFORMATION VISUALIZATION · INDIANA UNIVERSITY · SP26 ·
          MOHIT MAHAJAN · UJWAL JIBHKATE · TUSHAR KHATRI
        </p>
      </div>
    </section>
  )
}
