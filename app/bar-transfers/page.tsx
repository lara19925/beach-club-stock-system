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
  transfer_type: string
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
  transfer_type: 'TRANSFER',
  notes: '',
  created_by: '',
}

export default function BarTransfersPage() {
  const [items, setItems] = useState<BarItem[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [form, setForm] = useState<TransferRow>(blankForm)

  useEffect(() => {
    loadItems()
    loadTransfers()
  }, [])

  async function loadItems() {
    const { data, error } = await supabase
      .from('bottle_master')
      .select('*')
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
    const s = search.toLowerCase()

    if (!s) return items

    return items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(s) ||
        item.plu_code.toLowerCase().includes(s) ||
        item.swiftpos_group?.toLowerCase().includes(s)
    )
  }, [items, search])

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const dateMatch =
        !dateFilter || transfer.transfer_date === dateFilter

      const s = search.toLowerCase()

      const searchMatch =
        !s ||
        transfer.item_name?.toLowerCase().includes(s) ||
        transfer.plu_code?.toLowerCase().includes(s)

      return dateMatch && searchMatch
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
    if (!form.plu_code) {
      alert('Select an item')
      return
    }

    if (!form.qty || Number(form.qty) <= 0) {
      alert('Enter quantity')
      return
    }

    if (!form.created_by.trim()) {
      alert('Enter created by')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('bar_transfers').insert([
      {
        transfer_date: form.transfer_date,
        plu_code: form.plu_code,
        item_name: form.item_name,
        qty: Number(form.qty),
        from_location: form.from_location,
        to_location: form.to_location,
        transfer_type: 'TRANSFER',
        notes: form.notes,
        created_by: form.created_by,
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
    })

    loadTransfers()
  }

  async function deleteTransfer(id?: string) {
    if (!id) return

    const confirmed = confirm('Delete transfer?')

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
      'From',
      'To',
      'Created By',
      'Notes',
    ]

    const rows = filteredTransfers.map((row) => [
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
      ...rows.map((row) =>
        row.map((v) => `"${String(v ?? '')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'bar-transfers.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Bar Transfers</h1>

      <div style={cardStyle}>
        <h2 style={subheadingStyle}>Add Transfer</h2>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.transfer_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  transfer_date: e.target.value,
                })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Search Item</label>
            <input
              placeholder="Search item or PLU"
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
              <option value="">Select Item</option>

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
                setForm({
                  ...form,
                  qty: Number(e.target.value),
                })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>From Location</label>
            <select
              value={form.from_location}
              onChange={(e) =>
                setForm({
                  ...form,
                  from_location: e.target.value,
                })
              }
              style={inputStyle}
            >
              <option>Warehouse</option>
              <option>Main Bar</option>
              <option>Kitchen 1</option>
              <option>Kitchen 2</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>To Location</label>
            <select
              value={form.to_location}
              onChange={(e) =>
                setForm({
                  ...form,
                  to_location: e.target.value,
                })
              }
              style={inputStyle}
            >
              <option>Main Bar</option>
              <option>Warehouse</option>
              <option>Kitchen 1</option>
              <option>Kitchen 2</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Created By</label>
            <input
              value={form.created_by}
              onChange={(e) =>
                setForm({
                  ...form,
                  created_by: e.target.value,
                })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <input
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
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
        <div style={topBarStyle}>
          <h2 style={subheadingStyle}>Transfer History</h2>

          <button onClick={exportCSV} style={darkButtonStyle}>
            Export CSV
          </button>
        </div>

        <div style={filterStyle}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Search transfers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
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
              <th style={thStyle}>Action</th>
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
                    style={deleteButtonStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredTransfers.length === 0 && (
              <tr>
                <td colSpan={9} style={tdStyle}>
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
}

const headingStyle = {
  fontSize: 40,
  fontWeight: 700,
  marginBottom: 20,
}

const subheadingStyle = {
  fontSize: 30,
  fontWeight: 700,
}

const cardStyle = {
  background: '#ffffff',
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 20,
}

const filterStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  gap: 12,
  marginBottom: 16,
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '1px solid #d1d5db',
}

const buttonStyle = {
  padding: '12px 18px',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
}

const darkButtonStyle = {
  padding: '12px 18px',
  background: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

const deleteButtonStyle = {
  padding: '8px 12px',
  background: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const thStyle = {
  background: '#111827',
  color: '#ffffff',
  padding: 12,
  textAlign: 'left' as const,
}

const tdStyle = {
  borderBottom: '1px solid #e5e7eb',
  padding: 12,
}