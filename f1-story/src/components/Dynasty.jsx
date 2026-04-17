import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useCSV } from '../hooks/useCSV'
import { COLORS, FONTS, ERAS } from '../styles/theme'

// Constructor colors — extended palette
const CONSTRUCTOR_COLORS = {
  'Ferrari': '#dc0000',
  'McLaren': '#ff8000',
  'Mercedes': '#00d2be',
  'Red Bull': '#3671c6',
  'Williams': '#005aff',
  'Renault': '#fff500',
  'Benetton': '#00a651',
  'Team Lotus': '#b5985a',
  'Lotus-Climax': '#c8a96e',
  'Lotus-Ford': '#d4b87a',
  'Sauber': '#9b0000',
  'Force India': '#f596c8',
  'Brawn': '#f5f5f5',
  'Brabham': '#aaaaaa',
  'Tyrrell': '#006ef5',
  'BRM': '#006400',
  'Maserati': '#c0392b',
  'Vanwall': '#005f3c',
  'Cooper-Climax': '#4a90d9',
  'Alfa Romeo': '#960000',
  'Matra-Ford': '#002395',
  'Brabham-Repco': '#888888',
  'Aston Martin': '#006f62',
  'Haas': '#ffffff',
  'AlphaTauri': '#2b4562',
  'Alpine': '#0090ff',
  'Lotus F1': '#e5c158',
}

const getColor = (name) => {
  if (CONSTRUCTOR_COLORS[name]) return CONSTRUCTOR_COLORS[name]
  // Deterministic fallback color from name hash
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`
}

// Top constructors by total wins to show in stacked area
const TOP_CONSTRUCTORS = [
  'Ferrari', 'Williams', 'McLaren', 'Red Bull', 'Mercedes', 'Renault'
]

// ─── Era annotation band ─────────────────────────────────────────────────────
function EraLabel({ era, xScale, height, svgWidth }) {
  const x1 = xScale(era.start)
  const x2 = xScale(Math.min(era.end, 2025))
  const midX = (x1 + x2) / 2
  if (x2 - x1 < 20) return null
  return (
    <g>
      <line x1={x1} x2={x1} y1={0} y2={height}
        stroke={COLORS.carbonBorder} strokeWidth={1} strokeDasharray="3,3" />
      <text x={midX} y={14} textAnchor="middle"
        fill={COLORS.steel} fontSize={9} fontFamily={FONTS.mono}
        letterSpacing={1} style={{ userSelect: 'none' }}>
        {era.label.toUpperCase()}
      </text>
    </g>
  )
}

// ─── Stacked Area Chart ───────────────────────────────────────────────────────
function StackedAreaChart({ data, selectedConstructors, onHover, hoveredYear }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [dims, setDims] = useState({ width: 800, height: 420 })

  const margin = { top: 30, right: 20, bottom: 48, left: 52 }
  const W = dims.width - margin.left - margin.right
  const H = dims.height - margin.top - margin.bottom

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: Math.max(w, 320), height: Math.max(w * 0.45, 280) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Process data: pivot to wide format per year
  const { yearData, keys } = useMemo(() => {
    if (!data.length) return { yearData: [], keys: [] }

    const keys = selectedConstructors.length ? selectedConstructors : TOP_CONSTRUCTORS

    const getMappedConstructor = (name) => (name === 'Alpine' || name === 'Lotus F1') ? 'Renault' : name;

    // Group by year, sum points per constructor
    const byYear = d3.rollup(
      data.filter(d => keys.includes(getMappedConstructor(d.Constructor)) && d.Year >= 1950 && d.Year <= 2025),
      v => d3.sum(v, d => d.Points || 0),
      d => d.Year,
      d => getMappedConstructor(d.Constructor)
    )

    const years = Array.from(byYear.keys()).sort(d3.ascending)
    const yearData = years.map(year => {
      const row = { year }
      keys.forEach(k => { row[k] = byYear.get(year)?.get(k) || 0 })
      return row
    })

    return { yearData, keys }
  }, [data, selectedConstructors])

  useEffect(() => {
    if (!yearData.length || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const defs = svg.append('defs')
    const splitPosLotusStart = ((2011.5 - 1950) / (2025 - 1950)) * 100
    const splitPosLotusEnd = ((2015.5 - 1950) / (2025 - 1950)) * 100
    const splitPosAlpine = ((2020.5 - 1950) / (2025 - 1950)) * 100

    const grad = defs.append('linearGradient')
      .attr('id', 'renault-alpine-grad')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', W).attr('y2', 0)

    grad.append('stop')
      .attr('offset', `${splitPosLotusStart}%`)
      .attr('stop-color', getColor('Renault'))
    grad.append('stop')
      .attr('offset', `${splitPosLotusStart}%`)
      .attr('stop-color', getColor('Lotus F1'))
    grad.append('stop')
      .attr('offset', `${splitPosLotusEnd}%`)
      .attr('stop-color', getColor('Lotus F1'))
    grad.append('stop')
      .attr('offset', `${splitPosLotusEnd}%`)
      .attr('stop-color', getColor('Renault'))
    grad.append('stop')
      .attr('offset', `${splitPosAlpine}%`)
      .attr('stop-color', getColor('Renault'))
    grad.append('stop')
      .attr('offset', `${splitPosAlpine}%`)
      .attr('stop-color', '#f596c8') // Alpine Pink

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleLinear()
      .domain([1950, 2025])
      .range([0, W])

    const stack = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone)
    const series = stack(yearData)

    const yMax = d3.max(series, s => d3.max(s, d => d[1])) || 1
    const yScale = d3.scaleLinear().domain([0, yMax]).range([H, 0]).nice()

    const area = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5))

    // Era bands (background)
    ERAS.forEach(era => {
      const x1 = xScale(Math.max(era.start, 1950))
      const x2 = xScale(Math.min(era.end, 2025))
      g.append('rect')
        .attr('x', x1).attr('y', 0)
        .attr('width', Math.max(0, x2 - x1))
        .attr('height', H)
        .attr('fill', 'rgba(255,255,255,0.015)')
        .attr('stroke', 'none')
    })

    // Draw stacked areas
    series.forEach((s, i) => {
      const name = keys[i]
      let color = getColor(name)
      if (name === 'Renault') {
        color = 'url(#renault-alpine-grad)'
      }

      g.append('path')
        .datum(s)
        .attr('class', `area-${name.replace(/\s/g, '-')}`)
        .attr('fill', color)
        .attr('fill-opacity', 0.82)
        .attr('stroke', COLORS.carbon)
        .attr('stroke-width', 0.5)
        .attr('d', area)
        .style('cursor', 'crosshair')
        .on('mouseenter', () => {
          d3.select(svgRef.current).selectAll('path[class^="area-"]')
            .attr('fill-opacity', 0.25)
          d3.select(svgRef.current).select(`.area-${name.replace(/\s/g, '-')}`)
            .attr('fill-opacity', 1)
        })
        .on('mouseleave', () => {
          d3.select(svgRef.current).selectAll('path[class^="area-"]')
            .attr('fill-opacity', 0.82)
        })

      // Animate in
      const path = g.select(`.area-${name.replace(/\s/g, '-')}`)
      const totalLength = path.node()?.getTotalLength?.() || 2000
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition().duration(1800).delay(i * 120).ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', function () {
          d3.select(this).attr('stroke-dasharray', null).attr('stroke-dashoffset', null)
        })
    })

    // Era labels
    ERAS.forEach((era, i) => {
      EraLabelD3(g, era, xScale, H, i)
    })

    // Hover line
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', COLORS.racingRed)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0)
      .attr('pointer-events', 'none')

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'))
      .ticks(15)
      .tickSize(-H)

    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(xAxis)
      .call(ax => {
        ax.select('.domain').remove()
        ax.selectAll('.tick line')
          .attr('stroke', COLORS.carbonBorder)
          .attr('stroke-dasharray', '2,4')
        ax.selectAll('.tick text')
          .attr('fill', COLORS.steel)
          .attr('font-family', FONTS.mono)
          .attr('font-size', '10px')
          .attr('dy', '1.2em')
      })

    const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-W)
    g.append('g')
      .call(yAxis)
      .call(ax => {
        ax.select('.domain').remove()
        ax.selectAll('.tick line')
          .attr('stroke', COLORS.carbonBorder)
          .attr('stroke-dasharray', '2,4')
        ax.selectAll('.tick text')
          .attr('fill', COLORS.steel)
          .attr('font-family', FONTS.mono)
          .attr('font-size', '10px')
      })

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2).attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.steel)
      .attr('font-family', FONTS.mono)
      .attr('font-size', '10px')
      .attr('letter-spacing', '2')
      .text('CONSTRUCTOR POINTS')

    // Invisible hover overlay
    g.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event)
        const year = Math.round(xScale.invert(mx))
        hoverLine.attr('x1', xScale(year)).attr('x2', xScale(year)).attr('opacity', 1)
        onHover(year)
      })
      .on('mouseleave', () => {
        hoverLine.attr('opacity', 0)
        onHover(null)
      })

  }, [yearData, keys, dims])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  )
}

// D3 era label helper (imperative)
function EraLabelD3(g, era, xScale, H, index = 0) {
  const x1 = xScale(Math.max(era.start, 1950))
  const x2 = xScale(Math.min(era.end + 1, 2025))
  const midX = (x1 + x2) / 2
  if (x2 - x1 < 10) return

  g.append('line')
    .attr('x1', x1).attr('x2', x1)
    .attr('y1', 0).attr('y2', H)
    .attr('stroke', COLORS.carbonBorder)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,4')

  const yPos = 12 + (index % 2 === 0 ? 0 : 14);
  const isLast = index === ERAS.length - 1;

  g.append('text')
    .attr('x', isLast ? x2 : midX)
    .attr('y', yPos)
    .attr('text-anchor', isLast ? 'end' : 'middle')
    .attr('fill', COLORS.steel)
    .attr('font-size', '8px')
    .attr('font-family', FONTS.mono)
    .attr('letter-spacing', 1)
    .text(era.label.toUpperCase())
}

// ─── Dominance Lollipop ───────────────────────────────────────────────────────
function DominanceLollipop({ data }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [dims, setDims] = useState({ width: 800, height: 500 })
  const [filter, setFilter] = useState('all') // 'all' | 'dominant' | 'chaotic'

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: Math.max(w, 320), height: Math.max(w * 0.6, 360) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const dominanceData = useMemo(() => {
    if (!data.length) return []
    const byYear = d3.rollup(data, v => ({
      total: d3.sum(v, d => d.Win || 0),
      max: d3.max(v, d => d.Win || 0),
      top: v.sort((a, b) => (b.Win || 0) - (a.Win || 0))[0]?.Constructor || '',
    }), d => d.Year)

    return Array.from(byYear.entries())
      .filter(([y]) => y >= 1950 && y <= 2025)
      .map(([year, { total, max, top }]) => ({
        year,
        pct: total > 0 ? Math.round((max / total) * 100) : 0,
        team: top,
      }))
      .sort((a, b) => a.year - b.year)
  }, [data])

  const filtered = useMemo(() => {
    if (filter === 'dominant') return [...dominanceData].sort((a, b) => b.pct - a.pct).slice(0, 20)
    if (filter === 'chaotic') return [...dominanceData].sort((a, b) => a.pct - b.pct).slice(0, 20)
    return dominanceData
  }, [dominanceData, filter])

  useEffect(() => {
    if (!filtered.length || !svgRef.current) return

    const margin = { top: 20, right: 20, bottom: 48, left: 52 }
    const W = dims.width - margin.left - margin.right
    const H = dims.height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleBand()
      .domain(filtered.map(d => d.year))
      .range([0, W])
      .padding(0.3)

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([H, 0])

    // Color scale: green (chaotic) → red (dominant)
    const colorScale = d3.scaleLinear()
      .domain([25, 55, 95])
      .range(['#4ecdc4', '#888888', COLORS.racingRed])

    // Grid lines
    g.selectAll('.grid-line')
      .data([25, 50, 75, 100])
      .join('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', COLORS.carbonBorder)
      .attr('stroke-dasharray', '2,4')

    // Stems
    g.selectAll('.stem')
      .data(filtered)
      .join('line')
      .attr('x1', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('x2', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('y1', H)
      .attr('y2', d => yScale(d.pct))
      .attr('stroke', d => colorScale(d.pct))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7)
      .transition().duration(800)
      .delay((_, i) => i * 12)

    // Circles
    const circles = g.selectAll('.dot')
      .data(filtered)
      .join('circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', H)
      .attr('r', 5)
      .attr('fill', d => colorScale(d.pct))
      .attr('stroke', COLORS.carbon)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')

    circles.transition().duration(800).delay((_, i) => i * 12)
      .attr('cy', d => yScale(d.pct))

    // Tooltip
    const tooltip = d3.select('#dynasty-tooltip')

    circles
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', 8).attr('stroke', 'white').attr('stroke-width', 1.5)
        tooltip
          .style('opacity', 1)
          .html(`
            <div class="tooltip-title">${d.year}</div>
            <div style="margin-top:4px;font-size:14px;font-weight:500">${d.team}</div>
            <div style="margin-top:2px;color:${colorScale(d.pct)};font-family:var(--font-mono);font-size:13px">
              ${d.pct}% of wins
            </div>
          `)
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', (event.clientX + 14) + 'px')
          .style('top', (event.clientY - 32) + 'px')
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', 5).attr('stroke', COLORS.carbon).attr('stroke-width', 1)
        tooltip.style('opacity', 0)
      })

    // Axes
    const xTicks = filter === 'all'
      ? filtered.filter(d => d.year % 5 === 0).map(d => d.year)
      : filtered.map(d => d.year)

    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).tickValues(xTicks).tickSize(4))
      .call(ax => {
        ax.select('.domain').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick line').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick text')
          .attr('fill', COLORS.steel)
          .attr('font-family', FONTS.mono)
          .attr('font-size', '10px')
          .attr('dy', '1.4em')
      })

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4).tickFormat(d => d + '%').tickSize(-W))
      .call(ax => {
        ax.select('.domain').remove()
        ax.selectAll('.tick line').attr('stroke', COLORS.carbonBorder).attr('stroke-dasharray', '2,4')
        ax.selectAll('.tick text').attr('fill', COLORS.steel).attr('font-family', FONTS.mono).attr('font-size', '10px')
      })

    // 50% reference line label
    g.append('text')
      .attr('x', W - 4).attr('y', yScale(50) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.steel)
      .attr('font-size', '9px')
      .attr('font-family', FONTS.mono)
      .text('50% THRESHOLD')

  }, [filtered, dims])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'ALL SEASONS' },
          { key: 'dominant', label: 'MOST DOMINANT' },
          { key: 'chaotic', label: 'MOST COMPETITIVE' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 16px',
              fontFamily: FONTS.mono,
              fontSize: '10px',
              letterSpacing: '2px',
              background: filter === key ? COLORS.racingRed : 'transparent',
              color: filter === key ? 'white' : COLORS.steel,
              border: `1px solid ${filter === key ? COLORS.racingRed : COLORS.carbonBorder}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  )
}

// ─── Hover tooltip panel ──────────────────────────────────────────────────────
function YearPanel({ year, data }) {
  const yearData = useMemo(() => {
    if (!year || !data.length) return []
    return data
      .filter(d => d.Year === year && (d.Win || 0) > 0)
      .sort((a, b) => (b.Win || 0) - (a.Win || 0))
      .slice(0, 5)
  }, [year, data])

  if (!year || !yearData.length) return null

  return (
    <div style={{
      background: COLORS.carbonLight,
      border: `1px solid ${COLORS.carbonBorder}`,
      borderLeft: `3px solid ${COLORS.racingRed}`,
      padding: '16px 20px',
      minWidth: '200px',
      fontFamily: FONTS.body,
    }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: '11px', letterSpacing: '3px', color: COLORS.racingRed, marginBottom: '12px' }}>
        {year}
      </div>
      {yearData.map(d => (
        <div key={d.Constructor} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '24px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.silver }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getColor(d.Constructor), display: 'inline-block' }} />
            {d.Constructor}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: '12px', color: 'white' }}>
            {d.Win}W
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Constructor toggle legend ────────────────────────────────────────────────
function ConstructorLegend({ selected, onChange }) {
  const all = TOP_CONSTRUCTORS
  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name))
    } else {
      onChange([...selected, name])
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
      <button
        onClick={() => onChange([])}
        style={{
          padding: '4px 12px',
          fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px',
          background: selected.length === 0 ? COLORS.racingRed : 'transparent',
          color: selected.length === 0 ? 'white' : COLORS.steel,
          border: `1px solid ${selected.length === 0 ? COLORS.racingRed : COLORS.carbonBorder}`,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        ALL
      </button>
      {all.map(name => (
        <button
          key={name}
          onClick={() => toggle(name)}
          style={{
            padding: '4px 12px',
            fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px',
            background: selected.includes(name) ? getColor(name) : 'transparent',
            color: selected.includes(name) ? COLORS.carbon : COLORS.steel,
            border: `1px solid ${selected.includes(name) ? getColor(name) : COLORS.carbonBorder}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

// ─── Main Dynasty component ───────────────────────────────────────────────────
export default function Dynasty() {
  const { data, loading } = useCSV('rq1_constructor_dominance.csv')
  const [tab, setTab] = useState('area')   // 'area' | 'dominance'
  const [hoveredYear, setHovered] = useState(null)
  const [selectedConstructors, setSelected] = useState([])

  // Story callout moments
  const CALLOUTS = [
    { year: 1988, text: '1988: McLaren win 15/16 races. Senna & Prost. The most dominant season ever — 93.8%.' },
    { year: 2009, text: '2009: Brawn GP appear from nowhere. Built for £1. Win the championship.' },
    { year: 2014, text: '2014: Mercedes activate 8 years of dominance. 111 wins from 160 races.' },
    { year: 2023, text: '2023: Red Bull win 21 of 22 races. 95.5% — the second most dominant season in history.' },
  ]

  return (
    <section
      id="dynasty"
      style={{
        minHeight: '100vh',
        background: COLORS.carbonMid,
        padding: 'clamp(40px, 6vh, 80px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
        position: 'relative',
      }}
    >
      {/* D3 tooltip (shared, positioned by JS) */}
      <div
        id="dynasty-tooltip"
        className="d3-tooltip chart-tooltip"
        style={{
          position: 'fixed', opacity: 0, zIndex: 999,
          pointerEvents: 'none', transition: 'opacity 0.15s',
        }}
      />

      {/* Section header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-eyebrow">Chapter 01</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px', marginBottom: '12px' }}>
          <h2 className="section-title">
            CONSTRUCTOR<br />DYNASTIES
          </h2>
          {hoveredYear && (
            <YearPanel year={hoveredYear} data={data} />
          )}
        </div>
        <p className="section-body" style={{ marginBottom: '40px' }}>
          Every era of F1 has had one team that rewrote the record books and one that fell from grace trying to stop them.
          Watch the dynasties rise and collapse as regulations reset the playing field.
        </p>

        {/* Story callouts */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {CALLOUTS.map(c => (
            <div
              key={c.year}
              style={{
                flex: '1 1 220px',
                background: COLORS.carbonLight,
                border: `1px solid ${COLORS.carbonBorder}`,
                borderTop: `2px solid ${COLORS.racingRed}`,
                padding: '14px 16px',
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS.silver,
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontFamily: FONTS.mono, color: COLORS.racingRed, fontSize: '11px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
                {c.year}
              </span>
              {c.text}
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: `1px solid ${COLORS.carbonBorder}` }}>
          {[
            { key: 'area', label: 'DYNASTY TIMELINE' },
            { key: 'dominance', label: 'DOMINANCE INDEX' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '10px 24px',
                fontFamily: FONTS.mono,
                fontSize: '11px',
                letterSpacing: '3px',
                background: 'transparent',
                color: tab === key ? 'white' : COLORS.steel,
                border: 'none',
                borderBottom: tab === key ? `2px solid ${COLORS.racingRed}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Constructor filter (area tab only) */}
        {tab === 'area' && (
          <ConstructorLegend
            selected={selectedConstructors}
            onChange={setSelected}
          />
        )}

        {/* Chart area */}
        {loading ? (
          <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.steel, fontFamily: FONTS.mono, fontSize: '12px', letterSpacing: '3px' }}>
            LOADING DATA...
          </div>
        ) : (
          <div style={{ background: COLORS.carbon, padding: '24px', border: `1px solid ${COLORS.carbonBorder}` }}>
            {tab === 'area' && (
              <StackedAreaChart
                data={data}
                selectedConstructors={selectedConstructors}
                onHover={setHovered}
                hoveredYear={hoveredYear}
              />
            )}
            {tab === 'dominance' && (
              <DominanceLollipop data={data} />
            )}
          </div>
        )}

        {/* Bottom note */}
        <p style={{ fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.asphalt, letterSpacing: '1.5px', marginTop: '16px' }}>
          DATA: ERGAST API / FORMULA1-DATASETS · HOVER AREA CHART TO INSPECT YEAR · TOGGLE CONSTRUCTORS ABOVE<br />
          * RENAULT INCLUDES LOTUS F1 (2012-2015, GOLD) AND ALPINE RACING (2021+, PINK) POINTS
        </p>
      </div>
    </section>
  )
}
