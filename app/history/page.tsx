'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const LOCATIONS = ['ALL', 'Warehouse', 'Main Bar', 'Kitchen 1', 'Kitchen 2']

interface HistoryRow {
  date: string
  type: string
  location: string
  status: string
  person: string
  plu_code: string
  item_name: string
  group_name: string
  inventory_count?: number
  opening?: number
  transfers_in?: number
  transfers_out?: number
  sold?: number
  expected?: number
  physical?: number
  variance?: number
}

export default function HistoryPage() {
  const today = new Date().toISOString().split('T')[0]

  const [historyType, setHistoryType] = useState('STOCKTAKE')
  const [location, setLocation] = useState('ALL')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [groupFilter, setGroupFilter] = useState('')
  const [pluSearch, setPluSearch] = useState('')
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)

  async function loadHistory() {
    setLoading(true)

    if (historyType === 'STOCKTAKE') {
      await loadStocktakeHistory()
    }

    if (historyType === 'VARIANCE') {
      await loadVarianceHistory()
    }

    setLoading(false)
  }

  async function loadStocktakeHistory() {
    let sessionQuery = supabase
      .from('bar_stocktake_sessions')
      .select('*')
      .gte('stocktake_date', dateFrom)
      .lte('stocktake_date', dateTo)
      .order('stocktake_date', { ascending: false })

    if (location !== 'ALL') {
      sessionQuery = sessionQuery.eq('location', location)
    }

    const { data: sessions, error: sessionError } = await sessionQuery

    if (sessionError) {
      alert(sessionError.message)
      return
    }

    const sessionIds = sessions?.map((s) => s.id) || []

    if (sessionIds.length === 0) {
      setRows([])
      return
    }

    let lineQuery = supabase
      .from('bar_stocktake_lines')
      .select('*')
      .in('session_id', sessionIds)

    if (pluSearch.trim()) {
      lineQuery = lineQuery.ilike('plu_code', `%${pluSearch.trim()}%`)
    }

    if (groupFilter.trim()) {
      lineQuery = lineQuery.ilike('swiftpos_group', `%${groupFilter.trim()}%`)
    }

    const { data: lines, error: lineError } = await lineQuery

    if (lineError) {
      alert(lineError.message)
      return
    }

    const mapped =
      lines?.map((line: any) => {
        const session = sessions?.find((s: any) => s.id === line.session_id)

        return {
          date: session?.stocktake_date || '',
          type: 'Stocktake',
          location: session?.location || '',
          status: session?.status || '',
          person: session?.counted_by || '',
          plu_code: line.plu_code || '',
          item_name: line.item_name || '',
          group_name: line.swiftpos_group || '',
          inventory_count: Number(line.inventory_count || 0),
        }
      }) || []

    setRows(mapped)
  }

  async function loadVarianceHistory() {
    const { data: reports, error: reportError } = await supabase
      .from('bar_variance_reports')
      .select('*')
      .gte('report_date', dateFrom)
      .lte('report_date', dateTo)
      .order('report_date', { ascending: false })

    if (reportError) {
      alert(reportError.message)
      return
    }

    const reportIds = reports?.map((r) => r.id) || []

    if (reportIds.length === 0) {
      setRows([])
      return
    }

    let lineQuery = supabase
      .from('bar_variance_report_lines')
      .select('*')
      .in('report_id', reportIds)

    if (pluSearch.trim()) {
      lineQuery = lineQuery.ilike('plu_code', `%${pluSearch.trim()}%`)
    }

    if (groupFilter.trim()) {
      lineQuery = lineQuery.ilike('group_name', `%${groupFilter.trim()}%`)
    }

    const { data: lines, error: lineError } = await lineQuery

    if (lineError) {
      alert(lineError.message)
      return
    }

    const mapped =
      lines?.map((line: any) => {
        const report = reports?.find((r: any) => r.id === line.report_id)

        return {
          date: report?.report_date || '',
          type: 'Variance',
          location: 'Main Bar',
          status: line.status || '',
          person: report?.generated_by || '',
          plu_code: line.plu_code || '',
          item_name: line.item_name || '',
          group_name: line.group_name || '',
          opening: Number(line.opening || 0),
          transfers_in: Number(line.transfers_in || 0),
          transfers_out: Number(line.transfers_out || 0),
          sold: Number(line.sold || 0),
          expected: Number(line.expected || 0),
          physical: Number(line.physical || 0),
          variance: Number(line.variance || 0),
        }
      }) || []

    const filteredByLocation =
      location === 'ALL'
        ? mapped
        : mapped.filter((row) => row.location === location)

    setRows(filteredByLocation)
  }

  function exportCSV() {
    const headers =
      historyType === 'STOCKTAKE'
        ? [
            'Date',
            'Type',
            'Location',
            'Status',
            'Person',
            'PLU',
            'Item',
            'Group',
            'Inventory Count',
          ]
        : [
            'Date',
            'Type',
            'Location',
            'Status',
            'Generated By',
            'PLU',
            'Item',
            'Group',
            'Opening',
            'Transfers In',
            'Transfers Out',
            'Sold',
            'Expected',
            'Physical',
            'Variance',
          ]

    const csvRows =
      historyType === 'STOCKTAKE'
        ? rows.map((row) => [
            row.date,
            row.type,
            row.location,
            row.status,
            row.person,
            row.plu_code,
            row.item_name,
            row.group_name,
            row.inventory_count ?? 0,
          ])
        : rows.map((row) => [
            row.date,
            row.type,
            row.location,
            row.status,
            row.person,
            row.plu_code,
            row.item_name,
            row.group_name,
            row.opening ?? 0,
            row.transfers_in ?? 0,
            row.transfers_out ?? 0,
            row.sold ?? 0,
            row.expected ?? 0,
            row.physical ?? 0,
            row.variance ?? 0,
          ])

    const csv = [
      headers.join(','),
      ...csvRows.map((row) =>
        row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `history-${historyType.toLowerCase()}-${dateFrom}-to-${dateTo}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>History</h1>

      <div style={cardStyle}>
        <div style={filterGridStyle}>
          <div>
            <label style={labelStyle}>History Type</label>
            <select
              value={historyType}
              onChange={(e) => setHistoryType(e.target.value)}
              style={inputStyle}
            >
              <option value="STOCKTAKE">Stocktake History</option>
              <option value="VARIANCE">Variance Report History</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'ALL' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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
              placeholder="Enter PLU"
              value={pluSearch}
              onChange={(e) => setPluSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={buttonRowStyle}>
          <button onClick={loadHistory} style={buttonStyle}>
            {loading ? 'Loading...' : 'Load History'}
          </button>

          <button onClick={exportCSV} style={secondaryButtonStyle}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={resultBarStyle}>
          Showing {rows.length} records
        </div>

        <table style={tableStyle}>
          <thead>
            {historyType === 'STOCKTAKE' ? (
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Person</th>
                <th style={thStyle}>PLU</th>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Group</th>
                <th style={thStyle}>Inventory Count</th>
              </tr>
            ) : (
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Generated By</th>
                <th style={thStyle}>PLU</th>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Group</th>
                <th style={thStyle}>Opening</th>
                <th style={thStyle}>In</th>
                <th style={thStyle}>Out</th>
                <th style={thStyle}>Sold</th>
                <th style={thStyle}>Expected</th>
                <th style={thStyle}>Physical</th>
                <th style={thStyle}>Variance</th>
              </tr>
            )}
          </thead>

          <tbody>
            {rows.map((row, index) =>
              historyType === 'STOCKTAKE' ? (
                <tr key={index}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.type}</td>
                  <td style={tdStyle}>{row.location}</td>
                  <td style={tdStyle}>{row.status}</td>
                  <td style={tdStyle}>{row.person}</td>
                  <td style={tdStyle}>{row.plu_code}</td>
                  <td style={tdStyle}>{row.item_name}</td>
                  <td style={tdStyle}>{row.group_name}</td>
                  <td style={tdStyle}>{row.inventory_count}</td>
                </tr>
              ) : (
                <tr key={index}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.type}</td>
                  <td style={tdStyle}>{row.location}</td>
                  <td style={tdStyle}>{row.status}</td>
                  <td style={tdStyle}>{row.person}</td>
                  <td style={tdStyle}>{row.plu_code}</td>
                  <td style={tdStyle}>{row.item_name}</td>
                  <td style={tdStyle}>{row.group_name}</td>
                  <td style={tdStyle}>{row.opening}</td>
                  <td style={tdStyle}>{row.transfers_in}</td>
                  <td style={tdStyle}>{row.transfers_out}</td>
                  <td style={tdStyle}>{row.sold}</td>
                  <td style={tdStyle}>{row.expected}</td>
                  <td style={tdStyle}>{row.physical}</td>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 700,
                      color:
                        Number(row.variance || 0) < 0
                          ? '#dc2626'
                          : Number(row.variance || 0) > 0
                            ? '#d97706'
                            : '#059669',
                    }}
                  >
                    {row.variance}
                  </td>
                </tr>
              )
            )}

            {rows.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={historyType === 'STOCKTAKE' ? 9 : 15}>
                  No history found. Select filters and click Load History.
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
  gridTemplateColumns: 'repeat(3, 1fr)',
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