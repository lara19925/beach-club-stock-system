'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PortionSheet = {
  id: string
  sheet_date: string
  stock_item: string | null
  prepared_by: string | null
  checked_by: string | null
  location: string | null
  net_usable_weight: number | null
  total_raw_portion_weight: number | null
  total_cooked_raw_weight_used: number | null
  total_trim_usage: number | null
  total_accounted_weight: number | null
  true_shortage_kg: number | null
  total_shrinkage_kg: number | null
  true_shortage_percent: number | null
  acceptable_variance_percent: number | null
  variance_status: string | null
  raw_rows: any[] | null
  cooked_rows: any[] | null
  trim_rows: any[] | null
  portion_summary: any[] | null
}

export default function PortionSheetDetailPage({ params }: { params: { id: string } }) {
  const [sheet, setSheet] = useState<PortionSheet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSheet()
  }, [])

  async function loadSheet() {
    const { data, error } = await supabase
      .from('portion_sheets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error(error)
      alert('Could not load full portion sheet')
    } else {
      setSheet(data)
    }

    setLoading(false)
  }

  function printSheet() {
    window.print()
  }

  function exportSheetCSV() {
    if (!sheet) return

    const rows = [
      ['Date', sheet.sheet_date],
      ['Stock Item', sheet.stock_item || ''],
      ['Prepared By', sheet.prepared_by || ''],
      ['Checked By', sheet.checked_by || ''],
      ['Net Usable Weight kg', sheet.net_usable_weight || 0],
      ['True Variance kg', sheet.true_shortage_kg || 0],
      ['True Variance %', sheet.true_shortage_percent || 0],
      ['Variance Status', sheet.variance_status || ''],
      [],
      ['Portion Summary'],
      ['SwiftPOS Stock Item', 'Portion Size', 'Total Qty', 'Total Weight kg'],
      ...(sheet.portion_summary || []).map((row: any) => [
        row.stockItemName || '',
        `${row.portionSize || 0}g`,
        row.totalQty || 0,
        row.totalWeightKg || 0,
      ]),
    ]

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `portion-sheet-${sheet.stock_item || 'sheet'}-${sheet.sheet_date}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (loading) return <main style={{ padding: 30 }}>Loading sheet...</main>
  if (!sheet) return <main style={{ padding: 30 }}>Sheet not found.</main>

  return (
    <main style={{ padding: 30 }}>
      <h1>Full Portion Sheet</h1>

      <button onClick={printSheet} style={button}>Print</button>
      <button onClick={exportSheetCSV} style={button}>Export CSV</button>

      <section style={card}>
        <p><strong>Date:</strong> {sheet.sheet_date}</p>
        <p><strong>Stock Item:</strong> {sheet.stock_item || '-'}</p>
        <p><strong>Prepared By:</strong> {sheet.prepared_by || '-'}</p>
        <p><strong>Checked By:</strong> {sheet.checked_by || '-'}</p>
        <p><strong>Status:</strong> {sheet.variance_status || '-'}</p>
      </section>

      <section style={card}>
        <h2>Variance Summary</h2>
        <p><strong>Net Usable Weight:</strong> {Number(sheet.net_usable_weight || 0).toFixed(2)} kg</p>
        <p><strong>Total Raw Portion Weight:</strong> {Number(sheet.total_raw_portion_weight || 0).toFixed(2)} kg</p>
        <p><strong>Cooked Raw Weight Used:</strong> {Number(sheet.total_cooked_raw_weight_used || 0).toFixed(2)} kg</p>
        <p><strong>Trim Usage:</strong> {Number(sheet.total_trim_usage || 0).toFixed(2)} kg</p>
        <p><strong>Total Accounted Weight:</strong> {Number(sheet.total_accounted_weight || 0).toFixed(2)} kg</p>
        <p><strong>True Variance:</strong> {Number(sheet.true_shortage_kg || 0).toFixed(2)} kg</p>
        <p><strong>True Variance %:</strong> {Number(sheet.true_shortage_percent || 0).toFixed(2)}%</p>
      </section>

      <section style={card}>
        <h2>Raw Portioning</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={cell}>Item</th>
              <th style={cell}>Portion Size g</th>
              <th style={cell}>Qty Produced</th>
            </tr>
          </thead>
          <tbody>
            {(sheet.raw_rows || []).map((row: any, index: number) => (
              <tr key={index}>
                <td style={cell}>{row.item}</td>
                <td style={cell}>{row.portionSize}</td>
                <td style={cell}>{row.qtyProduced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2>Cooked Yield</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={cell}>Cooked Item</th>
              <th style={cell}>Raw Stock Item</th>
              <th style={cell}>Raw Weight kg</th>
              <th style={cell}>Cooked Weight kg</th>
              <th style={cell}>Portion Size g</th>
            </tr>
          </thead>
          <tbody>
            {(sheet.cooked_rows || []).map((row: any, index: number) => (
              <tr key={index}>
                <td style={cell}>{row.cookedItemName}</td>
                <td style={cell}>{row.rawStockItemUsed}</td>
                <td style={cell}>{row.rawWeight}</td>
                <td style={cell}>{row.cookedWeight}</td>
                <td style={cell}>{row.portionSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2>Portion Summary for SwiftPOS</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={cell}>SwiftPOS Stock Item</th>
              <th style={cell}>Portion Size</th>
              <th style={cell}>Total Qty</th>
              <th style={cell}>Total Weight kg</th>
            </tr>
          </thead>
          <tbody>
            {(sheet.portion_summary || []).map((row: any, index: number) => (
              <tr key={index}>
                <td style={cell}>{row.stockItemName}</td>
                <td style={cell}>{row.portionSize}g</td>
                <td style={cell}>{row.totalQty}</td>
                <td style={cell}>{Number(row.totalWeightKg || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

const card = {
  background: '#fff',
  padding: 20,
  marginBottom: 20,
  borderRadius: 8,
  boxShadow: '0 2px 6px rgba(0,0,0,.08)',
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const cell = {
  border: '1px solid #ddd',
  padding: 10,
  textAlign: 'left' as const,
}

const button = {
  background: 'orange',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 4,
  marginRight: 10,
  marginBottom: 20,
  cursor: 'pointer',
  fontWeight: 700,
}