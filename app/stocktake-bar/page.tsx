'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Bottle {
  id?: string
  plu_code: string
  item_name: string
  swiftpos_group: string
  count_type: string
  bottle_size_ml: number
  empty_bottle_weight_kg: number
  full_bottle_weight_kg: number
}

interface CountRow {
  plu_code: string
  item_name: string
  swiftpos_group: string
  count_type: string

  sealed_qty: number
  open_weight_kg: number
  unit_qty: number

  total_weight_kg: number
}

export default function BarStocktakePage() {
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [rows, setRows] = useState<CountRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data } = await supabase
      .from('bottle_master')
      .select('*')
      .eq('active', true)
      .order('item_name')

    const mapped =
      data?.map((item) => ({
        plu_code: item.plu_code,
        item_name: item.item_name,
        swiftpos_group: item.swiftpos_group,
        count_type: item.count_type || 'WEIGHT',

        sealed_qty: 0,
        open_weight_kg: 0,
        unit_qty: 0,

        total_weight_kg: 0,
      })) || []

    setBottles(data || [])
    setRows(mapped)

    setLoading(false)
  }

  function updateRow(
    index: number,
    field: string,
    value: number
  ) {
    const updated = [...rows]

    updated[index] = {
      ...updated[index],
      [field]: value,
    }

    const bottle = bottles[index]

    if (updated[index].count_type === 'WEIGHT') {
      updated[index].total_weight_kg =
        updated[index].open_weight_kg +
        updated[index].sealed_qty *
          bottle.full_bottle_weight_kg
    } else {
      updated[index].total_weight_kg =
        updated[index].unit_qty
    }

    setRows(updated)
  }

  const filteredRows = useMemo(() => {
    return rows
  }, [rows])

  function exportCSV() {
    const locationNumber = 2

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

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1 className="text-2xl font-bold">
          Bar Stocktake
        </h1>

        <button
          onClick={exportCSV}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Export SwiftPOS CSV
        </button>
      </div>

      <div
        style={{
          overflowX: 'auto',
          background: '#fff',
          borderRadius: 8,
          padding: 20,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
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
              <tr key={index}>
                <td style={tdStyle}>
                  {row.plu_code}
                </td>

                <td style={tdStyle}>
                  {row.item_name}
                </td>

                <td style={tdStyle}>
                  {row.swiftpos_group}
                </td>

                <td style={tdStyle}>
                  {row.count_type}
                </td>

                <td style={tdStyle}>
                  {row.count_type ===
                  'WEIGHT' ? (
                    <input
                      type="number"
                      value={row.sealed_qty}
                      onChange={(e) =>
                        updateRow(
                          index,
                          'sealed_qty',
                          Number(e.target.value)
                        )
                      }
                      style={inputStyle}
                    />
                  ) : (
                    '-'
                  )}
                </td>

                <td style={tdStyle}>
                  {row.count_type ===
                  'WEIGHT' ? (
                    <input
                      type="number"
                      step="0.001"
                      value={row.open_weight_kg}
                      onChange={(e) =>
                        updateRow(
                          index,
                          'open_weight_kg',
                          Number(e.target.value)
                        )
                      }
                      style={inputStyle}
                    />
                  ) : (
                    '-'
                  )}
                </td>

                <td style={tdStyle}>
                  {row.count_type ===
                  'UNIT' ? (
                    <input
                      type="number"
                      value={row.unit_qty}
                      onChange={(e) =>
                        updateRow(
                          index,
                          'unit_qty',
                          Number(e.target.value)
                        )
                      }
                      style={inputStyle}
                    />
                  ) : (
                    '-'
                  )}
                </td>

                <td style={tdStyle}>
                  {row.total_weight_kg.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle = {
  border: '1px solid #d1d5db',
  padding: '12px',
  background: '#0f172a',
  color: '#ffffff',
  textAlign: 'left' as const,
  fontWeight: 600,
  position: 'sticky' as const,
  top: 0,
  zIndex: 1,
}

const tdStyle = {
  border: '1px solid #e5e7eb',
  padding: '10px',
  background: '#ffffff',
  color: '#111827',
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#ffffff',
  color: '#111827',
  fontSize: '14px',
}

const cardStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}