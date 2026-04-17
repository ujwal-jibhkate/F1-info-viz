import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useCSV } from '../hooks/useCSV'
import { COLORS, FONTS } from '../styles/theme'

const STREET_COLOR = '#ff6b35'
const PERMANENT_COLOR = '#4ecdc4'

// Kernel density estimator
function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map(x => [x, d3.mean(V, v => kernel(x - v))])
  }
}
function kernelEpanechnikov(k) {
  return function (v) {
    return Math.abs(v /= k) <= 1 ? (0.75 * (1 - v * v)) / k : 0
  }
}

// ─── Violin Chart ─────────────────────────────────────────────────────────────
function ViolinChart({ data, startingBand }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const [dims, setDims] = useState({ width: 700, height: 480 })

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: Math.max(w, 320), height: Math.max(w * 0.6, 340) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { streetChanges, permChanges } = useMemo(() => {
    const filter = (ct) => data
      .filter(d => {
        const ct2 = d['Circuit Type'] || ''
        if (ct2 !== ct) return false
        const grid = d['Grid Position'], fin = d['Finish Position']
        if (!grid || !fin || grid <= 0 || fin <= 0) return false
        if (startingBand === 'front') return grid <= 5
        if (startingBand === 'mid') return grid >= 6 && grid <= 15
        if (startingBand === 'back') return grid >= 16
        return true
      })
      .map(d => d['Finish Position'] - d['Grid Position'])
      .filter(v => v >= -25 && v <= 25)

    return {
      streetChanges: filter('Street Circuit'),
      permChanges: filter('Permanent Circuit'),
    }
  }, [data, startingBand])

  useEffect(() => {
    if (!streetChanges.length || !permChanges.length || !svgRef.current) return

    const margin = { top: 30, right: 40, bottom: 60, left: 60 }
    const W = dims.width - margin.left - margin.right
    const H = dims.height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const categories = ['Street Circuit', 'Permanent Circuit']
    const allData = {
      'Street Circuit': streetChanges,
      'Permanent Circuit': permChanges,
    }

    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, W])
      .padding(0.35)

    const yDomain = [-20, 20]
    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([H, 0])

    // Grid
    g.selectAll('.grid-h')
      .data(d3.range(-20, 21, 5)).join('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', d => d === 0 ? COLORS.carbonBorder : COLORS.carbon)
      .attr('stroke-width', d => d === 0 ? 1.5 : 1)
      .attr('stroke-dasharray', d => d === 0 ? 'none' : '2,4')

    // Zero line label
    g.append('text')
      .attr('x', -8).attr('y', yScale(0) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.steel)
      .attr('font-size', '9px').attr('font-family', FONTS.mono)
      .text('0')

    const kde = kernelDensityEstimator(kernelEpanechnikov(3), d3.range(-22, 23, 0.5))

    const colorOf = cat => cat === 'Street Circuit' ? STREET_COLOR : PERMANENT_COLOR

    categories.forEach(cat => {
      const vals = allData[cat]
      if (!vals.length) return

      const density = kde(vals)
      const maxDensity = d3.max(density, d => d[1])
      const violinWidth = xScale.bandwidth() / 2

      const widthScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, violinWidth])

      const area = d3.area()
        .x0(d => xScale(cat) + xScale.bandwidth() / 2 - widthScale(d[1]))
        .x1(d => xScale(cat) + xScale.bandwidth() / 2 + widthScale(d[1]))
        .y(d => yScale(d[0]))
        .curve(d3.curveCatmullRom)

      const color = colorOf(cat)

      // Violin fill
      g.append('path')
        .datum(density)
        .attr('d', area)
        .attr('fill', color)
        .attr('fill-opacity', 0.2)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition().duration(1000).delay(cat === 'Street Circuit' ? 0 : 200)
        .attr('opacity', 1)

      // IQR box
      const q1 = d3.quantile(vals.slice().sort(d3.ascending), 0.25)
      const med = d3.quantile(vals.slice().sort(d3.ascending), 0.5)
      const q3 = d3.quantile(vals.slice().sort(d3.ascending), 0.75)
      const cx = xScale(cat) + xScale.bandwidth() / 2

      g.append('rect')
        .attr('x', cx - 8).attr('width', 16)
        .attr('y', yScale(q3)).attr('height', yScale(q1) - yScale(q3))
        .attr('fill', color).attr('fill-opacity', 0.5)
        .attr('stroke', color).attr('stroke-width', 1)

      // Median line
      g.append('line')
        .attr('x1', cx - 12).attr('x2', cx + 12)
        .attr('y1', yScale(med)).attr('y2', yScale(med))
        .attr('stroke', 'white').attr('stroke-width', 2.5).attr('stroke-linecap', 'round')

      // Mean dot
      const mean = d3.mean(vals)
      g.append('circle')
        .attr('cx', cx).attr('cy', yScale(mean))
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', COLORS.carbon)
        .attr('stroke-width', 1.5)

      // Stats label below
      const labelY = H + 28
      g.append('text')
        .attr('x', cx).attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '10px').attr('font-family', FONTS.mono)
        .attr('letter-spacing', 1)
        .text(`MEDIAN ${med >= 0 ? '+' : ''}${med?.toFixed(1)} · σ ${d3.deviation(vals)?.toFixed(1)}`)

      // Tooltip on violin
      const tooltip = d3.select('body').select('.d3-tooltip')
      g.selectAll(`path`).on('mouseenter', function () {
        tooltip
          .style('opacity', 1)
          .html(`
            <div class="tooltip-title">${cat}</div>
            <div style="margin-top:6px;font-size:12px;color:${color}">
              n = ${vals.length.toLocaleString()} races
            </div>
            <div style="font-size:12px;color:var(--silver);margin-top:4px">
              Median: ${med >= 0 ? '+' : ''}${med?.toFixed(1)} positions<br/>
              Mean: ${mean >= 0 ? '+' : ''}${mean?.toFixed(2)}<br/>
              IQR: ${q1?.toFixed(1)} to ${q3?.toFixed(1)}<br/>
              Std dev: ${d3.deviation(vals)?.toFixed(2)}
            </div>
          `)
      })
        .on('mousemove', function (event) {
          tooltip
            .style('left', (event.pageX + 14) + 'px')
            .style('top', (event.pageY - 40) + 'px')
        })
        .on('mouseleave', () => tooltip.style('opacity', 0))
    })

    // Direction labels
    g.append('text').attr('x', -10).attr('y', yScale(18))
      .attr('text-anchor', 'end').attr('fill', COLORS.racingRed)
      .attr('font-size', '9px').attr('font-family', FONTS.mono)
      .attr('letter-spacing', 1).text('FELL BACK ▼')

    g.append('text').attr('x', -10).attr('y', yScale(-18))
      .attr('text-anchor', 'end').attr('fill', '#00ff87')
      .attr('font-size', '9px').attr('font-family', FONTS.mono)
      .attr('letter-spacing', 1).text('GAINED ▲')

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call(ax => {
        ax.select('.domain').remove()
        ax.selectAll('.tick text')
          .attr('fill', COLORS.silver)
          .attr('font-family', FONTS.mono)
          .attr('font-size', '11px')
          .attr('letter-spacing', 2)
          .attr('dy', '1.2em')
          .text(d => d.toUpperCase())
      })

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => (d > 0 ? '+' : '') + d))
      .call(ax => {
        ax.select('.domain').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick line').attr('stroke', COLORS.carbonBorder)
        ax.selectAll('.tick text')
          .attr('fill', COLORS.steel)
          .attr('font-family', FONTS.mono)
          .attr('font-size', '10px')
      })

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2).attr('y', -48)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.steel)
      .attr('font-family', FONTS.mono)
      .attr('font-size', '10px').attr('letter-spacing', 2)
      .text('POSITIONS GAINED / LOST')

  }, [streetChanges, permChanges, dims])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg ref={svgRef} width={dims.width} height={dims.height}
        style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  )
}

// ─── Main ChaosOrOrder component ─────────────────────────────────────────────
export default function ChaosOrOrder() {
  const { data, loading } = useCSV('rq2_grid_finish_circuits.csv')
  const [startingBand, setBand] = useState('all')

  const BANDS = [
    { key: 'all', label: 'ALL STARTERS' },
    { key: 'front', label: 'FRONT ROW (P1–5)' },
    { key: 'mid', label: 'MIDFIELD (P6–15)' },
    { key: 'back', label: 'BACKMARKERS (P16+)' },
  ]

  return (
    <section
      id="chaos"
      style={{
        minHeight: '100vh',
        background: COLORS.carbonMid,
        padding: 'clamp(40px, 6vh, 80px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${COLORS.carbonBorder}`,
      }}
    >
      <div className="d3-tooltip chart-tooltip"
        style={{ position: 'fixed', opacity: 0, zIndex: 999, pointerEvents: 'none', transition: 'opacity 0.15s' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-eyebrow">Chapter 02 - B</div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>
          CHAOS OR<br />ORDER
        </h2>
        <p className="section-body" style={{ marginBottom: '40px' }}>
          How wide is the gap between where you start and where you finish?
          The shape of these distributions reveals everything about how much
          street circuits lock in the order — and how much permanent tracks set it free.
        </p>

        {/* Insight callouts */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[
            {
              icon: '🔒',
              title: 'Streets Lock the Grid',
              body: 'On street circuits, the violin is narrow and centred near zero. The walls decide. Backmarkers rarely rescue a race.',
              color: STREET_COLOR,
            },
            {
              icon: '🌊',
              title: 'Permanent Tracks Release Chaos',
              body: 'Permanent circuits spread wider — safety cars, tyre strategy, and weather all create the room for massive swings.',
              color: PERMANENT_COLOR,
            },
            {
              icon: '📍',
              title: 'The Median is Zero',
              body: "Across all circuits, the median position change is nearly flat. Most drivers finish where they started. Chaos is the exception.",
              color: COLORS.silver,
            },
          ].map(c => (
            <div key={c.title} style={{
              flex: '1 1 240px',
              background: COLORS.carbonLight,
              border: `1px solid ${COLORS.carbonBorder}`,
              borderTop: `2px solid ${c.color}`,
              padding: '16px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: '11px', color: c.color, letterSpacing: '1.5px', marginBottom: '6px' }}>
                {c.title.toUpperCase()}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: '13px', color: COLORS.silver, lineHeight: 1.6 }}>
                {c.body}
              </div>
            </div>
          ))}
        </div>

        {/* Starting position filter */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '9px', letterSpacing: '2px', color: COLORS.steel, marginBottom: '8px' }}>
            FILTER BY STARTING POSITION
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {BANDS.map(({ key, label }) => (
              <button key={key} onClick={() => setBand(key)}
                style={{
                  padding: '5px 16px',
                  fontFamily: FONTS.mono, fontSize: '10px', letterSpacing: '2px',
                  background: startingBand === key ? COLORS.racingRed : 'transparent',
                  color: startingBand === key ? 'white' : COLORS.steel,
                  border: `1px solid ${startingBand === key ? COLORS.racingRed : COLORS.carbonBorder}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.steel, fontFamily: FONTS.mono, fontSize: '12px', letterSpacing: '3px' }}>
            LOADING DATA...
          </div>
        ) : (
          <div style={{ background: COLORS.carbon, padding: '24px', border: `1px solid ${COLORS.carbonBorder}` }}>
            <ViolinChart data={data} startingBand={startingBand} />
          </div>
        )}

        <p style={{ fontFamily: FONTS.mono, fontSize: '10px', color: COLORS.asphalt, letterSpacing: '1.5px', marginTop: '16px' }}>
          WHITE LINE = MEDIAN · COLORED DOT = MEAN · BOX = IQR · HOVER VIOLIN FOR FULL STATS
        </p>
      </div>
    </section>
  )
}
