'use client'

import { useEffect, useState } from 'react'

interface SavedPortionSheet {
  stockItemType: string
  date: string
  item: string
  preparedBy: string
  checkedBy: string
  netUsableWeight: number
  variance: number
  variancePercent: number
}

interface PortionSummaryRow {
  swiftposStockItem: string
  portionsMade: number
  totalWeight: number
}

interface SalesRow {
  swiftposStockItem: string
  openingStockQty: number
  portionsMadeQty: number
  salesQty: number
  actualClosingCount: number
}

interface SavedSwiftPOSCheck {
  id: string
  startDate: string
  endDate: string
  stockItemTypeFilter: string
  salesRows: SalesRow[]
  totals: {
    totalPortionsMade: number
    totalSalesEntered: number
    totalExpectedClosing: number
    totalActualClosing: number
    totalVariance: number
  }
  preparedBy: string
  checkedBy: string
  savedAt: string
}

const stockItemOptions = ['All', 'Chicken Supreme', 'Wahoo Fish', 'Marlin Fish']

function getSwiftPOSStockItemName(stockItemType: string, item: string) {
  const gramsMatch = item.match(/(100|150|200)g/) || item.match(/(100|150|200)g/i)
  const grams = gramsMatch ? gramsMatch[1] : ''
  if (grams) {
    return `${stockItemType} ${grams}g Portion`
  }
  return `${stockItemType} ${item}`
}

export default function SwiftPOSCheckPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stockItemTypeFilter, setStockItemTypeFilter] = useState('All')
  const [savedPortionSheets, setSavedPortionSheets] = useState<SavedPortionSheet[]>([])
  const [salesRows, setSalesRows] = useState<SalesRow[]>([])
  const [savedChecks, setSavedChecks] = useState<SavedSwiftPOSCheck[]>([])
  const [preparedBy, setPreparedBy] = useState('')
  const [checkedBy, setCheckedBy] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('portionSheets')
    if (saved) {
      setSavedPortionSheets(JSON.parse(saved))
    }
    const checks = localStorage.getItem('swiftposChecks')
    if (checks) {
      setSavedChecks(JSON.parse(checks))
    }
  }, [])

  const matchesDateRange = (date: string) => {
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  }

  const filteredPortionSheets = savedPortionSheets.filter(sheet => {
    if (stockItemTypeFilter !== 'All' && sheet.stockItemType !== stockItemTypeFilter) {
      return false
    }
    return matchesDateRange(sheet.date)
  })

  const portionSummaryRows: PortionSummaryRow[] = Object.values(
    filteredPortionSheets.reduce<Record<string, PortionSummaryRow>>((acc, sheet) => {
      const swiftposStockItem = getSwiftPOSStockItemName(sheet.stockItemType, sheet.item)
      const existing = acc[swiftposStockItem]
      if (existing) {
        existing.portionsMade += 1
        existing.totalWeight += sheet.netUsableWeight
      } else {
        acc[swiftposStockItem] = {
          swiftposStockItem,
          portionsMade: 1,
          totalWeight: sheet.netUsableWeight,
        }
      }
      return acc
    }, {})
  ).sort((a, b) => a.swiftposStockItem.localeCompare(b.swiftposStockItem))

  useEffect(() => {
    setSalesRows(prev => portionSummaryRows.map(summary => {
      const existing = prev.find(row => row.swiftposStockItem === summary.swiftposStockItem)
      return {
        swiftposStockItem: summary.swiftposStockItem,
        openingStockQty: existing?.openingStockQty ?? 0,
        portionsMadeQty: summary.portionsMade,
        salesQty: existing?.salesQty ?? 0,
        actualClosingCount: existing?.actualClosingCount ?? 0,
      }
    }))
  }, [portionSummaryRows])

  const updateSalesRow = (index: number, field: keyof SalesRow, value: number) => {
    setSalesRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  const totalPortionsMade = salesRows.reduce((sum, row) => sum + row.portionsMadeQty, 0)
  const totalSalesEntered = salesRows.reduce((sum, row) => sum + row.salesQty, 0)
  const totalExpectedClosing = salesRows.reduce((sum, row) => sum + (row.openingStockQty + row.portionsMadeQty - row.salesQty), 0)
  const totalActualClosing = salesRows.reduce((sum, row) => sum + row.actualClosingCount, 0)
  const totalVariance = salesRows.reduce((sum, row) => sum + (row.actualClosingCount - (row.openingStockQty + row.portionsMadeQty - row.salesQty)), 0)

  const saveCheck = () => {
    const newCheck: SavedSwiftPOSCheck = {
      id: String(Date.now()),
      startDate,
      endDate,
      stockItemTypeFilter,
      salesRows,
      totals: {
        totalPortionsMade,
        totalSalesEntered,
        totalExpectedClosing,
        totalActualClosing,
        totalVariance,
      },
      preparedBy,
      checkedBy,
      savedAt: new Date().toISOString(),
    }
    const updated = [newCheck, ...savedChecks]
    setSavedChecks(updated)
    localStorage.setItem('swiftposChecks', JSON.stringify(updated))
  }

  const deleteSavedCheck = (index: number) => {
    const updated = savedChecks.filter((_, i) => i !== index)
    setSavedChecks(updated)
    localStorage.setItem('swiftposChecks', JSON.stringify(updated))
  }

  const styles = {
    container: { backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' },
    card: { backgroundColor: 'white', padding: '20px', margin: '10px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    heading: { color: '#333', marginBottom: '10px', fontSize: '24px' },
    subHeading: { color: '#333', marginBottom: '10px', fontSize: '18px' },
    label: { display: 'flex', flexDirection: 'column' as const, margin: '5px', minWidth: '220px' },
    formRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
    input: { padding: '8px', margin: '5px', border: '1px solid #ccc', borderRadius: '4px', width: '220px' },
    numberInput: { padding: '8px', margin: '5px', border: '1px solid #ccc', borderRadius: '4px', width: '120px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { backgroundColor: '#f0f0f0', padding: '10px', textAlign: 'left' as const, border: '1px solid #ddd' },
    td: { padding: '10px', border: '1px solid #ddd' },
    button: { backgroundColor: 'orange', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', margin: '5px', cursor: 'pointer' },
    deleteButton: { backgroundColor: 'red', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', margin: '5px', cursor: 'pointer' },
    summaryCard: { backgroundColor: 'white', padding: '20px', margin: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'inline-block', width: '220px', textAlign: 'center' as const },
    orangeValue: { color: 'orange', fontWeight: 'bold' },
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>SwiftPOS Portion Check</h1>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Date Range Filter</h2>
        <div style={styles.formRow}>
          <label style={styles.label}>
            Start Date
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            End Date
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            Stock Item Type
            <select value={stockItemTypeFilter} onChange={e => setStockItemTypeFilter(e.target.value)} style={styles.input}>
              {stockItemOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Portion Production Summary</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SwiftPOS Stock Item</th>
              <th style={styles.th}>Portions Made</th>
              <th style={styles.th}>Total Weight kg</th>
            </tr>
          </thead>
          <tbody>
            {portionSummaryRows.map(row => (
              <tr key={row.swiftposStockItem}>
                <td style={styles.td}>{row.swiftposStockItem}</td>
                <td style={styles.td}>{row.portionsMade}</td>
                <td style={{ ...styles.td, ...styles.orangeValue }}>{row.totalWeight.toFixed(2)}</td>
              </tr>
            ))}
            {portionSummaryRows.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={3}>No saved portion sheets match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>SwiftPOS Sales Entry</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SwiftPOS Stock Item</th>
              <th style={styles.th}>Opening Stock Qty</th>
              <th style={styles.th}>Portions Made Qty</th>
              <th style={styles.th}>Sales Qty</th>
              <th style={styles.th}>Expected Closing Qty</th>
              <th style={styles.th}>Actual Closing Count</th>
              <th style={styles.th}>Variance Qty</th>
              <th style={styles.th}>Variance Status</th>
            </tr>
          </thead>
          <tbody>
            {salesRows.map((row, index) => {
              const expectedClosingQty = row.openingStockQty + row.portionsMadeQty - row.salesQty
              const varianceQty = row.actualClosingCount - expectedClosingQty
              const varianceStatus = varianceQty === 0 ? 'OK' : varianceQty < 0 ? 'Short' : 'Over'
              return (
                <tr key={row.swiftposStockItem}>
                  <td style={styles.td}>{row.swiftposStockItem}</td>
                  <td style={styles.td}><input type="number" value={row.openingStockQty} onChange={e => updateSalesRow(index, 'openingStockQty', Number(e.target.value))} style={styles.numberInput} /></td>
                  <td style={styles.td}>{row.portionsMadeQty}</td>
                  <td style={styles.td}><input type="number" value={row.salesQty} onChange={e => updateSalesRow(index, 'salesQty', Number(e.target.value))} style={styles.numberInput} /></td>
                  <td style={{ ...styles.td, ...styles.orangeValue }}>{expectedClosingQty}</td>
                  <td style={styles.td}><input type="number" value={row.actualClosingCount} onChange={e => updateSalesRow(index, 'actualClosingCount', Number(e.target.value))} style={styles.numberInput} /></td>
                  <td style={{ ...styles.td, ...styles.orangeValue }}>{varianceQty}</td>
                  <td style={styles.td}>{varianceStatus}</td>
                </tr>
              )
            })}
            {salesRows.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={8}>No production summary rows available for sales entry.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Summary Cards</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div style={styles.summaryCard}>
            <div>Total Portions Made</div>
            <div style={styles.orangeValue}>{totalPortionsMade}</div>
          </div>
          <div style={styles.summaryCard}>
            <div>Total Sales Entered</div>
            <div style={styles.orangeValue}>{totalSalesEntered}</div>
          </div>
          <div style={styles.summaryCard}>
            <div>Total Expected Closing</div>
            <div style={styles.orangeValue}>{totalExpectedClosing}</div>
          </div>
          <div style={styles.summaryCard}>
            <div>Total Actual Closing</div>
            <div style={styles.orangeValue}>{totalActualClosing}</div>
          </div>
          <div style={styles.summaryCard}>
            <div>Total Variance</div>
            <div style={styles.orangeValue}>{totalVariance}</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Save Check</h2>
        <div style={styles.formRow}>
          <label style={styles.label}>Prepared By<input type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} style={styles.input} /></label>
          <label style={styles.label}>Checked By<input type="text" value={checkedBy} onChange={e => setCheckedBy(e.target.value)} style={styles.input} /></label>
        </div>
        <button type="button" onClick={saveCheck} style={styles.button}>Save Check</button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Saved SwiftPOS Checks</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date Range</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Total Variance</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedChecks.map((check, index) => (
              <tr key={check.id}>
                <td style={styles.td}>{check.startDate || '—'} to {check.endDate || '—'}</td>
                <td style={styles.td}>{check.preparedBy}</td>
                <td style={styles.td}>{check.checkedBy}</td>
                <td style={{ ...styles.td, ...styles.orangeValue }}>{check.totals.totalVariance}</td>
                <td style={styles.td}>
                  <button type="button" onClick={() => deleteSavedCheck(index)} style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))}
            {savedChecks.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={5}>No saved SwiftPOS checks yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
