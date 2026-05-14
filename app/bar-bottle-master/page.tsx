'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BottleMaster {
  id?: string
  plu_code: string
  item_name: string
  swiftpos_group: string
  count_type: 'WEIGHT' | 'UNIT'
  bottle_size_ml: number
  empty_bottle_weight_kg: number
  full_bottle_weight_kg: number
  active: boolean
}

const blankForm: BottleMaster = {
  plu_code: '',
  item_name: '',
  swiftpos_group: '',
  count_type: 'WEIGHT',
  bottle_size_ml: 0,
  empty_bottle_weight_kg: 0,
  full_bottle_weight_kg: 0,
  active: true,
}

export default function BarBottleMasterPage() {
  const formRef = useRef<HTMLDivElement | null>(null)

  const [items, setItems] = useState<BottleMaster[]>([])
  const [form, setForm] = useState<BottleMaster>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const { data, error } = await supabase
      .from('bottle_master')
      .select('*')
      .order('swiftpos_group')
      .order('item_name')

    if (error) {
      alert(error.message)
      return
    }

    setItems(data || [])
  }

  const groupOptions = useMemo(() => {
    const groups = items
      .map((item) => item.swiftpos_group || 'NO GROUP')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    return ['ALL', ...Array.from(new Set(groups))]
  }, [items])

  const filteredItems = useMemo(() => {
    const searchText = search.toLowerCase().trim()

    return items.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.item_name?.toLowerCase().includes(searchText) ||
        item.plu_code?.toLowerCase().includes(searchText) ||
        item.swiftpos_group?.toLowerCase().includes(searchText)

      const matchesGroup =
        groupFilter === 'ALL' || item.swiftpos_group === groupFilter

      const matchesType =
        typeFilter === 'ALL' || item.count_type === typeFilter

      return matchesSearch && matchesGroup && matchesType && item.active !== false
    })
  }, [items, search, groupFilter, typeFilter])

  async function saveItem() {
    if (!form.plu_code.trim()) {
      alert('PLU Code is required')
      return
    }

    if (!form.item_name.trim()) {
      alert('Item name is required')
      return
    }

    setLoading(true)

    const payload = {
      plu_code: form.plu_code.trim(),
      item_name: form.item_name.trim(),
      swiftpos_group: form.swiftpos_group.trim(),
      count_type: form.count_type,
      bottle_size_ml: Number(form.bottle_size_ml || 0),
      empty_bottle_weight_kg:
        form.count_type === 'UNIT'
          ? 0
          : Number(form.empty_bottle_weight_kg || 0),
      full_bottle_weight_kg:
        form.count_type === 'UNIT'
          ? 0
          : Number(form.full_bottle_weight_kg || 0),
      active: true,
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('bottle_master')
        .update(payload)
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
        .from('bottle_master')
        .upsert([payload], {
          onConflict: 'plu_code',
        })

      error = result.error
    }

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert(editingId ? 'Bottle updated' : 'Bottle saved')

    setForm(blankForm)
    setEditingId(null)
    loadItems()
  }

  async function importCSV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()

    const lines = text
      .split('\n')
      .filter((line) => line.trim() !== '')

    if (lines.length < 2) {
      alert('CSV has no rows to import')
      return
    }

    const headers = lines[0]
      .split(',')
      .map((h) => h.replace(/"/g, '').trim().toLowerCase())

    const rows = lines
      .slice(1)
      .map((line) => {
        const values = line
          .split(',')
          .map((v) => v.replace(/"/g, '').trim())

        const row: any = {}

        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        const countType =
          String(row['count type'] || 'WEIGHT').toUpperCase() === 'UNIT'
            ? 'UNIT'
            : 'WEIGHT'

        return {
          plu_code: row['plu code'] || '',
          item_name: row['item name'] || row['item'] || '',
          swiftpos_group: row['swiftpos group'] || row['group'] || '',
          count_type: countType,
          bottle_size_ml: Number(row['bottle size ml'] || row['ml'] || 0),
          empty_bottle_weight_kg:
            countType === 'UNIT'
              ? 0
              : Number(row['empty bottle weight kg'] || row['empty kg'] || 0),
          full_bottle_weight_kg:
            countType === 'UNIT'
              ? 0
              : Number(row['full bottle weight kg'] || row['full kg'] || 0),
          active: true,
        }
      })
      .filter((row) => row.item_name && row.plu_code)

    if (rows.length === 0) {
      alert('No valid rows found. Check your CSV headers.')
      return
    }

    const confirmed = confirm(
      `Import or update ${rows.length} items? Existing PLUs will be updated.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('bottle_master')
      .upsert(rows, {
        onConflict: 'plu_code',
      })

    if (error) {
      alert(error.message)
      console.error(error)
      return
    }

    alert(`${rows.length} items imported or updated`)
    loadItems()
    event.target.value = ''
  }

  function exportCSV() {
    const headers = [
      'plu code',
      'item name',
      'swiftpos group',
      'count type',
      'bottle size ml',
      'empty bottle weight kg',
      'full bottle weight kg',
    ]

    const csvRows = filteredItems.map((item) => [
      item.plu_code,
      item.item_name,
      item.swiftpos_group,
      item.count_type,
      item.bottle_size_ml,
      item.empty_bottle_weight_kg,
      item.full_bottle_weight_kg,
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
    link.download = 'bar-bottle-master.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function editItem(item: BottleMaster) {
    setForm({
      id: item.id,
      plu_code: item.plu_code || '',
      item_name: item.item_name || '',
      swiftpos_group: item.swiftpos_group || '',
      count_type: item.count_type === 'UNIT' ? 'UNIT' : 'WEIGHT',
      bottle_size_ml: Number(item.bottle_size_ml || 0),
      empty_bottle_weight_kg: Number(item.empty_bottle_weight_kg || 0),
      full_bottle_weight_kg: Number(item.full_bottle_weight_kg || 0),
      active: item.active !== false,
    })

    setEditingId(item.id || null)

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  function cancelEdit() {
    setForm(blankForm)
    setEditingId(null)
  }

  async function deactivateItem(id?: string) {
    if (!id) return

    const confirmed = confirm('Deactivate this item?')
    if (!confirmed) return

    const { error } = await supabase
      .from('bottle_master')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    loadItems()
  }

  return (
    <div style={pageStyle}>
      <div ref={formRef} style={cardStyle}>
        <h1 style={headingStyle}>
          {editingId ? 'Edit Bottle / Bar Item' : 'Add Bottle / Bar Item'}
        </h1>

        <label style={labelStyle}>PLU Code</label>
        <input
          value={form.plu_code}
          onChange={(e) =>
            setForm({
              ...form,
              plu_code: e.target.value,
            })
          }
          style={inputStyle}
        />

        <label style={labelStyle}>Item Name</label>
        <input
          value={form.item_name}
          onChange={(e) =>
            setForm({
              ...form,
              item_name: e.target.value,
            })
          }
          style={inputStyle}
        />

        <label style={labelStyle}>SwiftPOS Group</label>
        <input
          value={form.swiftpos_group}
          onChange={(e) =>
            setForm({
              ...form,
              swiftpos_group: e.target.value,
            })
          }
          style={inputStyle}
        />

        <label style={labelStyle}>Count Type</label>
        <select
          value={form.count_type}
          onChange={(e) =>
            setForm({
              ...form,
              count_type: e.target.value as 'WEIGHT' | 'UNIT',
              empty_bottle_weight_kg:
                e.target.value === 'UNIT' ? 0 : form.empty_bottle_weight_kg,
              full_bottle_weight_kg:
                e.target.value === 'UNIT' ? 0 : form.full_bottle_weight_kg,
            })
          }
          style={inputStyle}
        >
          <option value="WEIGHT">WEIGHT, Spirits/Open Bottles</option>
          <option value="UNIT">UNIT, Beer/RTD/Soft Drinks/Water</option>
        </select>

        <label style={labelStyle}>Bottle Size (ML)</label>
        <input
          type="number"
          value={form.bottle_size_ml}
          onChange={(e) =>
            setForm({
              ...form,
              bottle_size_ml: Number(e.target.value),
            })
          }
          style={inputStyle}
        />

        {form.count_type === 'WEIGHT' && (
          <>
            <label style={labelStyle}>Empty Bottle Weight (KG)</label>
            <input
              type="number"
              step="0.001"
              value={form.empty_bottle_weight_kg}
              onChange={(e) =>
                setForm({
                  ...form,
                  empty_bottle_weight_kg: Number(e.target.value),
                })
              }
              style={inputStyle}
            />

            <label style={labelStyle}>Full Bottle Weight (KG)</label>
            <input
              type="number"
              step="0.001"
              value={form.full_bottle_weight_kg}
              onChange={(e) =>
                setForm({
                  ...form,
                  full_bottle_weight_kg: Number(e.target.value),
                })
              }
              style={inputStyle}
            />
          </>
        )}

        <div style={buttonRowStyle}>
          <button onClick={saveItem} disabled={loading} style={buttonStyle}>
            {loading
              ? 'Saving...'
              : editingId
                ? 'Save Changes'
                : 'Save Item'}
          </button>

          {editingId && (
            <button onClick={cancelEdit} style={secondaryButtonStyle}>
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={subheadingStyle}>Saved Bottles / Bar Items</h2>

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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="ALL">All Types</option>
            <option value="WEIGHT">WEIGHT</option>
            <option value="UNIT">UNIT</option>
          </select>

          <label style={importButtonStyle}>
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={importCSV}
              style={{ display: 'none' }}
            />
          </label>

          <button onClick={exportCSV} style={buttonStyle}>
            Export CSV
          </button>
        </div>

        <div style={resultBarStyle}>
          Showing {filteredItems.length} of {items.length} active items
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>ML</th>
              <th style={thStyle}>Empty KG</th>
              <th style={thStyle}>Full KG</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id || item.plu_code}>
                <td style={tdStyle}>{item.plu_code}</td>
                <td style={tdStyle}>{item.item_name}</td>
                <td style={tdStyle}>{item.swiftpos_group || 'NO GROUP'}</td>
                <td style={tdStyle}>{item.count_type}</td>
                <td style={tdStyle}>{item.bottle_size_ml}</td>
                <td style={tdStyle}>{item.empty_bottle_weight_kg}</td>
                <td style={tdStyle}>{item.full_bottle_weight_kg}</td>

                <td style={tdStyle}>
                  <button onClick={() => editItem(item)} style={smallButtonStyle}>
                    Edit
                  </button>

                  <button
                    onClick={() => deactivateItem(item.id)}
                    style={dangerButtonStyle}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}

            {filteredItems.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={8}>
                  No items found.
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
  marginBottom: 30,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  overflowX: 'auto' as const,
}

const headingStyle = {
  fontSize: 28,
  fontWeight: '700',
  marginBottom: 20,
  color: '#111827',
}

const subheadingStyle = {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 20,
  color: '#111827',
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  color: '#111827',
}

const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 15,
  color: '#111827',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 6,
}

const buttonRowStyle = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
}

const buttonStyle = {
  padding: '12px 20px',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButtonStyle = {
  padding: '12px 20px',
  background: '#6b7280',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
}

const smallButtonStyle = {
  padding: '8px 12px',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  marginRight: 8,
  marginBottom: 6,
}

const dangerButtonStyle = {
  padding: '8px 12px',
  background: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const importButtonStyle = {
  padding: '12px 20px',
  background: '#059669',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  textAlign: 'center' as const,
  fontWeight: 600,
}

const filterStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto auto',
  gap: 12,
  marginBottom: 12,
  alignItems: 'start',
}

const resultBarStyle = {
  marginBottom: 12,
  fontSize: 14,
  color: '#6b7280',
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