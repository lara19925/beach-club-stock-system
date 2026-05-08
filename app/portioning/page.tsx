'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'

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
  stockItem: string
  date: string
  item: string
  preparedBy: string
  checkedBy: string
  netUsableWeight: number
  totalRawPortionWeight: number
  totalCookedRawWeightUsed: number
  totalTrimUsage: number
  totalAccountedWeight: number
  trueShortageKg: number
  totalShrinkageKg: number
  trueShortagePercent: number
  acceptableVariancePercent: number
  varianceStatus: string
  portionSummaryByGramSize: PortionSummaryItem[]
}

const stockItems = ['Chicken Supreme', 'Wahoo Fish', 'Marlin Fish']

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
    { item: 'Fish & Chips', portionSize: 100, qtyProduced: 0 },
    { item: 'Sizzling Fish', portionSize: 200, qtyProduced: 0 },
  ],
  'Marlin Fish': [
    { item: 'Kokoda', portionSize: 100, qtyProduced: 0 },
    { item: 'Fish Curry', portionSize: 150, qtyProduced: 0 },
    { item: 'Fish Tacos', portionSize: 100, qtyProduced: 0 },
    { item: 'Fish Burger', portionSize: 150, qtyProduced: 0 },
    { item: 'Extra Fish', portionSize: 100, qtyProduced: 0 },
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
    const saved = localStorage.getItem('portionSheets')
    if (saved) {
      try {
        setSavedSheets(JSON.parse(saved))
      } catch {
        setSavedSheets([])
      }
    }
  }, [])

  useEffect(() => {
    setItem(stockItem)
    setRawRows(rawDefaults[stockItem] || [])
    setCookedRows(cookedDefaults[stockItem] || [])
  }, [stockItem])

  const totalWeightBeingPortioned = numberOfBoxes * weightPerBox
  const netUsableWeight = totalDefrostedWeight - trimOffcuts - wastage
  const yieldPercent = totalFrozenWeight > 0 ? (netUsableWeight / totalFrozenWeight) * 100 : 0

  const totalRawPortionWeight = rawRows.reduce(
    (sum, row) => sum + (row.portionSize * row.qtyProduced) / 1000,
    0
  )

  const totalCookedRawWeightUsed = cookedRows.reduce(
    (sum, row) => sum + row.rawWeight,
    0
  )

  const totalShrinkageKg = cookedRows.reduce(
    (sum, row) => sum + Math.max(row.rawWeight - row.cookedWeight, 0),
    0
  )

  const totalTrimUsage = trimRows.reduce((sum, row) => sum + row.weight, 0)

  const totalPortionWeight = totalRawPortionWeight + totalCookedRawWeightUsed
  const totalAccountedWeight = totalPortionWeight + totalTrimUsage

  const trueShortageKg = netUsableWeight - totalAccountedWeight
  const trueShortagePercent =
    netUsableWeight > 0 ? (trueShortageKg / netUsableWeight) * 100 : 0

  const varianceStatus =
    Math.abs(trueShortagePercent) <= acceptableVariancePercent ? 'OK' : 'FLAGGED'

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

      grouped[key].totalQty += row.qtyProduced
      grouped[key].totalWeightKg += (row.portionSize * row.qtyProduced) / 1000
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

      grouped[key].totalQty += qtyProduced
      grouped[key].totalWeightKg += (qtyProduced * row.portionSize) / 1000
    })

    return Object.values(grouped)
  }, [rawRows, cookedRows, stockItem])

  const saveSheet = () => {
    const sheet: SavedSheet = {
      stockItem,
      date,
      item,
      preparedBy,
      checkedBy,
      netUsableWeight,
      totalRawPortionWeight,
      totalCookedRawWeightUsed,
      totalTrimUsage,
      totalAccountedWeight,
      trueShortageKg,
      totalShrinkageKg,
      trueShortagePercent,
      acceptableVariancePercent,
      varianceStatus,
      portionSummaryByGramSize,
    }

    const updated = [...savedSheets, sheet]
    setSavedSheets(updated)
    localStorage.setItem('portionSheets', JSON.stringify(updated))
    alert('Portion sheet saved.')
  }

  const deleteSavedSheet = (index: number) => {
    const updated = savedSheets.filter((_, i) => i !== index)
    setSavedSheets(updated)
    localStorage.setItem('portionSheets', JSON.stringify(updated))
  }

  const styles: Record<string, CSSProperties> = {
    page: { padding: 24, background: '#f4f4f4', minHeight: '100vh', color: '#111' },
    card: { background: '#fff', padding: 20, borderRadius: 8, marginBottom: 16, boxShadow: '0 2px 6px rgba(0,0,0,.08)' },
    title: { fontSize: 28, fontWeight: 800, marginBottom: 16 },
    sub: { fontSize: 20, fontWeight: 700, marginBottom: 12 },
    row: { display: 'flex', flexWrap: 'wrap', gap: 12 },
    label: { display: 'flex', flexDirection: 'column', fontWeight: 700, fontSize: 14, gap: 6 },
    input: { padding: 9, border: '1px solid #ccc', borderRadius: 4, minWidth: 170 },
    button: { background: 'orange', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    delete: { background: 'red', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 12px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#111827', color: '#fff', padding: 10, border: '1px solid #ddd', textAlign: 'left' },
    td: { padding: 10, border: '1px solid #ddd' },
    summaryCard: { background: '#fff7ec', border: '1px solid #ffd6a1', padding: 16, borderRadius: 8, minWidth: 180, textAlign: 'center' },
    summaryValue: { fontSize: 24, fontWeight: 800, color: '#d46b08' },
  }

  return (
    <div style={styles.page}>
      <a href="/portioning-summary" style={styles.button}>View Portioning Summary</a>

      <h1 style={styles.title}>Portion Control Sheet</h1>

      <div style={styles.card}>
        <h2 style={styles.sub}>Stock Item To Portion</h2>
        <select value={stockItem} onChange={e => setStockItem(e.target.value)} style={styles.input}>
          {stockItems.map(item => <option key={item}>{item}</option>)}
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
        <p><b>Total Weight Being Portioned:</b> {totalWeightBeingPortioned.toFixed(2)} kg</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Yield Summary</h2>
        <div style={styles.row}>
          <label style={styles.label}>Total Frozen Weight kg<input type="number" value={totalFrozenWeight} onChange={e => setTotalFrozenWeight(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Total Defrosted Weight kg<input type="number" value={totalDefrostedWeight} onChange={e => setTotalDefrostedWeight(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Trim / Offcuts kg<input type="number" value={trimOffcuts} onChange={e => setTrimOffcuts(Number(e.target.value))} style={styles.input} /></label>
          <label style={styles.label}>Wastage kg<input type="number" value={wastage} onChange={e => setWastage(Number(e.target.value))} style={styles.input} /></label>
        </div>
        <p><b>Net Usable Weight:</b> {netUsableWeight.toFixed(2)} kg</p>
        <p><b>Yield %:</b> {yieldPercent.toFixed(2)}%</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Raw Portion Log</h2>
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
            {rawRows.map((row, i) => (
              <tr key={i}>
                <td style={styles.td}><input value={row.item} onChange={e => setRawRows(r => r.map((x, idx) => idx === i ? { ...x, item: e.target.value } : x))} style={styles.input} /></td>
                <td style={styles.td}><input type="number" value={row.portionSize} onChange={e => setRawRows(r => r.map((x, idx) => idx === i ? { ...x, portionSize: Number(e.target.value) } : x))} style={styles.input} /></td>
                <td style={styles.td}><input type="number" value={row.qtyProduced} onChange={e => setRawRows(r => r.map((x, idx) => idx === i ? { ...x, qtyProduced: Number(e.target.value) } : x))} style={styles.input} /></td>
                <td style={styles.td}>{((row.portionSize * row.qtyProduced) / 1000).toFixed(2)}</td>
                <td style={styles.td}><button style={styles.delete} onClick={() => setRawRows(r => r.filter((_, idx) => idx !== i))}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={styles.button} onClick={() => setRawRows([...rawRows, { item: '', portionSize: 0, qtyProduced: 0 }])}>Add Row</button>
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
            {cookedRows.map((row, i) => {
              const qty = row.portionSize > 0 ? Math.floor((row.cookedWeight * 1000) / row.portionSize) : 0
              const shrinkage = Math.max(row.rawWeight - row.cookedWeight, 0)
              const shrinkagePercent = row.rawWeight > 0 ? (shrinkage / row.rawWeight) * 100 : 0
              const cookedYieldPercent = row.rawWeight > 0 ? (row.cookedWeight / row.rawWeight) * 100 : 0

              return (
                <tr key={i}>
                  <td style={styles.td}><input value={row.cookedItemName} onChange={e => setCookedRows(r => r.map((x, idx) => idx === i ? { ...x, cookedItemName: e.target.value } : x))} style={styles.input} /></td>
                  <td style={styles.td}><input value={row.rawStockItemUsed} onChange={e => setCookedRows(r => r.map((x, idx) => idx === i ? { ...x, rawStockItemUsed: e.target.value } : x))} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.rawWeight} onChange={e => setCookedRows(r => r.map((x, idx) => idx === i ? { ...x, rawWeight: Number(e.target.value) } : x))} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.cookedWeight} onChange={e => setCookedRows(r => r.map((x, idx) => idx === i ? { ...x, cookedWeight: Number(e.target.value) } : x))} style={styles.input} /></td>
                  <td style={styles.td}><input type="number" value={row.portionSize} onChange={e => setCookedRows(r => r.map((x, idx) => idx === i ? { ...x, portionSize: Number(e.target.value) } : x))} style={styles.input} /></td>
                  <td style={styles.td}>{qty}</td>
                  <td style={styles.td}>{shrinkage.toFixed(2)}</td>
                  <td style={styles.td}>{shrinkagePercent.toFixed(2)}%</td>
                  <td style={styles.td}>{cookedYieldPercent.toFixed(2)}%</td>
                  <td style={styles.td}><button style={styles.delete} onClick={() => setCookedRows(r => r.filter((_, idx) => idx !== i))}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button style={styles.button} onClick={() => setCookedRows([...cookedRows, { cookedItemName: '', rawStockItemUsed: stockItem, rawWeight: 0, cookedWeight: 0, portionSize: 0 }])}>Add Cooked Row</button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sub}>Trim Usage</h2>
        <div style={styles.row}>
          {trimRows.map((row, i) => (
            <label key={row.name} style={styles.label}>
              {row.name}
              <input type="number" value={row.weight} onChange={e => setTrimRows(r => r.map((x, idx) => idx === i ? { ...x, weight: Number(e.target.value) } : x))} style={styles.input} />
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

          <div style={{
            ...styles.summaryCard,
            background: varianceStatus === 'OK' ? '#d4edda' : '#f8d7da',
            border: varianceStatus === 'OK' ? '2px solid green' : '2px solid red',
          }}>
            <div>Variance Status</div>
            <div style={{ ...styles.summaryValue, color: varianceStatus === 'OK' ? 'green' : 'red' }}>
              {varianceStatus}
            </div>
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

      <button style={styles.button} onClick={saveSheet}>Save Portion Sheet</button>

      <div style={styles.card}>
        <h2 style={styles.sub}>Saved Portion Sheets</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable kg</th>
              <th style={styles.th}>True Variance kg</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {savedSheets.map((sheet, i) => (
              <tr key={i}>
                <td style={styles.td}>{sheet.date}</td>
                <td style={styles.td}>{sheet.stockItem}</td>
                <td style={styles.td}>{sheet.preparedBy}</td>
                <td style={styles.td}>{sheet.checkedBy}</td>
                <td style={styles.td}>{sheet.netUsableWeight.toFixed(2)}</td>
                <td style={styles.td}>{sheet.trueShortageKg.toFixed(2)}</td>
                <td style={{ ...styles.td, color: sheet.varianceStatus === 'OK' ? 'green' : 'red', fontWeight: 700 }}>{sheet.varianceStatus}</td>
                <td style={styles.td}><button style={styles.delete} onClick={() => deleteSavedSheet(i)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}