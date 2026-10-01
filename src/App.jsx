import React, { useMemo, useRef, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { toJpeg } from 'html-to-image'
import { PIB_DATA, MODES, ROW_DEFS, getYearRange, sliceByYears } from './data/pibData.js'

const fmtNumber = (v) =>
  v == null ? '' : v.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

const fmtPercent = (v) =>
  v == null ? '' : (v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' %'


function GraphSection() {
  const { min, max } = getYearRange('prix_courants')
  const [from, setFrom] = useState(min)
  const [to, setTo] = useState(max)
  const chartRef = useRef(null)

  const years = PIB_DATA.prix_courants.years

  const isFullRange = from === min && to === max

  const chartData = useMemo(() => {
    const pib = sliceByYears('prix_courants', from, to)
    const growth = sliceByYears('taux_croissance', from, to)
    return pib.years.map((y, i) => ({
      year: y,
      pib: pib.series.pib_prix_acquisition[i],
      taux: growth.series.pib_prix_acquisition[i] != null ? growth.series.pib_prix_acquisition[i] * 100 : null,
    }))
  }, [from, to])

  const exportExcel = () => {
    const rows = chartData.map((d) => ({
      Année: d.year,
      "PIB aux prix d'acquisition, prix courants (Mds Ariary)": d.pib != null ? Number(d.pib.toFixed(2)) : '',
      "Taux de croissance du PIB aux prix d'acquisition (%)": d.taux != null ? Number(d.taux.toFixed(2)) : '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PIB')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `PIB_${from}_${to}.xlsx`)
  }

  const exportJpg = () => {
    if (!chartRef.current) return
    toJpeg(chartRef.current, { backgroundColor: '#ffffff', quality: 0.95, pixelRatio: 2 }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `PIB_graphique_${from}_${to}.jpg`
      link.href = dataUrl
      link.click()
    })
  }

  return (
    <section className="block">
      <h2 className="section-title">Comptes nationaux rebasés de 1984 à 2006</h2>
      <div className="period-bar">
        <span>Choisir la période de</span>
        <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
          {years.filter((y) => y <= to).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span>à</span>
        <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
          {years.filter((y) => y >= from).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="chart-container" ref={chartRef}>
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="#e3e3e3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" domain={isFullRange ? [0, 16000] : [0, 'auto']} ticks={isFullRange ? [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000] : undefined} />
            <YAxis yAxisId="right" orientation="right" domain={isFullRange ? [-12, 13] : ['auto', 'auto']} ticks={isFullRange ? [-12, -7, -2, 3, 8, 13] : undefined} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip formatter={(v, name) => (name.includes('%') ? `${v.toFixed(2)} %` : v.toLocaleString('fr-FR'))} />
            <Legend verticalAlign="bottom" align="center" />
            <Bar yAxisId="left" dataKey="pib" name="PIB aux prix d'acquisition (milliards d'Ariary)" fill="#4472c4" barSize={18} />
            <Line yAxisId="right" dataKey="taux" name="Taux de croissance du PIB aux prix d'acquisition (en %)" stroke="#ed7d31" strokeWidth={2.5} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="export-bar">
        <button onClick={exportExcel}>📊 Exporter en Excel</button>
        <button onClick={exportJpg}>🖼️ Exporter en JPG</button>
      </div>

      <p className="source">
        Source : Institut National de la Statistique / Direction des Synthèses Economiques
      </p>
    </section>
  )
}
function TableSection() {
  const [mode, setMode] = useState('prix_constants')
  const { min, max } = getYearRange(mode)
  const [from, setFrom] = useState(min)
  const [to, setTo] = useState(max)
  const [checked, setChecked] = useState(() => Object.fromEntries(ROW_DEFS.map((r) => [r.key, true])))

  const years = PIB_DATA[mode].years
  const modeDef = MODES.find((m) => m.key === mode)
  const fmt = modeDef.percent ? fmtPercent : fmtNumber

  const data = useMemo(() => sliceByYears(mode, from, to), [mode, from, to])

  const toggleRow = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const visibleRows = ROW_DEFS.filter((r) => checked[r.key])

  const exportExcel = () => {
    const header = ['Libellé', ...data.years]
    const rows = visibleRows.map((r) => [
      r.label,
      ...data.years.map((y, i) => {
        const v = data.series[r.key][i]
        if (v == null) return ''
        return modeDef.percent ? Number((v * 100).toFixed(2)) : Number(v.toFixed(2))
      }),
    ])
    const ws = XLSX.utils.aoa_to_sheet([[modeDef.label], [], header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, mode.slice(0, 28))
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `ComptesNationaux_${mode}_${from}_${to}.xlsx`)
  }

  return (
    <section>
      <div className="radio-group">
        {MODES.map((m) => (
          <label key={m.key} className="radio-row">
            <input
              type="radio"
              name="mode"
              checked={mode === m.key}
              onChange={() => {
                setMode(m.key)
                const r = getYearRange(m.key)
                setFrom(r.min)
                setTo(r.max)
              }}
            />
            {m.label}
          </label>
        ))}
      </div>

      <div className="period-bar">
        <span>Choisir la période de</span>
        <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
          {years.filter((y) => y <= to).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span>à</span>
        <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
          {years.filter((y) => y >= from).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="hint">
          <label className="master-check">
            <input
              type="checkbox"
              checked={ROW_DEFS.every((r) => checked[r.key])}
              onChange={(e) => {
                const val = e.target.checked
                setChecked(Object.fromEntries(ROW_DEFS.map((r) => [r.key, val])))
              }}
            />
            Cocher les libellés
          </label>
        </span>
      </div>

      <div className="table-scroll">
        <table className="pib-table">
          <thead>
            <tr>
              <th className="label-col">{modeDef.label}</th>
              {data.years.map((y) => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROW_DEFS.map((r) => (
              <React.Fragment key={r.key}>
                {r.spacerBefore && <tr className="spacer"><td colSpan={data.years.length + 1}></td></tr>}
                <tr className={checked[r.key] ? '' : 'row-hidden'}>
                  <td className={`label-col ${r.bold ? 'bold' : ''}`}>
                    <label className="row-label">
                      <span className="check-slot">
                        {r.checkable && (
                          <input type="checkbox" checked={checked[r.key]} onChange={() => toggleRow(r.key)} />
                        )}
                      </span>
                      <span className={`label-text indent-${r.indent}`}>{r.label}</span>
                    </label>
                  </td>
                  {data.years.map((y, i) => {
                    const v = data.series[r.key][i]
                    let display = ''
                    if (checked[r.key]) {
                      display = v == null ? (r.unavailable ? 'n.d.' : '') : fmt(v)
                    }
                    return <td key={y} className={v == null && r.unavailable ? 'nd' : ''}>{display}</td>
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="export-bar">
        <button onClick={exportExcel}>📊 Exporter en Excel</button>
      </div>

      <p className="source">
        Source : Institut National de la Statistique / Direction des Synthèses Economiques<br />
        Note : (*) version provisoire ; SIFIM : Service d'Intermédiation Financière Indirectement Mesuré
        ("Charges non imputées", sous les anciens comptes)
      </p>
    </section>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Comptes Nationaux Rebasés (Année de base 2007)</h1>
        <p className="subtitle">Madagascar — Origines et emplois des ressources, 1984–2006</p>
      </header>
      <div className="panel">
        <GraphSection />
        <TableSection />
      </div>
    </div>
  )
}
