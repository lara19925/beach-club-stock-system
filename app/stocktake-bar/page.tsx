'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Bottle {
  plu_code: string
  item_name: string
  swiftpos_group: string
  count_type: string
  full_bottle_weight_kg: number
}

interface CountRow extends Bottle {
  sealed_qty: number
  open_weight_kg: number
  unit_qty: number
  total_weight_kg: number
}

export default function BarStocktakePage() {
  const [rows, setRows] = useState<CountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [stocktakeDate, setStocktakeDate] = useState(new Date().toISOString().split('T')[0])
  const [countedBy, setCountedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
const [groupFilter, setGroupFilter] = useState('ALL')
const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data, error } = await supabase
      .from('bottle_master')
      .select('*')
      .eq('active', true)
      .order('item_name')

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setRows(
      (data || []).map((item: any) => ({
        plu_code: item.plu_code,
        item_name: item.item_name,
        swiftpos_group: item.swiftpos_group,
        count_type: item.count_type || 'WEIGHT',
        full_bottle_weight_kg: Number(item.full_bottle_weight_kg || 0),
        sealed_qty: 0,
        open_weight_kg: 0,
        unit_qty: 0,
        total_weight_kg: 0,
      }))
    )

    setLoading(false)
  }

  function updateRow(index: number, field: 'sealed_qty' | 'open_weight_kg' | 'unit_qty', value: number) {
    const updated = [...rows]
    updated[index] = { ...updated[index], [field]: value }

    if (updated[index].count_type === 'UNIT') {
      updated[index].total_weight_kg = Number(updated[index].unit_qty || 0)
    } else {
      updated[index].total_weight_kg =
        Number(updated[index].sealed_qty || 0) * Number(updated[index].full_bottle_weight_kg || 0) +
        Number(updated[index].open_weight_kg || 0)
    }

    setRows(updated)
  }

  async function saveStocktake(status: 'DRAFT' | 'FINAL') {
    if (!countedBy.trim()) {
      alert('Please enter counted by')
      return
    }

    const countedRows = rows.filter((row) => Number(row.total_weight_kg || 0) > 0)

    if (countedRows.length === 0) {
      alert('No counted items to save')
      return
    }

    setSaving(true)

    const { data: session, error: sessionError } = await supabase
      .from('bar_stocktake_sessions')
      .insert([
        {
          stocktake_date: stocktakeDate,
          location: 'Main Bar',
          location_number: 2,
          counted_by: countedBy,
          status,
          notes,
        },
      ])
      .select()
      .single()

    if (sessionError) {
      alert(sessionError.message)
      setSaving(false)
      return
    }

    const lines = countedRows.map((row) => ({
      session_id: session.id,
      plu_code: row.plu_code,
      item_name: row.item_name,
      swiftpos_group: row.swiftpos_group,
      count_type: row.count_type,
      sealed_qty: row.sealed_qty,
      open_weight_kg: row.open_weight_kg,
      unit_qty: row.unit_qty,
      inventory_count: row.total_weight_kg,
      location_number: 2,
    }))

    const { error: lineError } = await supabase
      .from('bar_stocktake_lines')
      .insert(lines)

    setSaving(false)

    if (lineError) {
      alert(lineError.message)
      return
    }

    alert(`Stocktake saved as ${status}`)
  }
const filteredRows = rows.filter((row) => {
  const matchesSearch =
    row.item_name.toLowerCase().includes(search.toLowerCase()) ||
    row.plu_code.toString().includes(search)

  const matchesGroup =
    groupFilter === 'ALL' || row.swiftpos_group === groupFilter

  const matchesType =
    typeFilter === 'ALL' || row.count_type === typeFilter

  return matchesSearch && matchesGroup && matchesType
})

const groupOptions = [
  'ALL',
  ...Array.from(new Set(rows.map((row) => row.swiftpos_group).filter(Boolean))),
]

  function exportCSV() {
    const headers = ['PLU_Number', 'InventoryCount', 'Location_Number']

    const csvRows = filteredRows
      .filter((row) => Number(row.total_weight_kg || 0) > 0)
      .map((row) => [
        row.plu_code,
        row.total_weight_kg.toFixed(3),
        2,
      ])

    const csv = [
      headers.join(','),
      ...csvRows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'swiftpos-main-bar-count.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={pageStyle}>Loading...</div>

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Bar Stocktake</h1>

      <div style={toolbarStyle}>
        <input type="date" value={stocktakeDate} onChange={(e) => setStocktakeDate(e.target.value)} style={inputStyle} />
        <input placeholder="Counted By" value={countedBy} onChange={(e) => setCountedBy(e.target.value)} style={inputStyle} />
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />

        <button onClick={() => saveStocktake('DRAFT')} disabled={saving} style={buttonStyle}>Save Draft</button>
        <button onClick={() => saveStocktake('FINAL')} disabled={saving} style={buttonStyle}>Finalize</button>
        <button onClick={exportCSV} style={buttonStyle}>Export SwiftPOS CSV</button>
      </div>

      <div style={cardStyle}>

  <div style={filterStyle}>
    <input
      placeholder="Search item or PLU"
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

    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
      style={inputStyle}
    >
      <option value="ALL">All Types</option>
      <option value="WEIGHT">WEIGHT</option>
      <option value="UNIT">UNIT</option>
    </select>
  </div>

  <table style={tableStyle}>

          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Sealed Qty</th>
              <th style={thStyle}>Open KG</th>
              <th style={thStyle}>Unit Qty</th>
              <th style={thStyle}>InventoryCount</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={`${row.plu_code}-${index}`}>
                <td style={tdStyle}>{row.plu_code}</td>
                <td style={tdStyle}>{row.item_name}</td>
                <td style={tdStyle}>{row.swiftpos_group}</td>
                <td style={tdStyle}>{row.count_type}</td>

                <td style={tdStyle}>
                  {row.count_type === 'WEIGHT' ? (
                    <input type="number" value={row.sealed_qty} onChange={(e) => updateRow(index, 'sealed_qty', Number(e.target.value))} style={smallInputStyle} />
                  ) : '-'}
                </td>

                <td style={tdStyle}>
                  {row.count_type === 'WEIGHT' ? (
                    <input type="number" step="0.001" value={row.open_weight_kg} onChange={(e) => updateRow(index, 'open_weight_kg', Number(e.target.value))} style={smallInputStyle} />
                  ) : '-'}
                </td>

                <td style={tdStyle}>
                  {row.count_type === 'UNIT' ? (
                    <input type="number" value={row.unit_qty} onChange={(e) => updateRow(index, 'unit_qty', Number(e.target.value))} style={smallInputStyle} />
                  ) : '-'}
                </td>

                <td style={tdStyle}><strong>{row.total_weight_kg.toFixed(3)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const pageStyle = { padding: 20, background: '#f3f4f6', minHeight: '100vh', color: '#111827' }
const headingStyle = { fontSize: 28, fontWeight: '700', marginBottom: 20, color: '#111827' }
const toolbarStyle = { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' as const }
const cardStyle = { background: '#ffffff', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' as const }
const inputStyle = { padding: 10, border: '1px solid #d1d5db', borderRadius: 6, background: '#ffffff', color: '#111827' }
const smallInputStyle = { width: 100, padding: 8, border: '1px solid #d1d5db', borderRadius: 6, background: '#ffffff', color: '#111827' }
const buttonStyle = { padding: '10px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, background: '#ffffff' }
const thStyle = { border: '1px solid #d1d5db', padding: 12, background: '#111827', color: '#ffffff', textAlign: 'left' as const }
const tdStyle = { border: '1px solid #e5e7eb', padding: 10, color: '#111827' }
const filterStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gap: 12,
  marginBottom: 20,
}