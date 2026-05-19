'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface VarianceRow {
  plu_code: string
  item_name: string
  group_name: string
  opening: number
  transfers_in: number
  transfers_out: number
  sold: number
  expected: number
  physical: number
  variance: number
}

export default function WarehousePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rows, setRows] = useState<VarianceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('ALL')
const [generatedBy, setGeneratedBy] = useState('')
const [savingReport, setSavingReport] = useState(false)

  async function generateReport() {
    setLoading(true)

    const { data: items, error: itemError } = await supabase
      .from('bottle_master')
      .select('*')
      .eq('active', true)
      .eq('count_type', 'UNIT')
      .order('swiftpos_group')
      .order('item_name')

    if (itemError) {
      alert(itemError.message)
      setLoading(false)
      return
    }

    const { data: currentSessions } = await supabase
      .from('bar_stocktake_sessions')
      .select('id')
      .eq('stocktake_date', date)
      .eq('status', 'FINAL')
      .eq('location', 'Main Bar')

    const currentSessionIds = currentSessions?.map((s) => s.id) || []

    const { data: currentLines } = currentSessionIds.length
      ? await supabase
          .from('bar_stocktake_lines')
          .select('*')
          .in('session_id', currentSessionIds)
          .eq('count_type', 'UNIT')
      : { data: [] as any[] }

    const { data: previousSession } = await supabase
      .from('bar_stocktake_sessions')
      .select('id, stocktake_date')
      .lt('stocktake_date', date)
      .eq('status', 'FINAL')
      .eq('location', 'Main Bar')
      .order('stocktake_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: openingLines } = previousSession?.id
      ? await supabase
          .from('bar_stocktake_lines')
          .select('*')
          .eq('session_id', previousSession.id)
          .eq('count_type', 'UNIT')
      : { data: [] as any[] }

    const { data: salesLines } = await supabase
      .from('bar_sales_lines')
      .select('*')
      .eq('sales_date', date)

    const { data: transfers } = await supabase
      .from('bar_transfers')
      .select('*')
      .eq('transfer_date', date)

    const reportRows =
      items?.map((item: any) => {
        const plu = String(item.plu_code || '').trim()

        const opening = 0

        const physical =
          currentLines
            ?.filter((line: any) => String(line.plu_code).trim() === plu)
            .reduce(
              (sum: number, line: any) =>
                sum + Number(line.inventory_count || 0),
              0
            ) || 0

        const sold =
          salesLines
            ?.filter((line: any) => String(line.plu_code).trim() === plu)
            .reduce(
              (sum: number, line: any) => sum + Number(line.qty_sold || 0),
              0
            ) || 0

        const transfersIn =
          transfers
            ?.filter(
              (line: any) =>
                String(line.plu_code).trim() === plu &&
                line.transfer_type === 'IN'
            )
            .reduce(
              (sum: number, line: any) => sum + Number(line.qty || 0),
              0
            ) || 0

        const transfersOut =
          transfers
            ?.filter(
              (line: any) =>
                String(line.plu_code).trim() === plu &&
                line.transfer_type === 'OUT'
            )
            .reduce(
              (sum: number, line: any) => sum + Number(line.qty || 0),
              0
            ) || 0

        const expected = opening + transfersIn - transfersOut - sold
        const variance = physical - expected

        return {
          plu_code: plu,
          item_name: item.item_name || '',
          group_name: item.swiftpos_group || 'NO GROUP',
          opening,
          transfers_in: transfersIn,
          transfers_out: transfersOut,
          sold,
          expected,
          physical,
          variance,
        }
      }) || []

    setRows(reportRows)
    setLoading(false)
  }

  const groupOptions = [
    'ALL',
    ...Array.from(new Set(rows.map((r) => r.group_name).filter(Boolean))).sort(),
  ]

  const filteredRows = rows.filter((row) => {
    const searchText = search.toLowerCase().trim()

    const matchesSearch =
      !searchText ||
      row.item_name.toLowerCase().includes(searchText) ||
      row.plu_code.toLowerCase().includes(searchText) ||
      row.group_name.toLowerCase().includes(searchText)

    const matchesGroup =
      groupFilter === 'ALL' || row.group_name === groupFilter

    return matchesSearch && matchesGroup
  })

  const totalVariance = filteredRows.reduce(
    (sum, row) => sum + Number(row.variance || 0),
    0
  )

  const shortageCount = filteredRows.filter((row) => row.variance < 0).length

  function statusForVariance(value: number) {
    if (value === 0) return 'OK'
    if (Math.abs(value) <= 2) return 'CHECK'
    return 'INVESTIGATE'
  }

  function exportCSV() {
    const headers = [
      'PLU',
      'Item',
      'Group',
      'Opening',
      'Transfers In',
      'Transfers Out',
      'Sold',
      'Expected',
      'Physical Count',
      'Variance',
      'Status',
    ]

    const csvRows = filteredRows.map((row) => [
      row.plu_code,
      row.item_name,
      row.group_name,
      row.opening,
      row.transfers_in,
      row.transfers_out,
      row.sold,
      row.expected,
      row.physical,
      row.variance,
      statusForVariance(row.variance),
    ])

    const csv = [
      headers.join(','),
      ...csvRows.map((r) =>
        r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `bar-variance-report-${date}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

async function saveVarianceReport() {
  if (rows.length === 0) {
    alert('Generate the report first')
    return
  }

  if (!generatedBy.trim()) {
    alert('Enter generated by')
    return
  }

  setSavingReport(true)

  const totalVariance = filteredRows.reduce(
    (sum, row) => sum + Number(row.variance || 0),
    0
  )

  const shortageLines = filteredRows.filter((row) => row.variance < 0).length

  const { data: report, error: reportError } = await supabase
    .from('bar_variance_reports')
    .insert([
      {
        report_date: date,
        generated_by: generatedBy.trim(),
        total_items: filteredRows.length,
        total_variance: totalVariance,
        shortage_lines: shortageLines,
      },
    ])
    .select()
    .single()

  if (reportError) {
    alert(reportError.message)
    setSavingReport(false)
    return
  }

  const lines = filteredRows.map((row) => ({
    report_id: report.id,
    plu_code: row.plu_code,
    item_name: row.item_name,
    group_name: row.group_name,
    opening: row.opening,
    transfers_in: row.transfers_in,
    transfers_out: row.transfers_out,
    sold: row.sold,
    expected: row.expected,
    physical: row.physical,
    variance: row.variance,
    status: statusForVariance(row.variance),
  }))

  const { error: lineError } = await supabase
    .from('bar_variance_report_lines')
    .insert(lines)

  setSavingReport(false)

  if (lineError) {
    alert(lineError.message)
    return
  }

  alert('Variance report saved to history')
}

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Bar Variance Report</h1>

      <div style={cardStyle}>
        <div style={toolbarStyle}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />

          <button onClick={generateReport} style={buttonStyle}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>

          <button onClick={generateReport} style={buttonStyle}>
  {loading ? 'Loading...' : 'Generate Report'}
</button>

<button onClick={exportCSV} style={secondaryButtonStyle}>
  Export CSV
</button>

<input
  placeholder="Generated By"
  value={generatedBy}
  onChange={(e) => setGeneratedBy(e.target.value)}
  style={inputStyle}
/>

<button
  onClick={saveVarianceReport}
  style={secondaryButtonStyle}
>
  {savingReport ? 'Saving...' : 'Save Report'}
</button>

          <button onClick={exportCSV} style={secondaryButtonStyle}>
            Export CSV
          </button>
        </div>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Items Reviewed</div>
            <div style={summaryValueStyle}>{filteredRows.length}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Total Variance</div>
            <div
              style={{
                ...summaryValueStyle,
                color:
                  totalVariance < 0
                    ? '#dc2626'
                    : totalVariance > 0
                      ? '#d97706'
                      : '#059669',
              }}
            >
              {totalVariance}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Shortage Lines</div>
            <div
              style={{
                ...summaryValueStyle,
                color: shortageCount > 0 ? '#dc2626' : '#059669',
              }}
            >
              {shortageCount}
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={filterStyle}>
          <input
            placeholder="Search item, PLU, or group"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={inputStyle}
          >
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group === 'ALL' ? 'All Groups' : group}
              </option>
            ))}
          </select>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Opening</th>
              <th style={thStyle}>Transfers In</th>
              <th style={thStyle}>Transfers Out</th>
              <th style={thStyle}>Sold</th>
              <th style={thStyle}>Expected</th>
              <th style={thStyle}>Physical Count</th>
              <th style={thStyle}>Variance</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.plu_code}>
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
                      row.variance < 0
                        ? '#dc2626'
                        : row.variance > 0
                          ? '#d97706'
                          : '#059669',
                  }}
                >
                  {row.variance}
                </td>

                <td style={tdStyle}>{statusForVariance(row.variance)}</td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={11}>
                  Generate report to view the bar variance report.
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
  fontSize: 28,
  fontWeight: '700',
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

const toolbarStyle = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap' as const,
  marginBottom: 20,
}

const filterStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 12,
  marginBottom: 20,
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
}

const summaryCardStyle = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
}

const summaryLabelStyle = {
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 6,
}

const summaryValueStyle = {
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
}

const inputStyle = {
  padding: 10,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#111827',
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