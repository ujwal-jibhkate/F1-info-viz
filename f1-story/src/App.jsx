import NavBar from './components/NavBar'
import Hero from './components/Hero'
import Dynasty from './components/Dynasty'
import TheGrid from './components/TheGrid'
import ChaosOrOrder from './components/ChaosOrOrder'
import Network from './components/Network'
import Conclusion from './components/Conclusion'

export default function App() {
  const scrollToNext = () => {
    document.getElementById('dynasty')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <NavBar />

      <main>
        {/* Screen 1 — Hero */}
        <Hero onScrollDown={scrollToNext} />

        {/* Screen 2 — Constructor Dynasties */}
        <div id="dynasty">
          <Dynasty />
        </div>

        {/* Screen 3 — The Grid (Qualifying) */}
        <div id="grid">
          <TheGrid />
        </div>

        {/* Screen 4 — Chaos or Order (Violin) */}
        <div id="chaos">
          <ChaosOrOrder />
        </div>

        {/* Screen 5 — The Network */}
        <div id="network">
          <Network />
        </div>

        {/* Screen 6 — Conclusion */}
        <div id="conclusion">
          <Conclusion />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #2a2a2a',
          padding: '32px',
          textAlign: 'center',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '12px',
          color: '#444',
          letterSpacing: '1px',
        }}
      >
        <p>
          ILS-Z637 Information Visualization · Indiana University · SP26
        </p>
        <p style={{ marginTop: '6px' }}>
          Mohit Mahajan · Ujwal Jibhkate · Tushar Khatri
        </p>
        <p style={{ marginTop: '6px', color: '#2a2a2a' }}>
          Data: Ergast API · Kaggle F1 Dataset · formula1-datasets
        </p>
      </footer>
    </div>
  )
}
