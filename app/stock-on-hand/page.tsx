'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const LOCATIONS = [
  'Warehouse',
  'Main Bar',
  'Kitchen 1',
  'Kitchen 2',
]

interface StockRow {
  plu_code: string
  item_name: string
  swiftpos_group: string
  stock_on_hand: number
  stocktake_date: string
}

export default function StockOnHandPage() {
  const today = new Date().toISOString().split('T')[0]

  const [location, setLocation] = useState('Main Bar')
  const [date, setDate] = useState(today)
  const [groupFilter, setGroupFilter] = useState('')
  const [pluSearch, setPluSearch] = useState('')
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(false)

  async function loadStock() {
    setLoading(true)

    let sessionQuery = supabase
      .from('bar_stocktake_sessions')
      .select('*')
      .eq('status', 'FINAL')
      .eq('location', location)
      .lte('stocktake_date', date)
      .order('stocktake_date', { ascending: false })
      .limit(1)

    const { data: sessions, error: sessionError } = await sessionQuery

    if (sessionError) {
      alert(sessionError.message)
      setLoading(false)
      return
    }

    if (!sessions || sessions.length === 0) {
      setRows([])
      setLoading(false)
      return
    }

    const session = sessions[0]

    let lineQuery = supabase
      .from('bar_stocktake_lines')
      .select('*')
      .eq('session_id', session.id)

    if (groupFilter.trim()) {
      lineQuery = lineQuery.ilike(
        'swiftpos_group',
        `%${groupFilter.trim()}%`
      )
    }

    if (pluSearch.trim()) {
      lineQuery = lineQuery.ilike(
        'plu_code',
        `%${pluSearch.trim()}%`
      )
    }

    const { data: lines, error: lineError } = await lineQuery

    setLoading(false)

    if (lineError) {
      alert(lineError.message)
      return
    }

    const mapped =
      lines?.map((line: any) => ({
        plu_code: line.plu_code || '',
        item_name: line.item_name || '',
        swiftpos_group: line.swiftpos_group || '',
        stock_on_hand: Number(line.inventory_count || 0),
        stocktake_date: session.stocktake_date,
      })) || []

    setRows(mapped)
  }

  function exportCSV() {
    const headers = [
      'PLU',
      'Item',
      'Group',
      'Last Count Date',
      'Stock On Hand',
    ]

    const csvRows = rows.map((row) => [
      row.plu_code,
      row.item_name,
      row.swiftpos_group,
      row.stocktake_date,
      row.stock_on_hand,
    ])

    const csv = [
      headers.join(','),
      ...csvRows.map((row) =>
        row.map((value) => `"${String(value ?? '')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `stock-on-hand-${date}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Stock On Hand</h1>

      <div style={cardStyle}>
        <div style={filterGridStyle}>
          <div>
            <label style={labelStyle}>Location</label>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Group</label>

            <input
              placeholder="Example: BEER"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>PLU</label>

            <input
              placeholder="Search PLU"
              value={pluSearch}
              onChange={(e) => setPluSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={buttonRowStyle}>
          <button onClick={loadStock} style={buttonStyle}>
            {loading ? 'Loading...' : 'Load Stock'}
          </button>

          <button onClick={exportCSV} style={secondaryButtonStyle}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={resultBarStyle}>
          Showing {rows.length} items
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Last Count Date</th>
              <th style={thStyle}>Stock On Hand</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={tdStyle}>{row.plu_code}</td>
                <td style={tdStyle}>{row.item_name}</td>
                <td style={tdStyle}>{row.swiftpos_group}</td>
                <td style={tdStyle}>{row.stocktake_date}</td>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 700,
                  }}
                >
                  {row.stock_on_hand}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={5}>
                  No stock found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const pageStyle = {
  padding: 20,
  background: '#f3f4f6',
  minHeight: '100vh',
  color: '#111827',
}

const headingStyle = {
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 20,
}

const cardStyle = {
  background: '#ffffff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  marginBottom: 20,
  overflowX: 'auto' as const,
}

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  marginBottom: 16,
}

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: 10,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#111827',
}

const buttonRowStyle = {
  display: 'flex',
  gap: 12,
}

const buttonStyle = {
  padding: '10px 16px',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButtonStyle = {
  padding: '10px 16px',
  background: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
}

const resultBarStyle = {
  marginBottom: 12,
  fontSize: 14,
  color: '#6b7280',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const thStyle = {
  border: '1px solid #d1d5db',
  padding: 12,
  background: '#111827',
  color: '#ffffff',
  textAlign: 'left' as const,
}

const tdStyle = {
  border: '1px solid #e5e7eb',
  padding: 10,
}