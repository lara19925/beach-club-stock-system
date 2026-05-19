'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BarItem {
  id?: string
  plu_code: string
  item_name: string
  swiftpos_group: string
  count_type: 'WEIGHT' | 'UNIT'
}

interface TransferRow {
  id?: string
  transfer_date: string
  plu_code: string
  item_name: string
  qty: number
  from_location: string
  to_location: string
  notes: string
  created_by: string
  created_at?: string
}

const blankForm: TransferRow = {
  transfer_date: new Date().toISOString().split('T')[0],
  plu_code: '',
  item_name: '',
  qty: 0,
  from_location: 'Warehouse',
  to_location: 'Main Bar',
  notes: '',
  created_by: '',
}

export default function BarTransfersPage() {
  const [items, setItems] = useState<BarItem[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [form, setForm] = useState<TransferRow>(blankForm)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadItems()
    loadTransfers()
  }, [])

  async function loadItems() {
    const { data, error } = await supabase
      .from('bottle_master')
      .select('id, plu_code, item_name, swiftpos_group, count_type')
      .eq('active', true)
      .eq('count_type', 'UNIT')
      .order('item_name')

    if (error) {
      alert(error.message)
      return
    }

    setItems(data || [])
  }

  async function loadTransfers() {
    const { data, error } = await supabase
      .from('bar_transfers')
      .select('*')
      .order('transfer_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setTransfers(data || [])
  }

  const filteredItems = useMemo(() => {
    const searchText = search.toLowerCase().trim()

    if (!searchText) return items

    return items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(searchText) ||
        item.plu_code.toLowerCase().includes(searchText) ||
        item.swiftpos_group.toLowerCase().includes(searchText)
    )
  }, [items, search])

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const dateOk =
        !dateFilter || transfer.transfer_date === dateFilter

      const searchText = search.toLowerCase().trim()

      const searchOk =
        !searchText ||
        transfer.item_name.toLowerCase().includes(searchText) ||
        transfer.plu_code.toLowerCase().includes(searchText) ||
        transfer.from_location.toLowerCase().includes(searchText) ||
        transfer.to_location.toLowerCase().includes(searchText)

      return dateOk && searchOk
    })
  }, [transfers, dateFilter, search])

  function selectItem(pluCode: string) {
    const item = items.find((i) => i.plu_code === pluCode)

    setForm({
      ...form,
      plu_code: pluCode,
      item_name: item?.item_name || '',
    })
  }

  async function saveTransfer() {
    if (!form.transfer_date) {
      alert('Transfer date is required')
      return
    }

    if (!form.plu_code) {
      alert('Select an item')
      return
    }

    if (!form.qty || Number(form.qty) <= 0) {
      alert('Enter a valid quantity')
      return
    }

    if (!form.from_location.trim()) {
      alert('From location is required')
      return
    }

    if (!form.to_location.trim()) {
      alert('To location is required')
      return
    }

    if (!form.created_by.trim()) {
      alert('Created by is required')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('bar_transfers').insert([
      {
        transfer_date: form.transfer_date,
        plu_code: form.plu_code,
        item_name: form.item_name,
        qty: Number(form.qty),
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        notes: form.notes.trim(),
        created_by: form.created_by.trim(),
      },
    ])

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Transfer saved')

    setForm({
      ...blankForm,
      transfer_date: form.transfer_date,
      created_by: form.created_by,
      from_location: form.from_location,
      to_location: form.to_location,
    })

    loadTransfers()
  }

  async function deleteTransfer(id?: string) {
    if (!id) return

    const confirmed = confirm('Delete this transfer?')
    if (!confirmed) return

    const { error } = await supabase
      .from('bar_transfers')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    loadTransfers()
  }

  function exportCSV() {
    const headers = [
      'Date',
      'PLU',
      'Item',
      'Qty',
      'From Location',
      'To Location',
      'Created By',
      'Notes',
    ]

    const csvRows = filteredTransfers.map((row) => [
      row.transfer_date,
      row.plu_code,
      row.item_name,
      row.qty,
      row.from_location,
      row.to_location,
      row.created_by,
      row.notes,
    ])

    const csv = [
      headers.join(','),
      ...csvRows.map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `bar-transfers-${dateFilter || 'all'}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Bar Transfers</h1>

      <div style={cardStyle}>
        <h2 style={subheadingStyle}>Add Transfer</h2>

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.transfer_date}
              onChange={(e) =>
                setForm({ ...form, transfer_date: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Search Item</label>
            <input
              placeholder="Search item, PLU, or group"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Item</label>
            <select
              value={form.plu_code}
              onChange={(e) => selectItem(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select item</option>
              {filteredItems.map((item) => (
                <option key={item.plu_code} value={item.plu_code}>
                  {item.item_name} ({item.plu_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Qty</label>
            <input
              type="number"
              min="0"
              value={form.qty}
              onChange={(e) =>
                setForm({ ...form, qty: Number(e.target.value) })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>From Location</label>
            <select
              value={form.from_location}
              onChange={(e) =>
                setForm({ ...form, from_location: e.target.value })
              }
              style={inputStyle}
            >
              <option value="Warehouse">Warehouse</option>
              <option value="Main Bar">Main Bar</option>
              <option value="Kitchen 1">Kitchen 1</option>
              <option value="Kitchen 2">Kitchen 2</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>To Location</label>
            <select
              value={form.to_location}
              onChange={(e) =>
                setForm({ ...form, to_location: e.target.value })
              }
              style={inputStyle}
            >
              <option value="Main Bar">Main Bar</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Kitchen 1">Kitchen 1</option>
              <option value="Kitchen 2">Kitchen 2</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Created By</label>
            <input
              value={form.created_by}
              onChange={(e) =>
                setForm({ ...form, created_by: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <input
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={saveTransfer}
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? 'Saving...' : 'Save Transfer'}
        </button>
      </div>

      <div style={cardStyle}>
        <div style={topRowStyle}>
          <h2 style={subheadingStyle}>Transfer History</h2>

          <button onClick={exportCSV} style={secondaryButtonStyle}>
            Export CSV
          </button>
        </div>

        <div style={filterGridStyle}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Search transfer history"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={resultBarStyle}>
          Showing {filteredTransfers.length} of {transfers.length} transfers
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>From</th>
              <th style={thStyle}>To</th>
              <th style={thStyle}>Created By</th>
              <th style={thStyle}>Notes</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransfers.map((transfer) => (
              <tr key={transfer.id}>
                <td style={tdStyle}>{transfer.transfer_date}</td>
                <td style={tdStyle}>{transfer.plu_code}</td>
                <td style={tdStyle}>{transfer.item_name}</td>
                <td style={tdStyle}>{transfer.qty}</td>
                <td style={tdStyle}>{transfer.from_location}</td>
                <td style={tdStyle}>{transfer.to_location}</td>
                <td style={tdStyle}>{transfer.created_by}</td>
                <td style={tdStyle}>{transfer.notes}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => deleteTransfer(transfer.id)}
                    style={dangerButtonStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredTransfers.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={9}>
                  No transfers found.
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

const subheadingStyle = {
  fontSize: 22,
  fontWeight: '700',
  margin: 0,
  marginBottom: 16,
}

const cardStyle = {
  background: '#ffffff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  marginBottom: 20,
  overflowX: 'auto' as const,
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  marginBottom: 16,
}

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  gap: 12,
  marginBottom: 12,
}

const topRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const dangerButtonStyle = {
  padding: '8px 12px',
  background: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
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