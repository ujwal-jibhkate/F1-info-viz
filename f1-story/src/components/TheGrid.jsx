import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useCSV } from '../hooks/useCSV'
import { COLORS, FONTS } from '../styles/theme'

const STREET_COLOR = '#ff6b35'
const PERMANENT_COLOR = '#4ecdc4'

// ─── Scatter + Density chart ─────────────────────────────────────────────────
function ScatterChart({ data, circuitFilter, yearRange, trackFilter }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [dims, setDims] = useState({ width: 700, height: 520 })

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: Math.max(w, 320), height: Math.max(Math.min(w * 0.75, 560), 320) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const filtered = useMemo(() => {
    return data.filter(d => {
      const ct = d['Circuit Type'] || ''
      const year = d['Year'] || 0
      const track = d['Race Name'] || ''
      if (circuitFilter !== 'both' && ct !== circuitFilter) return false
      if (year < yearRange[0] || year > yearRange[1]) return false
      if (trackFilter !== 'All' && track !== trackFilter) return false
      return d['Grid Position'] > 0 && d['Finish Position'] > 0
        && d['Grid Position'] <= 26 && d['Finish Position'] <= 26
    })
  }, [data, circuitFilter, yearRange, trackFilter])

  useEffect(() => {
    if (!filtered.length || !svgRef.current) return

    const margin = { top: 30, right: 30, bottom: 54, left: 56 }
    const W = dims.width - margin.left - margin.right
    const H = dims.height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear().domain([0, 24]).range([0, W]).nice()
    const yScale = d3.scaleLinear().domain([0, 26]).range([H, 0]).nice()

    // Grid
    g.selectAll('.grid-h')
      .data(yScale.ticks(6)).join('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', COLORS.carbonBorder).attr('stroke-dasharray', '2,4')

    g.selectAll('.grid-v')
      .data(xScale.ticks(6)).join('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', COLORS.carbonBorder).attr('stroke-dasharray', '2,4')

    // Perfect diagonal (grid = finish)
    g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(24)).attr('y2', yScale(24))
      .attr('stroke', COLORS.carbonBorder)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.5)

    g.append('text')
      .attr('x', xScale(22)).attr('y', yScale(20))
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.asphalt)
      .attr('font-size', '9px')
      .attr('font-family', FONTS.mono)
      .attr('transform', `rotate(-45, ${xScale(22)}, ${yScale(20)})`)
      .text('GRID = FINISH')

    // Scatter dots — sample max 3000 for perf
    const sample = filtered.length > 3000
      ? d3.shuffle([...filtered]).slice(0, 3000)
      : filtered

    const colorOf = d => d['Circuit Type'] === 'Street Circuit' ? STREET_COLOR : PERMANENT_COLOR

    g.selectAll('.dot')
      .data(sample)
      .join('circle')
      .attr('cx', d => xScale(d['Grid Position']))
      .attr('cy', d => yScale(d['Finish Position']))
      .attr('r', 3)
      .attr('fill', colorOf)
      .attr('fill-opacity', 0.25)
      .attr('stroke', colorOf)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.5)

    // Regression line per circuit type
    const drawRegression = (subset, color) => {
      if (subset.length < 10) return
      const xVals = subset.map(d => d['Grid Position'])
      const yVals = subset.map(d => d['Finish Position'])
      const n = xVals.length
      const xMean = d3.mean(xVals), yMean = d3.mean(yVals)
      const slope = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean)))
        / d3.sum(xVals.map(x => Math.pow(x - xMean, 2)))
      const intercept = yMean - slope * xMean
      const x1 = 1, x2 = 24
      const y1 = slope * x1 + intercept
      const y2 = slope * x2 + intercept

      g.append('line')
        .attr('x1', xScale(x1)).attr('y1', yScale(Math.max(1, Math.min(26, y1))))
        .attr('x2', xScale(x2)).attr('y2', yScale(Math.max(1, Math.min(26, y2))))
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-linecap', 'round')

      // Correlation label
      const corr = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean)))
        / Math.sqrt(
          d3.sum(xVals.map(x => Math.pow(x - xMean, 2))) *
          d3.sum(yVals.map(y => Math.pow(y - yMean, 2)))
        )
      g.append('text')
        .attr('x', xScale(x2) - 4)
        .attr('y', yScale(Math.max(1, Math.min(26, y2))) - 8)
        .attr('text-anchor', 'end')
        .attr('fill', color)
        .attr('font-size', '10px')
        .attr('font-family', FONTS.mono)
        .text(`r = ${corr.toFixed(3)}`)
    }

    if (circuitFilter === 'both' || circuitFilter === 'Street Circuit') {
      drawRegression(filtered.filter(d => d['Circuit Type'] === 'Street Circuit'), STREET_COLOR)
    }
    if (circuitFilter === 'both' || circuitFilter === 'Permanent Circuit') {
      drawRegression(filtered.filter(d => d['Circuit Type'] === 'Permanent Circuit'), PERMANENT_COLOR)
    }

    // Monaco 2024 highlight
    const monaco24 = filtered.filter(d => d.Year === 2024 && d['Race Name']?.includes('Monaco') && d['Grid Position'] === d['Finish Position'])
    if (monaco24.length > 0) {
      monaco24.forEach(d => {
        const x = xScale(d['Grid Position'])
        const y = yScale(d['Finish Position'])
        g.append('circle')
          .attr('cx', x).attr('cy', y)
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', COLORS.racingRed)
          .attr('stroke-width', 1.5)
      })

      // Label for Monaco 2024
      g.append('text')
        .attr('x', xScale(10) + 12)
        .attr('y', yScale(10) - 8)
        .attr('fill', COLORS.racingRed)
        .attr('font-size', '10px')
        .attr('font-family', FONTS.mono)
        .text('MONACO 2024')
    }

    // Tooltip
    const tooltip = d3.select('#grid-tooltip')
    const overlay = g.append('rect')
      .attr('width', W).attr('height', H).attr('fill', 'transparent')
      .style('cursor', 'crosshair')

    overlay.on('mousemove', function (event) {
      const [mx, my] = d3.pointer(event)
      const gx = Math.round(xScale.invert(mx))
      const fy = Math.round(yScale.invert(my))

      const nearby = filtered.find(d =>
        Math.abs(d['Grid Position'] - gx) <= 1 &&
        Math.abs(d['Finish Position'] - fy) <= 1
      )

      if (nearby) {
        const change = nearby['Finish Position'] - nearby['Grid Position']
        const changeStr = change === 0
          ? '→ Held position'
          : change > 0
            ? `▼ Dropped ${change}`
            : `▲ Gained ${Math.abs(change)}`

        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 14) + 'px')
          .style('top', (event.pageY - 40) + 'px')
          .html(`
            <div class="tooltip-title">${nearby['Race Name'] || ''} ${nearby['Year'] || ''}</div>
            <div style="font-size:14px;font-weight:500;margin:4px 0">${nearby['Driver'] || ''}</div>
            <div style="color:${colorOf(nearby)};font-size:11px;font-family:var(--font-mono)">
              P${nearby['Grid Position']} → P${nearby['Finish Position']}
            </div>
            <div style="color:${change <= 0 ? '#00ff87' : COLORS.racingRed};font-size:11px;margin-top:2px">
              ${changeStr}
            </div>
          `)
      } else {
        tooltip.style('opacity', 0)
      }
    })
    overlay.on('mouseleave', () => tooltip.style('opacity', 0))

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `P${d}`).tickSize(4))
      .call(ax => {
        ax.select('.domain').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick line').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick text').attr('fill', COLORS.steel).attr('font-family', FONTS.mono).attr('font-size', '10px').attr('dy', '1.4em')
      })

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => `P${d}`).tickSize(4))
      .call(ax => {
        ax.select('.domain').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick line').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick text').attr('fill', COLORS.steel).attr('font-family', FONTS.mono).attr('font-size', '10px')
      })

    // Axis labels
    g.append('text').attr('x', W / 2).attr('y', H + 44)
      .attr('text-anchor', 'middle').attr('fill', COLORS.steel)
      .attr('font-family', FONTS.mono).attr('font-size', '10px').attr('letter-spacing', 2)
      .text('GRID POSITION')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2).attr('y', -44)
      .attr('text-anchor', 'middle').attr('fill', COLORS.steel)
      .attr('font-family', FONTS.mono).attr('font-size', '10px').attr('letter-spacing', 2)
      .text('FINISH POSITION')

  }, [filtered, dims, trackFilter])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg ref={svgRef} width={dims.width} height={dims.height}
        style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  )
}

// ─── Main TheGrid component ───────────────────────────────────────────────────
export default function TheGrid() {
  const { data, loading } = useCSV('rq2_grid_finish_circuits.csv')
  const [circuitFilter, setCircuit] = useState('both')
  const [yearRange, setYearRange] = useState([2000, 2025])
  const [trackFilter, setTrackFilter] = useState('All')

  const uniqueTracks = useMemo(() => {
    if (!data.length) return []
    
    const raceCounts = new Map()
    const currentCalendarRaces = new Set()
    
    data.forEach(d => {
      const race = d['Race Name']
      const year = d['Year']
      if (!race) return
      
      if (!raceCounts.has(race)) {
        raceCounts.set(race, new Set())
      }
      raceCounts.get(race).add(year)
      
      if (year === 2024 || year === 2025) {
        currentCalendarRaces.add(race)
      }
    })
    
    const validTracks = []
    for (const [race, years] of raceCounts.entries()) {
      if (currentCalendarRaces.has(race) && years.size > 15) {
        validTracks.push(race)
      }
    }
    
    return validTracks.sort()
  }, [data])

  // Stats
  const stats = useMemo(() => {
    if (!data.length) return {}
    const street = data.filter(d => d['Circuit Type'] === 'Street Circuit' && d['Grid Position'] === 1)
    const perm = data.filter(d => d['Circuit Type'] === 'Permanent Circuit' && d['Grid Position'] === 1)
    const monaco = data.filter(d => d['Race Name']?.includes('Monaco') && d['Grid Position'] === 1)
    return {
      streetPole: ((street.filter(d => d['Finish Position'] === 1).length / street.length) * 100).toFixed(1),
      permPole: ((perm.filter(d => d['Finish Position'] === 1).length / perm.length) * 100).toFixed(1),
      monacoPole: ((monaco.filter(d => d['Finish Position'] === 1).length / monaco.length) * 100).toFixed(1),
      total: data.length,
    }
  }, [data])

  return (
    <section
      id="grid"
      style={{
        minHeight: '100vh',
        background: COLORS.carbon,
        padding: 'clamp(40px, 6vh, 80px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
      }}
    >
      <div id="grid-tooltip" className="d3-tooltip chart-tooltip"
        style={{ position: 'fixed', opacity: 0, zIndex: 999, pointerEvents: 'none', transition: 'opacity 0.15s' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-eyebrow">Chapter 02</div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>
          THE GRID
        </h2>
        <p className="section-body" style={{ marginBottom: '40px', lineHeight: '1.6', maxWidth: '100%', textAlign: 'justify' }}>
          Welcome to The Grid. This interactive scatter plot analyzes over 25,000 race records to measure how effectively a driver's starting qualifying position dictates their final race result. 
          The data is mapped by circuit type: <strong style={{ color: STREET_COLOR }}>Street Circuits (Orange)</strong> and <strong style={{ color: PERMANENT_COLOR }}>Permanent Circuits (Teal)</strong>. 
          A steep diagonal line signifies intense predictability, while a scattered cloud indicates venues where overtaking and race strategy can overcome a poor qualifying session. Use the toggles below to filter the data by specific tracks and eras to see how predictability has shifted!
        </p>

        {/* Key stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[
              { label: 'Pole → Win on Street Circuits', value: `${stats.streetPole}%`, color: STREET_COLOR },
              { label: 'Pole → Win on Permanent Circuits', value: `${stats.permPole}%`, color: PERMANENT_COLOR },
              { label: 'Pole → Win at Monaco Specifically', value: `${stats.monacoPole}%`, color: COLORS.racingRed },
              { label: 'Race Records Analysed', value: `${(stats.total || 0).toLocaleString()}`, color: COLORS.silver },
            ].map(s => (
              <div key={s.label} style={{
                flex: '1 1 180px',
                background: COLORS.carbonLight,
                border: `1px solid ${COLORS.carbonBorder}`,
                borderTop: `2px solid ${s.color}`,
                padding: '16px',
              }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 'clamp(22px,4vw,32px)', color: s.color, letterSpacing: '-1px' }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: '9px', color: COLORS.steel, letterSpacing: '1.5px', marginTop: '4px' }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-start' }}>
          {/* Circuit type toggle */}
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px', color: COLORS.steel, marginBottom: '8px' }}>
              CIRCUIT TYPE
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'both', label: 'BOTH', color: COLORS.silver },
                { key: 'Street Circuit', label: 'STREET', color: STREET_COLOR },
                { key: 'Permanent Circuit', label: 'PERMANENT', color: PERMANENT_COLOR },
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setCircuit(key)}
                  style={{
                    padding: '5px 14px',
                    fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '2px',
                    background: circuitFilter === key ? color : 'transparent',
                    color: circuitFilter === key ? COLORS.carbon : COLORS.steel,
                    border: `1px solid ${circuitFilter === key ? color : COLORS.carbonBorder}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px', color: COLORS.steel, marginBottom: '8px' }}>
              ERA: {yearRange[0]} – {yearRange[1]}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: '1994+', range: [1994, 2025] },
                { label: '2000s', range: [2000, 2009] },
                { label: '2010s', range: [2010, 2019] },
                { label: '2020+', range: [2020, 2025] },
                { label: 'ALL', range: [1950, 2025] },
              ].map(({ label, range }) => (
                <button key={label}
                  onClick={() => setYearRange(range)}
                  style={{
                    padding: '5px 14px',
                    fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '1.5px',
                    background: JSON.stringify(yearRange) === JSON.stringify(range) ? COLORS.racingRed : 'transparent',
                    color: JSON.stringify(yearRange) === JSON.stringify(range) ? 'white' : COLORS.steel,
                    border: `1px solid ${JSON.stringify(yearRange) === JSON.stringify(range) ? COLORS.racingRed : COLORS.carbonBorder}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Track filter */}
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px', color: COLORS.steel, marginBottom: '8px' }}>
              TRACK
            </div>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              style={{
                padding: '4px 10px',
                fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '1.5px',
                background: 'transparent',
                color: trackFilter === 'All' ? COLORS.steel : 'white',
                border: `1px solid ${COLORS.carbonBorder}`,
                cursor: 'pointer',
                outline: 'none',
                minWidth: '160px',
              }}
            >
              <option value="All" style={{ background: COLORS.carbonMid, color: 'white' }}>ALL TRACKS</option>
              {uniqueTracks.map(t => (
                <option key={t} value={t} style={{ background: COLORS.carbonMid, color: 'white' }}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          {[
            { color: STREET_COLOR, label: 'Street Circuit' },
            { color: PERMANENT_COLOR, label: 'Permanent Circuit' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.steel, letterSpacing: '1.5px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Chart */}
        {loading ? (
          <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.steel, fontFamily: FONTS.mono, fontSize: '12px', letterSpacing: '3px' }}>
            LOADING DATA...
          </div>
        ) : (
          <div style={{ background: COLORS.carbonMid, padding: '24px', border: `1px solid ${COLORS.carbonBorder}` }}>
            <ScatterChart
              data={data}
              circuitFilter={circuitFilter}
              yearRange={yearRange}
              trackFilter={trackFilter}
            />
          </div>
        )}

        {/* Monaco callout */}
        <div style={{
          marginTop: '24px',
          background: COLORS.carbonLight,
          border: `1px solid ${COLORS.carbonBorder}`,
          borderLeft: `3px solid ${COLORS.racingRed}`,
          padding: '16px 20px',
          fontFamily: FONTS.body,
          fontSize: '14px',
          color: COLORS.silver,
          lineHeight: 1.7,
        }}>
          <strong style={{ color: 'white', fontFamily: FONTS.mono, fontSize: '11px', letterSpacing: '2px' }}>
            MONACO 2024:
          </strong>{' '}
          The top 10 qualifiers finished in the exact same order they started. Zero overtakes. Not one position changed.
          Nelson Piquet once said racing there was like "riding a bicycle around your living room."
          The data agrees.
        </div>

        <p style={{ fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.asphalt, letterSpacing: '1.5px', marginTop: '16px' }}>
          HOVER ANY POINT TO SEE DRIVER + RACE DETAILS · DASHED LINE = PERFECT GRID:FINISH RATIO
        </p>
      </div>
    </section>
  )
}
