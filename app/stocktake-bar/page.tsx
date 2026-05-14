'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Bottle {
  id: string
  plu_code: string
  item_name: string
  swiftpos_group: string
  bottle_size_ml: number
  empty_bottle_weight_kg: number
  full_bottle_weight_kg: number
  active: boolean
}

interface CountRow extends Bottle {
  sealed_qty: number
  open_weight_kg: number
  total_weight_kg: number
}

export default function BarStocktakePage() {
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [rows, setRows] = useState<CountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [groupFilter, setGroupFilter] = useState('ALL')

  useEffect(() => {
    loadBottles()
  }, [])

  async function loadBottles() {
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

    setBottles(data || [])

    setRows(
      (data || []).map((item: Bottle) => ({
        ...item,
        sealed_qty: 0,
        open_weight_kg: 0,
        total_weight_kg: 0,
      }))
    )

    setLoading(false)
  }

  const groups = useMemo(() => {
    const unique = Array.from(
      new Set(bottles.map((x) => x.swiftpos_group).filter(Boolean))
    )
    return ['ALL', ...unique]
  }, [bottles])

  const filteredRows = useMemo(() => {
    if (groupFilter === 'ALL') return rows
    return rows.filter((x) => x.swiftpos_group === groupFilter)
  }, [rows, groupFilter])

  function updateRow(
    id: string,
    field: 'sealed_qty' | 'open_weight_kg',
    value: number
  ) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row

        const updated = {
          ...row,
          [field]: value,
        }

        const sealedWeight =
          Number(updated.sealed_qty || 0) *
          Number(updated.full_bottle_weight_kg || 0)

        updated.total_weight_kg =
          sealedWeight + Number(updated.open_weight_kg || 0)

        return updated
      })
    )
  }



  if (loading) {
    return <div style={pageStyle}>Loading...</div>
  }
function exportCSV() {
  const locationNumber = 2 // Main Bar

  const headers = [
    'PLU_Number',
    'InventoryCount',
    'Location_Number',
  ]

  const csvRows = filteredRows
    .filter((row) => Number(row.total_weight_kg || 0) > 0)
    .map((row) => [
      row.plu_code,
      row.total_weight_kg.toFixed(3),
      locationNumber,
    ])

  const csv = [
    headers.join(','),
    ...csvRows.map((r) => r.join(',')),
  ].join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'swiftpos-main-bar-count.csv'
  link.click()

  URL.revokeObjectURL(url)
}
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Bar Bottle Count</h1>

        <div style={toolbarStyle}>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={inputStyle}
          >
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <button onClick={exportCSV} style={buttonStyle}>
            Export SwiftPOS CSV
          </button>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Full KG</th>
              <th style={thStyle}>Sealed Qty</th>
              <th style={thStyle}>Open Weight KG</th>
              <th style={thStyle}>Total Weight KG</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.plu_code}</td>
                <td style={tdStyle}>{row.item_name}</td>
                <td style={tdStyle}>{row.swiftpos_group}</td>
                <td style={tdStyle}>
                  {Number(row.full_bottle_weight_kg || 0).toFixed(3)}
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    min="0"
                    value={row.sealed_qty}
                    onChange={(e) =>
                      updateRow(row.id, 'sealed_qty', Number(e.target.value))
                    }
                    style={smallInputStyle}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={row.open_weight_kg}
                    onChange={(e) =>
                      updateRow(row.id, 'open_weight_kg', Number(e.target.value))
                    }
                    style={smallInputStyle}
                  />
                </td>
                <td style={tdStyle}>
                  <strong>{row.total_weight_kg.toFixed(3)}</strong>
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={7}>
                  No active bottles found. Add bottles in Bar Bottle Master first.
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

const cardStyle = {
  background: '#ffffff',
  color: '#111827',
  padding: 24,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const headingStyle = {
  fontSize: 28,
  fontWeight: '700',
  marginBottom: 20,
  color: '#111827',
}

const toolbarStyle = {
  display: 'flex',
  gap: 15,
  marginBottom: 20,
  alignItems: 'center',
}

const inputStyle = {
  padding: 10,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#111827',
}

const smallInputStyle = {
  width: 110,
  padding: 8,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#111827',
}

const buttonStyle = {
  padding: '10px 16px',
  background: '#059669',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: '600',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  background: '#ffffff',
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
  color: '#111827',
}