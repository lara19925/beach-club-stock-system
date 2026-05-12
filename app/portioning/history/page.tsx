'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type PortionSheet = {
  id: string
  sheet_date: string
  stock_item: string | null
  prepared_by: string | null
  checked_by: string | null
  true_shortage_kg: number | null
  true_shortage_percent: number | null
  variance_status: string | null
  created_at: string
}

export default function PortionHistoryPage() {
  const [sheets, setSheets] = useState<PortionSheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data, error } = await supabase
      .from('portion_sheets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      alert('Could not load portion sheet history')
    } else {
      setSheets(data || [])
    }

    setLoading(false)
  }

  function printHistory() {
    window.print()
  }

  function exportHistoryToCSV() {
    const rows = [
      ['Date', 'Stock Item', 'Prepared By', 'Checked By', 'Variance kg', 'Variance %', 'Status'],
      ...sheets.map(sheet => [
        sheet.sheet_date,
        sheet.stock_item || '',
        sheet.prepared_by || '',
        sheet.checked_by || '',
        sheet.true_shortage_kg || 0,
        sheet.true_shortage_percent || 0,
        sheet.variance_status || '',
      ]),
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'portion-sheet-history.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <main style={{ padding: '30px' }}>
      <h1>Portion Sheet History</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={printHistory}>Print History</button>
        <button onClick={exportHistoryToCSV}>Export CSV</button>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : sheets.length === 0 ? (
        <p>No portion sheets submitted yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f3f3' }}>
              <th style={cell}>Date</th>
              <th style={cell}>Stock Item</th>
              <th style={cell}>Prepared By</th>
              <th style={cell}>Checked By</th>
              <th style={cell}>Variance kg</th>
              <th style={cell}>Variance %</th>
              <th style={cell}>Status</th>
              <th style={cell}>Open</th>
            </tr>
          </thead>

          <tbody>
            {sheets.map(sheet => (
              <tr key={sheet.id}>
                <td style={cell}>{sheet.sheet_date}</td>
                <td style={cell}>{sheet.stock_item || '-'}</td>
                <td style={cell}>{sheet.prepared_by || '-'}</td>
                <td style={cell}>{sheet.checked_by || '-'}</td>
                <td style={cell}>{Number(sheet.true_shortage_kg || 0).toFixed(2)}</td>
                <td style={cell}>{Number(sheet.true_shortage_percent || 0).toFixed(2)}%</td>
                <td style={cell}>{sheet.variance_status || '-'}</td>
                <td style={cell}>
                  <Link href={`/portioning/history/${sheet.id}`}>
                    Open Sheet
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

const cell = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'left' as const,
}