import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { useCSV } from '../hooks/useCSV'
import { COLORS, FONTS, FAMOUS_JOURNEYS } from '../styles/theme'

const TEAM_COLOR   = COLORS.racingRed
const DRIVER_COLOR = '#cccccc'

// Top N drivers by total wins for default view
const TOP_N = 50

function buildGraph(data, filter) {
  if (!data.length) return { nodes: [], links: [] }

  // Aggregate wins per driver
  const driverWins = d3.rollup(data, v => d3.sum(v, d => d.Win || 0), d => d.Driver)
  const driverStarts = d3.rollup(data, v => v.length, d => d.Driver)

  let drivers
  if (filter.type === 'driver') {
    drivers = [filter.value]
    // Also add teammates (same teams, same years)
    const driverTeams = new Set(data.filter(d => d.Driver === filter.value).map(d => d.Constructor))
    const teammates = new Set()
    data.forEach(d => {
      if (driverTeams.has(d.Constructor)) teammates.add(d.Driver)
    })
    drivers = Array.from(new Set([...drivers, ...Array.from(teammates).slice(0, 30)]))
  } else if (filter.type === 'team') {
    drivers = Array.from(new Set(data.filter(d => d.Constructor === filter.value).map(d => d.Driver)))
  } else {
    // Default: top N by wins
    drivers = Array.from(driverWins.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([name]) => name)
  }

  const driverSet = new Set(drivers)
  const relevantData = data.filter(d => driverSet.has(d.Driver))

  // Teams involved
  const teams = Array.from(new Set(relevantData.map(d => d.Constructor)))

  // Build edges: driver-team pairs with season count + wins
  const edgeMap = d3.rollup(
    relevantData,
    v => ({ seasons: v.length, wins: d3.sum(v, d => d.Win || 0) }),
    d => d.Driver,
    d => d.Constructor
  )

  const nodes = [
    ...teams.map(t => ({
      id: `team::${t}`,
      label: t,
      type: 'team',
      size: 12,
    })),
    ...drivers.map(d => ({
      id: `driver::${d}`,
      label: d,
      type: 'driver',
      wins: driverWins.get(d) || 0,
      starts: driverStarts.get(d) || 0,
      size: Math.max(4, Math.min(16, 4 + Math.sqrt(driverWins.get(d) || 0) * 1.2)),
    })),
  ]

  const links = []
  edgeMap.forEach((teamMap, driver) => {
    teamMap.forEach(({ seasons, wins }, team) => {
      if (teams.includes(team)) {
        links.push({
          source: `driver::${driver}`,
          target: `team::${team}`,
          seasons,
          wins,
          width: Math.max(0.5, Math.min(4, 0.5 + seasons * 0.4)),
        })
      }
    })
  })

  return { nodes, links }
}

// ─── Force Network ────────────────────────────────────────────────────────────
function ForceNetwork({ data, filter, highlightDriver }) {
  const svgRef     = useRef(null)
  const wrapRef    = useRef(null)
  const simRef     = useRef(null)
  const [dims, setDims] = useState({ width: 800, height: 580 })
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: Math.max(w, 320), height: Math.max(w * 0.65, 400) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { nodes, links } = useMemo(() => buildGraph(data, filter), [data, filter])

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return

    const { width: W, height: H } = dims

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${W} ${H}`)

    // Zoom
    const zoomG = svg.append('g')
    svg.call(d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', e => zoomG.attr('transform', e.transform))
    )

    // Stop previous sim
    if (simRef.current) simRef.current.stop()

    const nodesCopy = nodes.map(n => ({ ...n }))
    const linksCopy = links.map(l => ({ ...l }))

    // Force simulation
    const sim = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id).distance(d => d.wins > 5 ? 60 : 90).strength(0.4))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'team' ? -300 : -80))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(d => d.size + 4))
      .alphaDecay(0.03)

    simRef.current = sim

    // Links
    const link = zoomG.append('g')
      .selectAll('line')
      .data(linksCopy)
      .join('line')
      .attr('stroke', d => d.wins > 0 ? `rgba(232,0,45,${Math.min(0.8, 0.15 + d.wins * 0.02)})` : 'rgba(255,255,255,0.08)')
      .attr('stroke-width', d => d.width)

    // Node groups
    const nodeG = zoomG.append('g')
      .selectAll('g')
      .data(nodesCopy)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Circles
    nodeG.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.type === 'team' ? TEAM_COLOR : DRIVER_COLOR)
      .attr('fill-opacity', d => d.type === 'team' ? 0.9 : 0.7)
      .attr('stroke', d => d.type === 'team' ? COLORS.redHot : COLORS.carbon)
      .attr('stroke-width', d => d.type === 'team' ? 1.5 : 0.5)

    // Labels for teams + top drivers
    nodeG.filter(d => d.type === 'team' || d.wins > 10)
      .append('text')
      .attr('dy', d => -d.size - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.type === 'team' ? TEAM_COLOR : 'white')
      .attr('font-size', d => d.type === 'team' ? '10px' : '9px')
      .attr('font-family', FONTS.mono)
      .attr('letter-spacing', '0.5px')
      .attr('pointer-events', 'none')
      .text(d => d.type === 'team'
        ? d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label
        : d.label.split(' ').slice(-1)[0]  // last name only
      )

    // Tooltip
    nodeG.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)

      setTooltip({
        x: event.clientX,
        y: event.clientY,
        data: d,
      })
    })
    .on('mousemove', function(event) {
      setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null)
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .attr('stroke', d.type === 'team' ? COLORS.redHot : COLORS.carbon)
        .attr('stroke-width', d.type === 'team' ? 1.5 : 0.5)
      setTooltip(null)
    })

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Highlight driver if set
    if (highlightDriver) {
      const driverId = `driver::${highlightDriver}`
      nodeG.select('circle')
        .attr('fill-opacity', d =>
          d.id === driverId ||
          linksCopy.some(l =>
            (l.source.id === driverId || l.target.id === driverId) &&
            (l.source.id === d.id || l.target.id === d.id)
          ) ? 1 : 0.15
        )
    }

    return () => sim.stop()
  }, [nodes, links, dims])

  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        style={{ display: 'block', width: '100%', height: 'auto', background: COLORS.carbon }}
      />
      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x + 14,
            top:  tooltip.y - 40,
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          <div className="tooltip-title">
            {tooltip.data.type === 'team' ? '🏎 CONSTRUCTOR' : '👤 DRIVER'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0' }}>
            {tooltip.data.label}
          </div>
          {tooltip.data.type === 'driver' && (
            <>
              <div style={{ fontFamily: FONTS.mono, fontSize: '11px', color: COLORS.racingRed }}>
                {tooltip.data.wins} career wins
              </div>
              <div style={{ fontSize: '11px', color: COLORS.steel, marginTop: '2px' }}>
                {tooltip.data.starts} seasons in dataset
              </div>
            </>
          )}
          {tooltip.data.type === 'team' && (
            <div style={{ fontFamily: FONTS.mono, fontSize: '11px', color: TEAM_COLOR, marginTop: '4px' }}>
              {links.filter(l =>
                l.source === tooltip.data.id || l.target === tooltip.data.id ||
                l.source?.id === tooltip.data.id || l.target?.id === tooltip.data.id
              ).length} drivers connected
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Search box ───────────────────────────────────────────────────────────────
function SearchBox({ data, onSelect }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)

  const allDrivers = useMemo(() => Array.from(new Set(data.map(d => d.Driver))).sort(), [data])
  const allTeams   = useMemo(() => Array.from(new Set(data.map(d => d.Constructor))).sort(), [data])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    const drivers = allDrivers.filter(d => d.toLowerCase().includes(q)).slice(0, 5).map(d => ({ type: 'driver', value: d }))
    const teams   = allTeams.filter(t => t.toLowerCase().includes(q)).slice(0, 4).map(t => ({ type: 'team',   value: t }))
    setResults([...drivers, ...teams])
    setOpen(true)
  }, [query, allDrivers, allTeams])

  return (
    <div style={{ position: 'relative', maxWidth: '320px' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder="Search driver or team..."
        style={{
          width: '100%',
          padding: '8px 14px',
          background: COLORS.carbonLight,
          border: `1px solid ${COLORS.carbonBorder}`,
          color: 'white',
          fontFamily: FONTS.body,
          fontSize: '13px',
          outline: 'none',
          borderRadius: 0,
        }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0, right: 0,
          background: COLORS.carbonLight,
          border: `1px solid ${COLORS.carbonBorder}`,
          zIndex: 200,
        }}>
          {results.map(r => (
            <button
              key={`${r.type}-${r.value}`}
              onClick={() => { onSelect(r); setQuery(r.value); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${COLORS.carbonBorder}`,
                color: COLORS.silver,
                fontFamily: FONTS.body,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.carbon}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '1px',
                color: r.type === 'team' ? TEAM_COLOR : COLORS.steel,
                minWidth: '40px',
              }}>
                {r.type.toUpperCase()}
              </span>
              {r.value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Network component ───────────────────────────────────────────────────
export default function Network() {
  const { data, loading } = useCSV('rq3_driver_transfers.csv')
  const [filter, setFilter]         = useState({ type: 'default' })
  const [highlightDriver, setHighlight] = useState(null)

  const handleSearch = useCallback((result) => {
    setFilter({ type: result.type, value: result.value })
    if (result.type === 'driver') setHighlight(result.value)
    else setHighlight(null)
  }, [])

  const handleJourney = useCallback((journey) => {
    setFilter({ type: 'driver', value: journey.driver })
    setHighlight(journey.driver)
  }, [])

  const resetFilter = () => {
    setFilter({ type: 'default' })
    setHighlight(null)
  }

  const networkStats = useMemo(() => {
    if (!data.length) return {}
    return {
      drivers:      new Set(data.map(d => d.Driver)).size,
      constructors: new Set(data.map(d => d.Constructor)).size,
      edges:        data.length,
      topPair:      (() => {
        const pairs = d3.rollup(data, v => d3.sum(v, d => d.Win || 0), d => `${d.Driver} @ ${d.Constructor}`)
        return Array.from(pairs.entries()).sort((a,b) => b[1]-a[1])[0]
      })(),
    }
  }, [data])

  return (
    <section
      id="network"
      style={{
        minHeight: '100vh',
        background: COLORS.carbon,
        padding: 'clamp(40px, 6vh, 80px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-eyebrow">Chapter 03</div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>
          THE WEB OF<br />AMBITION
        </h2>
        <p className="section-body" style={{ marginBottom: '32px' }}>
          {networkStats.drivers} drivers. {networkStats.constructors} constructors. Every edge is a season spent together.
          Node size reflects career wins. Search any driver or team to trace their story through the network.
        </p>

        {/* Stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {[
              { label: 'Total Drivers', value: networkStats.drivers },
              { label: 'Total Constructors', value: networkStats.constructors },
              { label: 'Driver-Season Pairings', value: networkStats.edges?.toLocaleString() },
              { label: 'Most Wins Together', value: networkStats.topPair?.[0]?.split(' @ ')[0], sub: `${networkStats.topPair?.[1]} wins` },
            ].map(s => (
              <div key={s.label} style={{
                flex: '1 1 160px',
                background: COLORS.carbonLight,
                border: `1px solid ${COLORS.carbonBorder}`,
                borderTop: `2px solid ${COLORS.racingRed}`,
                padding: '14px 16px',
              }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 'clamp(18px,3vw,28px)', color: 'white', letterSpacing: '-0.5px' }}>
                  {s.value}
                </div>
                {s.sub && <div style={{ fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.racingRed, marginTop: '2px' }}>{s.sub}</div>}
                <div style={{ fontFamily: FONTS.mono, fontSize: '9px', color: COLORS.steel, letterSpacing: '1.5px', marginTop: '4px' }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Famous journeys presets */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px', color: COLORS.steel, marginBottom: '10px' }}>
            FAMOUS JOURNEYS
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FAMOUS_JOURNEYS.map(j => (
              <button
                key={j.id}
                onClick={() => handleJourney(j)}
                style={{
                  padding: '6px 16px',
                  fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '1.5px',
                  background: filter.value === j.driver ? j.color : 'transparent',
                  color:      filter.value === j.driver ? COLORS.carbon : COLORS.silver,
                  border:     `1px solid ${filter.value === j.driver ? j.color : COLORS.carbonBorder}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {j.label.toUpperCase()}: {j.driver.split(' ').slice(-1)[0].toUpperCase()}
              </button>
            ))}
            <button
              onClick={resetFilter}
              style={{
                padding: '6px 16px',
                fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '1.5px',
                background: filter.type === 'default' ? COLORS.racingRed : 'transparent',
                color:      filter.type === 'default' ? 'white' : COLORS.steel,
                border:     `1px solid ${filter.type === 'default' ? COLORS.racingRed : COLORS.carbonBorder}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              TOP 50 LEGENDS
            </button>
          </div>
        </div>

        {/* Search + active filter info */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          {!loading && (
            <SearchBox data={data} onSelect={handleSearch} />
          )}
          {filter.type !== 'default' && (
            <div style={{
              padding: '6px 14px',
              background: COLORS.carbonLight,
              border: `1px solid ${COLORS.carbonBorder}`,
              fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.silver, letterSpacing: '1.5px',
            }}>
              SHOWING: <span style={{ color: COLORS.racingRed }}>{filter.value}</span>
              <button onClick={resetFilter} style={{ marginLeft: '12px', background: 'none', border: 'none', color: COLORS.steel, cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </div>
          )}
        </div>

        {/* Network */}
        {loading ? (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.steel, fontFamily: FONTS.mono, fontSize: '12px', letterSpacing: '3px' }}>
            LOADING DATA...
          </div>
        ) : (
          <div style={{ border: `1px solid ${COLORS.carbonBorder}` }}>
            <ForceNetwork data={data} filter={filter} highlightDriver={highlightDriver} />
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { color: TEAM_COLOR,   label: 'Constructor node — size fixed' },
            { color: DRIVER_COLOR, label: 'Driver node — size = career wins' },
            { color: 'rgba(232,0,45,0.6)', label: 'Edge thickness = seasons together, brightness = wins' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: FONTS.mono, fontSize: '9px', color: COLORS.steel, letterSpacing: '1px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              {label.toUpperCase()}
            </div>
          ))}
        </div>

        <p style={{ fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.asphalt, letterSpacing: '1.5px', marginTop: '12px' }}>
          DRAG NODES TO REARRANGE · SCROLL TO ZOOM · HOVER FOR DETAILS · DEFAULT VIEW = TOP 50 DRIVERS BY CAREER WINS
        </p>
      </div>
    </section>
  )
}
