'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SaleLine {
  plu_code: string
  item_name: string
  qty_sold: number
}

export default function BarSalesUploadPage() {
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0])
  const [uploadedBy, setUploadedBy] = useState('')
  const [rows, setRows] = useState<SaleLine[]>([])
  const [saving, setSaving] = useState(false)

  async function importCSV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter((line) => line.trim() !== '')

    if (lines.length < 2) {
      alert('CSV has no rows')
      return
    }

    const headers = lines[0]
      .split(',')
      .map((h) => h.replace(/"/g, '').trim().toLowerCase())

    const importedRows = lines
      .slice(1)
      .map((line) => {
        const values = line.split(',').map((v) => v.replace(/"/g, '').trim())
        const row: any = {}

        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        return {
          plu_code:
            row['plu'] ||
            row['plu code'] ||
            row['plu_number'] ||
            row['plu number'] ||
            row['code'] ||
            '',
          item_name:
            row['item'] ||
            row['item name'] ||
            row['description'] ||
            row['product'] ||
            '',
          qty_sold: Number(
            row['qty sold'] ||
              row['qty_sold'] ||
              row['quantity'] ||
              row['quantity sold'] ||
              row['qty'] ||
              row['sold'] ||
              0
          ),
        }
      })
      .filter((row) => row.plu_code && row.qty_sold > 0)

    setRows(importedRows)
    event.target.value = ''
  }

  async function saveUpload() {
    if (!salesDate) {
      alert('Sales date is required')
      return
    }

    if (!uploadedBy.trim()) {
      alert('Uploaded by is required')
      return
    }

    if (rows.length === 0) {
      alert('No sales rows to save')
      return
    }

    setSaving(true)

    const { data: upload, error: uploadError } = await supabase
      .from('bar_sales_imports')
      .insert([
        {
          sales_date: salesDate,
          uploaded_by: uploadedBy.trim(),
        },
      ])
      .select()
      .single()

    if (uploadError) {
      alert(uploadError.message)
      setSaving(false)
      return
    }

    const lines = rows.map((row) => ({
      import_id: upload.id,
      sales_date: salesDate,
      plu_code: row.plu_code,
      item_name: row.item_name,
      qty_sold: row.qty_sold,
    }))

    const { error: linesError } = await supabase
      .from('bar_sales_lines')
      .insert(lines)

    setSaving(false)

    if (linesError) {
      alert(linesError.message)
      return
    }

    alert(`${rows.length} sales lines saved`)
    setRows([])
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Bar Sales Upload</h1>

      <div style={cardStyle}>
        <div style={toolbarStyle}>
          <input
            type="date"
            value={salesDate}
            onChange={(e) => setSalesDate(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Uploaded By"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            style={inputStyle}
          />

          <label style={importButtonStyle}>
            Import SwiftPOS Sales CSV
            <input
              type="file"
              accept=".csv"
              onChange={importCSV}
              style={{ display: 'none' }}
            />
          </label>

          <button onClick={saveUpload} disabled={saving} style={buttonStyle}>
            {saving ? 'Saving...' : 'Save Sales Upload'}
          </button>
        </div>

        <p style={mutedStyle}>
          Accepted CSV columns: PLU, PLU Code, Description, Item, Qty Sold, Quantity, Qty.
        </p>

        <div style={resultBarStyle}>
          Loaded Rows: <strong>{rows.length}</strong>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Qty Sold</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.plu_code}-${index}`}>
                <td style={tdStyle}>{row.plu_code}</td>
                <td style={tdStyle}>{row.item_name}</td>
                <td style={tdStyle}>{row.qty_sold}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={3}>
                  No sales uploaded yet.
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
  overflowX: 'auto' as const,
}

const toolbarStyle = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap' as const,
  marginBottom: 12,
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

const importButtonStyle = {
  padding: '10px 16px',
  background: '#059669',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
}

const mutedStyle = {
  color: '#6b7280',
  marginBottom: 12,
}

const resultBarStyle = {
  marginBottom: 12,
  fontSize: 14,
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