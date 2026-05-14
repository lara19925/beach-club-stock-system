'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BottleMaster {
  id?: string
  count_type: string
  plu_code: string
  item_name: string
  bottle_size_ml: number
  empty_bottle_weight_kg: number
  full_bottle_weight_kg: number
  swiftpos_group: string
  active: boolean
}

const blankForm: BottleMaster = {
  plu_code: '',
  count_type: 'WEIGHT',
  item_name: '',
  bottle_size_ml: 0,
  empty_bottle_weight_kg: 0,
  full_bottle_weight_kg: 0,
  swiftpos_group: '',
  active: true,
}

export default function BarBottleMasterPage() {
  const [items, setItems] = useState<BottleMaster[]>([])
  const [form, setForm] = useState<BottleMaster>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')

  async function loadItems() {
    const { data, error } = await supabase
      .from('bottle_master')
      .select('*')
      .order('item_name')

    if (error) {
      alert(error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  const groups = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((i) => i.swiftpos_group).filter(Boolean))
    )

    return ['All', ...unique]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchOk =
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.plu_code.toLowerCase().includes(search.toLowerCase()) ||
        item.swiftpos_group.toLowerCase().includes(search.toLowerCase())

      const groupOk =
        groupFilter === 'All' || item.swiftpos_group === groupFilter

      return searchOk && groupOk && item.active !== false
    })
  }, [items, search, groupFilter])

  async function saveItem() {
    setLoading(true)

    const payload = {
            
      plu_code: form.plu_code,
      count_type: form.count_type,
      item_name: form.item_name,
      bottle_size_ml: Number(form.bottle_size_ml),
empty_bottle_weight_kg: form.count_type === 'UNIT' ? 0 : Number(form.empty_bottle_weight_kg),
full_bottle_weight_kg: form.count_type === 'UNIT' ? 0 : Number(form.full_bottle_weight_kg),
      swiftpos_group: form.swiftpos_group,
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
        .insert([payload])

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

  async function importCSV(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()

    const lines = text
      .split('\n')
      .filter((line) => line.trim() !== '')

    const headers = lines[0]
      .split(',')
      .map((h) =>
        h.replace(/"/g, '').trim().toLowerCase()
      )

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

        return {
          plu_code: row['plu code'] || '',
          item_name:
            row['item name'] || row['item'] || '',
          swiftpos_group:
            row['swiftpos group'] || '',
          bottle_size_ml: Number(
            row['bottle size ml'] || 0
          ),
          empty_bottle_weight_kg: Number(
            row['empty bottle weight kg'] || 0
          ),
          full_bottle_weight_kg: Number(
            row['full bottle weight kg'] || 0
          ),
          active: true,
        }
      })
      .filter((row) => row.item_name && row.plu_code)

    if (rows.length === 0) {
      alert(
        'No valid rows found. Check your CSV headers.'
      )
      return
    }

    const confirmed = confirm(
      `Import ${rows.length} bottles?`
    )

    if (!confirmed) return

const pluCodes = rows.map((r) => r.plu_code)

const { data: existing } = await supabase
  .from('bottle_master')
  .select('plu_code')
  .in('plu_code', pluCodes)

const existingCodes = existing?.map((e) => e.plu_code) || []

const newRows = rows.filter(
  (r) => !existingCodes.includes(r.plu_code)
)

if (newRows.length === 0) {
  alert('All items already exist')
  return
}

const { error } = await supabase
  .from('bottle_master')
  .insert(newRows)

if (error) {
alert('Error importing bottles')
console.error(error)
  return
}

alert(
  `${newRows.length} imported, ${rows.length - newRows.length} skipped`
)


    alert(`${rows.length} bottles imported`)
    loadItems()
  }

  function exportCSV() {
    const headers = [
      'PLU Code',
      'Item Name',
      'SwiftPOS Group',
      'Bottle Size ML',
      'Empty Bottle Weight KG',
      'Full Bottle Weight KG',
    ]

    const rows = filteredItems.map((item) => [
      item.plu_code,
      item.item_name,
      item.swiftpos_group,
      item.bottle_size_ml,
      item.empty_bottle_weight_kg,
      item.full_bottle_weight_kg,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = 'bar-bottle-master.csv'
    link.click()
  }

  function editItem(item: BottleMaster) {
    setForm(item)
    setEditingId(item.id || null)
  }

  async function deactivateItem(id?: string) {
    if (!id) return

    const confirmed = confirm(
      'Deactivate this bottle?'
    )

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
      <h1>Bar Bottle Master</h1>

      <div style={cardStyle}>
        <h2>
          {editingId ? 'Edit Bottle' : 'Add Bottle'}
        </h2>

        <label>PLU Code</label>
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

        <label>Item Name</label>
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

        <label>SwiftPOS Group</label>
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
<label>Count Type</label>

<select
  value={form.count_type}
  onChange={(e) =>
    setForm({
      ...form,
      count_type: e.target.value,
    })
  }
  style={inputStyle}
>
  <option value="WEIGHT">
    WEIGHT - Spirits/Open Bottles
  </option>

  <option value="UNIT">
    UNIT - Beer/RTD/Soft Drinks
  </option>
</select>
        

        <label>Bottle Size (ML)</label>
        <input
          type="number"
          value={form.bottle_size_ml}
          onChange={(e) =>
            setForm({
              ...form,
              bottle_size_ml: Number(
                e.target.value
              ),
            })
          }
          style={inputStyle}
        />

{form.count_type === 'WEIGHT' && (
  <>
        <label>Empty Bottle Weight (KG)</label>
        <input
          type="number"
          step="0.001"
          value={form.empty_bottle_weight_kg}
          onChange={(e) =>
            setForm({
              ...form,
              empty_bottle_weight_kg: Number(
                e.target.value
              ),
            })
          }
          style={inputStyle}
        />

        <label>Full Bottle Weight (KG)</label>
        <input
          type="number"
          step="0.001"
          value={form.full_bottle_weight_kg}
          onChange={(e) =>
            setForm({
              ...form,
              full_bottle_weight_kg: Number(
                e.target.value
              ),
            })
          }
          style={inputStyle}
        />
          </>
)}

        <button
          onClick={saveItem}
          disabled={loading}
          style={buttonStyle}
        >
          {loading
            ? 'Saving...'
            : editingId
              ? 'Save Changes'
              : 'Save Bottle'}
        </button>
      </div>

      <div style={cardStyle}>
        <h2>Saved Bottles</h2>

        <div style={toolbarStyle}>
          <input
            placeholder="Search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              ...inputStyle,
              marginBottom: 0,
            }}
          />

          <select
            value={groupFilter}
            onChange={(e) =>
              setGroupFilter(e.target.value)
            }
            style={{
              ...inputStyle,
              marginBottom: 0,
            }}
          >
            {groups.map((group) => (
              <option
                key={group}
                value={group}
              >
                {group}
              </option>
            ))}
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

          <button
            onClick={exportCSV}
            style={buttonStyle}
          >
            Export CSV
          </button>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>PLU</th>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>ML</th>
              <th style={thStyle}>Empty KG</th>
              <th style={thStyle}>Full KG</th>
              <th style={thStyle}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>
                  {item.plu_code}
                </td>

                <td style={tdStyle}>
                  {item.item_name}
                </td>

                <td style={tdStyle}>
                  {item.swiftpos_group}
                </td>

                <td style={tdStyle}>
                  {item.bottle_size_ml}
                </td>

                <td style={tdStyle}>
                  {
                    item.empty_bottle_weight_kg
                  }
                </td>

                <td style={tdStyle}>
                  {
                    item.full_bottle_weight_kg
                  }
                </td>

                <td style={tdStyle}>
                  <button
                    onClick={() =>
                      editItem(item)
                    }
                    style={smallButtonStyle}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deactivateItem(item.id)
                    }
                    style={
                      dangerButtonStyle
                    }
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const pageStyle = {
  padding: 20,
  color: '#111827',
}

const cardStyle = {
  background: '#ffffff',
  color: '#111827',
  padding: 20,
  borderRadius: 10,
  marginBottom: 30,
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

const buttonStyle = {
  padding: '12px 20px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const smallButtonStyle = {
  padding: '8px 12px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  marginRight: 8,
}

const dangerButtonStyle = {
  padding: '8px 12px',
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const toolbarStyle = {
  display: 'grid',
  gridTemplateColumns:
    '2fr 1fr 1fr auto',
  gap: 10,
  marginBottom: 20,
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const thStyle = {
  border: '1px solid #ddd',
  padding: 10,
  background: '#f3f4f6',
  textAlign: 'left' as const,
}

const tdStyle = {
  border: '1px solid #ddd',
  padding: 10,
}

const importButtonStyle = {
  padding: '12px 20px',
  background: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  textAlign: 'center' as const,
}