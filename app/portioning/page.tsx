'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'

type PortionRow = {
  item: string
  portionSize: number
  qtyProduced: number
}

type CookedRow = {
  cookedItemName: string
  rawStockItemUsed: string
  rawWeight: number
  cookedWeight: number
  portionSize: number
}

type TrimRow = {
  name: string
  weight: number
}

type PortionSummaryItem = {
  portionSize: number
  stockItemName: string
  totalQty: number
  totalWeightKg: number
}

type SavedSheet = {
  id: string
  sheet_date: string
  stock_item: string | null
  prepared_by: string | null
  checked_by: string | null
  net_usable_weight: number | null
  true_shortage_kg: number | null
  true_shortage_percent: number | null
  variance_status: string | null
  created_at: string
}

const stockItems = [
  'Chicken Supreme',
  'Wahoo Fish',
  'Marlin Fish',
  'Wings',
  'Chicken Mince',
  'Fried Chicken',
  'Chicken Drumstick',
  'Beef Mince',
  'Lasagne',
  'Beef Topside Steak',
  'Streaky Bacon',
  'Bacon Bits',
  'Lambchops',
  'Mussel',
  'Prawn',
  'Squid Tubes',
  'Octopus',
  'Lobster',
  'Whole Snapper',
  'Fries',
  'Cassava Fries',
  'Mozarella',
]

const rawDefaults: Record<string, PortionRow[]> = {
  'Chicken Supreme': [
    { item: 'Spicy Chicken', portionSize: 200, qtyProduced: 0 },
    { item: 'Popcorn Chicken', portionSize: 100, qtyProduced: 0 },
    { item: 'Chicken Parma', portionSize: 200, qtyProduced: 0 },
    { item: 'Chicken Kebabs', portionSize: 200, qtyProduced: 0 },
    { item: 'Sizzling Chicken', portionSize: 200, qtyProduced: 0 },
    { item: 'Stuffed Chicken', portionSize: 200, qtyProduced: 0 },
    { item: 'Fried Rice Chicken', portionSize: 100, qtyProduced: 0 },
    { item: 'Extra Chicken', portionSize: 100, qtyProduced: 0 },
  ],
  'Wahoo Fish': [
    { item: 'Panfried Snapper', portionSize: 200, qtyProduced: 0 },
    { item: 'Fish & Chips', portionSize: 200, qtyProduced: 0 },
    { item: 'Sizzling Fish', portionSize: 200, qtyProduced: 0 },
  ],
  'Marlin Fish': [
    { item: 'Fish Patty', portionSize: 150, qtyProduced: 0 },
    { item: 'Fish Finger', portionSize: 100, qtyProduced: 0 },
    { item: 'Kokoda', portionSize: 200, qtyProduced: 0 },
  ],
  Wings: [{ item: 'BBQ Wings', portionSize: 0, qtyProduced: 0 }],
  'Chicken Mince': [{ item: 'Chicken Patty', portionSize: 0, qtyProduced: 0 }],
  'Fried Chicken': [{ item: 'Fried Chicken', portionSize: 200, qtyProduced: 0 }],
  'Chicken Drumstick': [{ item: 'Drumstick', portionSize: 100, qtyProduced: 0 }],
  'Beef Mince': [{ item: 'Beef Patty', portionSize: 0, qtyProduced: 0 }],
  Lasagne: [{ item: 'Lasagne', portionSize: 0, qtyProduced: 0 }],
  'Beef Topside Steak': [{ item: 'Beef Sizzling', portionSize: 200, qtyProduced: 0 }],
  'Streaky Bacon': [{ item: 'Streaky Bacon', portionSize: 100, qtyProduced: 0 }],
  'Bacon Bits': [
    { item: 'Bacon Bits', portionSize: 100, qtyProduced: 0 },
    { item: 'Bacon Bits', portionSize: 150, qtyProduced: 0 },
    { item: 'Bacon Bits', portionSize: 50, qtyProduced: 0 },
  ],
  Lambchops: [
    { item: 'Chilli Lamb', portionSize: 200, qtyProduced: 0 },
    { item: 'BBQ Lamb', portionSize: 200, qtyProduced: 0 },
  ],
  Mussel: [{ item: 'Mussel', portionSize: 120, qtyProduced: 0 }],
  Prawn: [
    { item: 'Prawn', portionSize: 100, qtyProduced: 0 },
    { item: 'Prawn', portionSize: 200, qtyProduced: 0 },
  ],
  'Squid Tubes': [{ item: 'Squid', portionSize: 75, qtyProduced: 0 }],
  Octopus: [{ item: 'Octopus', portionSize: 75, qtyProduced: 0 }],
  Lobster: [{ item: 'Lobster', portionSize: 400, qtyProduced: 0 }],
  'Whole Snapper': [{ item: 'Whole Snapper', portionSize: 400, qtyProduced: 0 }],
  Fries: [{ item: 'Fries', portionSize: 200, qtyProduced: 0 }],
  'Cassava Fries': [{ item: 'Cassava Fries', portionSize: 200, qtyProduced: 0 }],
  Mozarella: [
    { item: 'Mozarella', portionSize: 150, qtyProduced: 0 },
    { item: 'Mozarella', portionSize: 50, qtyProduced: 0 },
  ],
}

const cookedDefaults: Record<string, CookedRow[]> = {
  'Chicken Supreme': [
    { cookedItemName: 'BBQ Chicken', rawStockItemUsed: 'Chicken Supreme', rawWeight: 0, cookedWeight: 0, portionSize: 150 },
    { cookedItemName: 'BBQ Chicken', rawStockItemUsed: 'Chicken Supreme', rawWeight: 0, cookedWeight: 0, portionSize: 50 },
    { cookedItemName: 'Tandoori Chicken', rawStockItemUsed: 'Chicken Supreme', rawWeight: 0, cookedWeight: 0, portionSize: 150 },
    { cookedItemName: 'Tandoori Chicken', rawStockItemUsed: 'Chicken Supreme', rawWeight: 0, cookedWeight: 0, portionSize: 50 },
    { cookedItemName: 'Chicken Mushroom', rawStockItemUsed: 'Chicken Supreme', rawWeight: 0, cookedWeight: 0, portionSize: 150 },
  ],
  'Wahoo Fish': [
    { cookedItemName: 'Cooked Wahoo Fish', rawStockItemUsed: 'Wahoo Fish', rawWeight: 0, cookedWeight: 0, portionSize: 100 },
    { cookedItemName: 'Cooked Wahoo Fish', rawStockItemUsed: 'Wahoo Fish', rawWeight: 0, cookedWeight: 0, portionSize: 150 },
  ],
  'Marlin Fish': [
    { cookedItemName: 'Cooked Marlin Fish', rawStockItemUsed: 'Marlin Fish', rawWeight: 0, cookedWeight: 0, portionSize: 100 },
    { cookedItemName: 'Cooked Marlin Fish', rawStockItemUsed: 'Marlin Fish', rawWeight: 0, cookedWeight: 0, portionSize: 150 },
  ],
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0
}

function csvEscape(value: string | number) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export default function PortioningPage() {
  const today = new Date().toISOString().split('T')[0]

  const [stockItem, setStockItem] = useState('Chicken Supreme')
  const [date, setDate] = useState(today)
  const [item, setItem] = useState('Chicken Supreme')
  const [numberOfBoxes, setNumberOfBoxes] = useState(0)
  const [weightPerBox, setWeightPerBox] = useState(0)
  const [preparedBy, setPreparedBy] = useState('')
  const [checkedBy, setCheckedBy] = useState('')
  const [totalFrozenWeight, setTotalFrozenWeight] = useState(0)
  const [totalDefrostedWeight, setTotalDefrostedWeight] = useState(0)
  const [trimOffcuts, setTrimOffcuts] = useState(0)
  const [wastage, setWastage] = useState(0)
  const [rawRows, setRawRows] = useState<PortionRow[]>(rawDefaults['Chicken Supreme'])
  const [cookedRows, setCookedRows] = useState<CookedRow[]>(cookedDefaults['Chicken Supreme'])
  const [trimRows, setTrimRows] = useState<TrimRow[]>([
    { name: 'Staff Meals', weight: 0 },
    { name: 'Fried Rice', weight: 0 },
    { name: 'Other', weight: 0 },
  ])
  const [acceptableVariancePercent, setAcceptableVariancePercent] = useState(2)
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([])

  useEffect(() => {
    loadSavedSheets()
  }, [])

  useEffect(() => {
    setItem(stockItem)
    setRawRows(rawDefaults[stockItem] || [{ item: stockItem, portionSize: 0, qtyProduced: 0 }])
    setCookedRows(cookedDefaults[stockItem] || [])
  }, [stockItem])

  const totalWeightBeingPortioned = safeNumber(numberOfBoxes * weightPerBox)
  const netUsableWeight = safeNumber(totalDefrostedWeight - trimOffcuts - wastage)
  const yieldPercent = totalFrozenWeight > 0 ? safeNumber((netUsableWeight / totalFrozenWeight) * 100) : 0

  const totalRawPortionWeight = rawRows.reduce(
    (sum, row) => sum + safeNumber((row.portionSize * row.qtyProduced) / 1000),
    0
  )

  const totalCookedRawWeightUsed = cookedRows.reduce((sum, row) => sum + safeNumber(row.rawWeight), 0)

  const totalShrinkageKg = cookedRows.reduce(
    (sum, row) => sum + Math.max(safeNumber(row.rawWeight - row.cookedWeight), 0),
    0
  )

  const totalTrimUsage = trimRows.reduce((sum, row) => sum + safeNumber(row.weight), 0)
  const totalPortionWeight = totalRawPortionWeight + totalCookedRawWeightUsed
  const totalAccountedWeight = totalPortionWeight + totalTrimUsage
  const trueShortageKg = safeNumber(netUsableWeight - totalAccountedWeight)
  const trueShortagePercent = netUsableWeight > 0 ? safeNumber((trueShortageKg / netUsableWeight) * 100) : 0
  const varianceStatus = Math.abs(trueShortagePercent) <= acceptableVariancePercent ? 'OK' : 'FLAGGED'

  const portionSummaryByGramSize = useMemo(() => {
    const grouped: Record<string, PortionSummaryItem> = {}

    rawRows.forEach(row => {
      if (!row.portionSize) return
      const key = `${stockItem}-${row.portionSize}`

      if (!grouped[key]) {
        grouped[key] = {
          portionSize: row.portionSize,
          stockItemName: `${stockItem} ${row.portionSize}g Portion`,
          totalQty: 0,
          totalWeightKg: 0,
        }
      }

      grouped[key].totalQty += safeNumber(row.qtyProduced)
      grouped[key].totalWeightKg += safeNumber((row.portionSize * row.qtyProduced) / 1000)
    })

    cookedRows.forEach(row => {
      if (!row.portionSize || !row.cookedWeight) return
      const qtyProduced = Math.floor((row.cookedWeight * 1000) / row.portionSize)
      const key = `${stockItem}-Cooked-${row.portionSize}`

      if (!grouped[key]) {
        grouped[key] = {
          portionSize: row.portionSize,
          stockItemName: `${stockItem} Cooked ${row.portionSize}g Portion`,
          totalQty: 0,
          totalWeightKg: 0,
        }
      }

      grouped[key].totalQty += safeNumber(qtyProduced)
      grouped[key].totalWeightKg += safeNumber((qtyProduced * row.portionSize) / 1000)
    })

    return Object.values(grouped).sort((a, b) => a.stockItemName.localeCompare(b.stockItemName))
  }, [rawRows, cookedRows, stockItem])

  async function loadSavedSheets() {
    const { data, error } = await supabase
      .from('portion_sheets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error(error)
      alert('Could not load saved portion sheets.')
      return
    }

    setSavedSheets(data || [])
  }

  const updateRawRow = (index: number, field: keyof PortionRow, value: string | number) => {
    setRawRows(rows =>
      rows.map((row, i) =>
        i === index ? { ...row, [field]: field === 'item' ? String(value) : Number(value) } : row
      )
    )
  }

  const updateCookedRow = (index: number, field: keyof CookedRow, value: string | number) => {
    setCookedRows(rows =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === 'cookedItemName' || field === 'rawStockItemUsed' ? String(value) : Number(value),
            }
          : row
      )
    )
  }

  const updateTrimRow = (index: number, weight: number) => {
    setTrimRows(rows => rows.map((row, i) => (i === index ? { ...row, weight } : row)))
  }

  const saveSheet = async () => {
    const { error } = await supabase.from('portion_sheets').insert([
      {
        sheet_date: date,
        stock_item: stockItem,
        staff_name: preparedBy,
        prepared_by: preparedBy,
        checked_by: checkedBy,
        location: 'Kitchen',
        net_usable_weight: netUsableWeight,
        total_raw_portion_weight: totalRawPortionWeight,
        total_cooked_raw_weight_used: totalCookedRawWeightUsed,
        total_trim_usage: totalTrimUsage,
        total_accounted_weight: totalAccountedWeight,
        true_shortage_kg: trueShortageKg,
        total_shrinkage_kg: totalShrinkageKg,
        true_shortage_percent: trueShortagePercent,
        acceptable_variance_percent: acceptableVariancePercent,
        variance_status: varianceStatus,
        total_variance: trueShortageKg,
        raw_rows: rawRows,
        cooked_rows: cookedRows,
        trim_rows: trimRows,
        portion_summary: portionSummaryByGramSize,
      },
    ])

    if (error) {
      console.error(error)
      alert('Error saving portion sheet.')
      return
    }

    await loadSavedSheets()
    alert('Portion sheet saved to central history.')
  }

  const deleteSavedSheet = async (id: string) => {
    const confirmed = confirm('Delete this saved portion sheet?')
    if (!confirmed) return

    const { error } = await supabase.from('portion_sheets').delete().eq('id', id)

    if (error) {
      console.error(error)
      alert('Could not delete portion sheet.')
      return
    }

    await loadSavedSheets()
  }

  const printSheet = () => {
    window.print()
  }

  const exportCurrentSheetToCSV = () => {
    const rows = [
      ['Date', date],
      ['Stock Item', stockItem],
      ['Prepared By', preparedBy],
      ['Checked By', checkedBy],
      ['Net Usable Weight kg', netUsableWeight.toFixed(2)],
      ['True Variance kg', trueShortageKg.toFixed(2)],
      ['True Variance %', trueShortagePercent.toFixed(2)],
      ['Variance Status', varianceStatus],
      [],
      ['SwiftPOS Stock Item', 'Portion Size', 'Total Qty', 'Total Weight kg'],
      ...portionSummaryByGramSize.map(row => [
        row.stockItemName,
        `${row.portionSize}g`,
        row.totalQty,
        row.totalWeightKg.toFixed(2),
      ]),
    ]

    const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `portion-sheet-${stockItem}-${date}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportHistoryToCSV = () => {
    const rows = [
      ['Date', 'Stock Item', 'Prepared By', 'Checked By', 'Net Usable kg', 'True Variance kg', 'Variance %', 'Status'],
      ...savedSheets.map(sheet => [
        sheet.sheet_date,
        sheet.stock_item || '',
        sheet.prepared_by || '',
        sheet.checked_by || '',
        Number(sheet.net_usable_weight || 0).toFixed(2),
        Number(sheet.true_shortage_kg || 0).toFixed(2),
        Number(sheet.true_shortage_percent || 0).toFixed(2),
        sheet.variance_status || '',
      ]),
    ]

    const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'portion-sheet-history.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const styles: Record<string, CSSProperties> = {
    page: { padding: 24, background: '#f4f4f4', minHeight: '100vh', color: '#111' },
    card: { background: '#fff', padding: 20, borderRadius: 8, marginBottom: 16, boxShadow: '0 2px 6px rgba(0,0,0,.08)', overflowX: 'auto' },
    title: { fontSize: 32, fontWeight: 800, marginBottom: 16 },
    sub: { fontSize: 22, fontWeight: 700, marginBottom: 12 },
    row: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' },
    label: { display: 'flex', flexDirection: 'column', fontWeight: 700, fontSize: 14, gap: 6 },
    input: { padding: 9, border: '1px solid #ccc', borderRadius: 4, minWidth: 170, fontSize: 14 },
    button: { background: 'orange', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block', marginRight: 8, marginTop: 8 },
    secondaryButton: { background: '#111827', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block', marginRight: 8, marginTop: 8 },
    delete: { background: 'red', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 12px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
    th: { background: '#111827', color: '#fff', padding: 10, border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: 10, border: '1px solid #ddd', whiteSpace: 'nowrap' },
    summaryCard: { background: '#fff7ec', border: '1px solid #ffd6a1', padding: 16, borderRadius: 8, minWidth: 180, textAlign: 'center' },
    summaryValue: { fontSize: 24, fontWeight: 800, color: '#d46b08', marginTop: 6 },
  }

  return (
    <div style={styles.page}>
      <a href="/portioning-summary" style={styles.secondaryButton}>View Portioning Summary</a>
      <a href="/portioning/history" style={styles.secondaryButton}>View Portioning History</a>

      <h1 style={styles.title}>Portion Control Sheet</h1>

      <div style={styles.card}>
        <h2 style={styles.sub}>Stock Item To Portion</h2>
        <select value={stockItem} onChange={e => setStockItem(e.target.value)} style={styles.input}>
          {stockItems.map(itemName => (
            <option key={itemName} value={itemName}>{itemName}</option>
          ))}
        </select>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Sheet Details</h2>
        <div style={styles.row}>
          <label style={styles.label}>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} /></label>
          <label style={styles.label}>Item<input value={item} onChange={e => setItem(e.target.value)} style={styles.input} /></label>
          <label style={styles.label}>Number of Boxes<input type="number" value={numberOfBoxes} onChange={e => setNumberOfBoxes(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Weight Per Box kg<input type="number" value={weightPerBox} onChange={e => setWeightPerBox(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Prepared By<input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} style={styles.input} /></label>
          <label style={styles.label}>Checked By<input value={checkedBy} onChange={e => setCheckedBy(e.target.value)} style={styles.input} /></label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Weight Reconciliation</h2>
        <div style={styles.row}>
          <label style={styles.label}>Total Frozen Weight kg<input type="number" value={totalFrozenWeight} onChange={e => setTotalFrozenWeight(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Total Defrosted Weight kg<input type="number" value={totalDefrostedWeight} onChange={e => setTotalDefrostedWeight(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Trim / Offcuts kg<input type="number" value={trimOffcuts} onChange={e => setTrimOffcuts(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Wastage kg<input type="number" value={wastage} onChange={e => setWastage(Number(e.target.value))} style={styles.input} /></label>
        </div>

        <div style={{ ...styles.row, marginTop: 16 }}>
          <div style={styles.summaryCard}><div>Total Weight Being Portioned</div><div style={styles.summaryValue}>{totalWeightBeingPortioned.toFixed(2)} kg</div></div>
          <div style={styles.summaryCard}><div>Net Usable Weight</div><div style={styles.summaryValue}>{netUsableWeight.toFixed(2)} kg</div></div>
          <div style={styles.summaryCard}><div>Yield %</div><div style={styles.summaryValue}>{yieldPercent.toFixed(2)}%</div></div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Raw Portioning</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Portion Size g</th>
              <th style={styles.th}>Qty Produced</th>
              <th style={styles.th}>Total Weight kg</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rawRows.map((row, index) => (
              <tr key={index}>
                <td style={styles.td}><input value={row.item} onChange={e => updateRawRow(index, 'item', e.target.value)} style={styles.input} /></td>
                <td style={styles.td}><input type="number" value={row.portionSize} onChange={e => updateRawRow(index, 'portionSize', Number(e.target.value))} style={styles.input} /></td>
                <td style={styles.td}><input type="number" value={row.qtyProduced} onChange={e => updateRawRow(index, 'qtyProduced', Number(e.target.value))} style={styles.input} /></td>
                <td style={styles.td}>{safeNumber((row.portionSize * row.qtyProduced) / 1000).toFixed(2)}</td>
                <td style={styles.td}><button style={styles.delete} onClick={() => setRawRows(rows => rows.filter((_, i) => i !== index))}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={styles.button} onClick={() => setRawRows(rows => [...rows, { item: '', portionSize: 0, qtyProduced: 0 }])}>Add Raw Row</button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Cooked Yield / Shrinkage</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Cooked Item</th>
              <th style={styles.th}>Raw Stock Item</th>
              <th style={styles.th}>Raw Weight kg</th>
              <th style={styles.th}>Cooked Weight kg</th>
              <th style={styles.th}>Portion Size g</th>
              <th style={styles.th}>Qty Produced</th>
              <th style={styles.th}>Shrinkage kg</th>
              <th style={styles.th}>Shrinkage %</th>
              <th style={styles.th}>Cooked Yield %</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cookedRows.map((row, index) => {
              const qtyProduced = row.portionSize > 0 ? Math.floor((safeNumber(row.cookedWeight) * 1000) / row.portionSize) : 0
              const shrinkage = Math.max(safeNumber(row.rawWeight - row.cookedWeight), 0)
              const shrinkagePercent = row.rawWeight > 0 ? safeNumber((shrinkage / row.rawWeight) * 100) : 0
              const cookedYieldPercent = row.rawWeight > 0 ? safeNumber((row.cookedWeight / row.rawWeight) * 100) : 0

              return (
                <tr key={index}>
                  <td style={styles.td}><input value={row.cookedItemName} onChange={e => updateCookedRow(index, 'cookedItemName', e.target.value)} style={styles.input} /></td>
                  <td style={styles.td}><input value={row.rawStockItemUsed} onChange={e => updateCookedRow(index, 'rawStockItemUsed', e.target.value)} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.rawWeight} onChange={e => updateCookedRow(index, 'rawWeight', Number(e.target.value))} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.cookedWeight} onChange={e => updateCookedRow(index, 'cookedWeight', Number(e.target.value))} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.portionSize} onChange={e => updateCookedRow(index, 'portionSize', Number(e.target.value))} style={styles.input} /></td>
                  <td style={styles.td}>{qtyProduced}</td>
                  <td style={styles.td}>{shrinkage.toFixed(2)}</td>
                  <td style={styles.td}>{shrinkagePercent.toFixed(2)}%</td>
                  <td style={styles.td}>{cookedYieldPercent.toFixed(2)}%</td>
                  <td style={styles.td}><button style={styles.delete} onClick={() => setCookedRows(rows => rows.filter((_, i) => i !== index))}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button
          style={styles.button}
          onClick={() =>
            setCookedRows(rows => [...rows, { cookedItemName: '', rawStockItemUsed: stockItem, rawWeight: 0, cookedWeight: 0, portionSize: 0 }])
          }
        >
          Add Cooked Row
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Trim Usage</h2>
        <div style={styles.row}>
          {trimRows.map((row, index) => (
            <label key={row.name} style={styles.label}>
              {row.name}
              <input type="number" value={row.weight} onChange={e => updateTrimRow(index, Number(e.target.value))} style={styles.input} />
            </label>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Summary</h2>
        <label style={styles.label}>
          Acceptable Variance %
          <input type="number" value={acceptableVariancePercent} onChange={e => setAcceptableVariancePercent(Number(e.target.value))} style={styles.input} />
        </label>

        <div style={{ ...styles.row, marginTop: 16 }}>
          {[
            ['Net Usable Weight', `${netUsableWeight.toFixed(2)} kg`],
            ['Raw Portion Weight', `${totalRawPortionWeight.toFixed(2)} kg`],
            ['Cooked Raw Weight Used', `${totalCookedRawWeightUsed.toFixed(2)} kg`],
            ['Shrinkage Weight', `${totalShrinkageKg.toFixed(2)} kg`],
            ['Trim Usage', `${totalTrimUsage.toFixed(2)} kg`],
            ['Total Accounted Weight', `${totalAccountedWeight.toFixed(2)} kg`],
            ['True Variance kg', `${trueShortageKg.toFixed(2)} kg`],
            ['True Variance %', `${trueShortagePercent.toFixed(2)}%`],
          ].map(([label, value]) => (
            <div key={label} style={styles.summaryCard}>
              <div>{label}</div>
              <div style={styles.summaryValue}>{value}</div>
            </div>
          ))}

          <div style={{ ...styles.summaryCard, background: varianceStatus === 'OK' ? '#d4edda' : '#f8d7da', border: varianceStatus === 'OK' ? '2px solid green' : '2px solid red' }}>
            <div>Variance Status</div>
            <div style={{ ...styles.summaryValue, color: varianceStatus === 'OK' ? 'green' : 'red' }}>{varianceStatus}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Portion Summary By Gram Size</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SwiftPOS Stock Item</th>
              <th style={styles.th}>Portion Size</th>
              <th style={styles.th}>Total Qty</th>
              <th style={styles.th}>Total Weight kg</th>
            </tr>
          </thead>
          <tbody>
            {portionSummaryByGramSize.map(row => (
              <tr key={row.stockItemName}>
                <td style={styles.td}>{row.stockItemName}</td>
                <td style={styles.td}>{row.portionSize}g</td>
                <td style={styles.td}>{row.totalQty}</td>
                <td style={styles.td}>{row.totalWeightKg.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button style={styles.button} onClick={saveSheet}>Save Portion Sheet</button>
        <button style={styles.button} onClick={printSheet}>Print</button>
        <button style={styles.button} onClick={exportCurrentSheetToCSV}>Export Current Sheet CSV</button>
        <button style={styles.secondaryButton} onClick={exportHistoryToCSV}>Export History CSV</button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Saved Portion Sheets, Central History</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable kg</th>
              <th style={styles.th}>True Variance kg</th>
              <th style={styles.th}>Variance %</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Open</th>
              <th style={styles.th}>Delete</th>
            </tr>
          </thead>

          <tbody>
            {savedSheets.map(sheet => (
              <tr key={sheet.id}>
                <td style={styles.td}>{sheet.sheet_date}</td>
                <td style={styles.td}>{sheet.stock_item || '-'}</td>
                <td style={styles.td}>{sheet.prepared_by || '-'}</td>
                <td style={styles.td}>{sheet.checked_by || '-'}</td>
                <td style={styles.td}>{Number(sheet.net_usable_weight || 0).toFixed(2)}</td>
                <td style={styles.td}>{Number(sheet.true_shortage_kg || 0).toFixed(2)}</td>
                <td style={styles.td}>{Number(sheet.true_shortage_percent || 0).toFixed(2)}%</td>
                <td style={{ ...styles.td, color: sheet.variance_status === 'OK' ? 'green' : 'red', fontWeight: 700 }}>{sheet.variance_status || '-'}</td>
                <td style={styles.td}><a href={`/portioning/history/${sheet.id}`}>Open Sheet</a></td>
                <td style={styles.td}><button style={styles.delete} onClick={() => deleteSavedSheet(sheet.id)}>Delete</button></td>
              </tr>
            ))}

            {savedSheets.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={10}>No saved portion sheets yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}