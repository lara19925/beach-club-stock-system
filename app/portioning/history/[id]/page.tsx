'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PortionSheetDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [sheet, setSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    if (id) loadSheet()
  }, [id])

  async function loadSheet() {
    console.log('OPEN SHEET ID:', id)

    const { data, error } = await supabase
      .from('portion_sheets')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    console.log('SUPABASE DATA:', data)
    console.log('SUPABASE ERROR:', error)

    if (error) {
      setErrorText(error.message)
    } else {
      setSheet(data)
    }

    setLoading(false)
  }

  if (loading) return <main style={{ padding: 30 }}>Loading sheet...</main>

  if (errorText) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Could not load full portion sheet</h1>
        <p>{errorText}</p>
        <p><strong>Sheet ID:</strong> {id}</p>
      </main>
    )
  }

  if (!sheet) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Sheet not found</h1>
        <p><strong>Sheet ID:</strong> {id}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>Full Portion Sheet</h1>

      <button onClick={() => window.print()}>Print</button>

      <h2>Sheet Details</h2>
      <p><strong>Date:</strong> {sheet.sheet_date}</p>
      <p><strong>Stock Item:</strong> {sheet.stock_item}</p>
      <p><strong>Prepared By:</strong> {sheet.prepared_by}</p>
      <p><strong>Checked By:</strong> {sheet.checked_by}</p>
      <p><strong>Status:</strong> {sheet.variance_status}</p>

      <h2>Variance Summary</h2>
      <p><strong>Net Usable Weight:</strong> {Number(sheet.net_usable_weight || 0).toFixed(2)} kg</p>
      <p><strong>Total Accounted Weight:</strong> {Number(sheet.total_accounted_weight || 0).toFixed(2)} kg</p>
      <p><strong>True Variance:</strong> {Number(sheet.true_shortage_kg || 0).toFixed(2)} kg</p>
      <p><strong>True Variance %:</strong> {Number(sheet.true_shortage_percent || 0).toFixed(2)}%</p>

      <h2>Portion Summary</h2>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>SwiftPOS Stock Item</th>
            <th>Portion Size</th>
            <th>Total Qty</th>
            <th>Total Weight kg</th>
          </tr>
        </thead>
        <tbody>
          {(sheet.portion_summary || []).map((row: any, index: number) => (
            <tr key={index}>
              <td>{row.stockItemName}</td>
              <td>{row.portionSize}g</td>
              <td>{row.totalQty}</td>
              <td>{Number(row.totalWeightKg || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}