'use client'

import { useEffect, useMemo, useState } from 'react'

interface PortionSummaryItem {
  portionSize: number
  stockItemName: string
  totalQty: number
  totalWeightKg: number
}

interface SavedSheet {
  stockItem: string
  date: string
  item?: string
  preparedBy: string
  checkedBy: string
  netUsableWeight: number
  totalAccountedWeight: number
  trueShortageKg: number
  totalShrinkageKg: number
  trueShortagePercent: number
  acceptableVariancePercent?: number
  varianceStatus?: string
  portionSummaryByGramSize: PortionSummaryItem[]
}

export default function PortioningSummaryPage() {
  const today = new Date().toISOString().split('T')[0]

  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([])
  const [dateRange, setDateRange] = useState('This Month')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [stockFilter, setStockFilter] = useState('All')
  const [forecastDays, setForecastDays] = useState(7)
  const [bufferPercent, setBufferPercent] = useState(15)
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({})

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
    const now = new Date()
    const todayString = now.toISOString().split('T')[0]

    if (dateRange === 'Today') {
      setStartDate(todayString)
      setEndDate(todayString)
    }

    if (dateRange === 'This Week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      setStartDate(monday.toISOString().split('T')[0])
      setEndDate(todayString)
    }

    if (dateRange === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(todayString)
    }
  }, [dateRange])

  const numberOfDays = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 1
  }, [startDate, endDate])

  const filteredSheets = useMemo(() => {
    return savedSheets.filter(sheet => {
      const dateOk = sheet.date >= startDate && sheet.date <= endDate
      const stockOk = stockFilter === 'All' || sheet.stockItem === stockFilter
      return dateOk && stockOk
    })
  }, [savedSheets, startDate, endDate, stockFilter])

  const groupedPortions = useMemo(() => {
    const grouped: Record<string, PortionSummaryItem> = {}

    filteredSheets.forEach(sheet => {
      if (!Array.isArray(sheet.portionSummaryByGramSize)) return

      sheet.portionSummaryByGramSize.forEach(row => {
        const key = `${row.stockItemName}-${row.portionSize}`

        if (!grouped[key]) {
          grouped[key] = {
            stockItemName: row.stockItemName,
            portionSize: row.portionSize,
            totalQty: 0,
            totalWeightKg: 0,
          }
        }

        grouped[key].totalQty += Number(row.totalQty) || 0
        grouped[key].totalWeightKg += Number(row.totalWeightKg) || 0
      })
    })

    return Object.values(grouped).sort((a, b) =>
      a.stockItemName.localeCompare(b.stockItemName)
    )
  }, [filteredSheets])

  const summary = {
    totalSheets: filteredSheets.length,
    totalPortionsProduced: groupedPortions.reduce((sum, row) => sum + row.totalQty, 0),
    netUsableWeight: filteredSheets.reduce((sum, row) => sum + (Number(row.netUsableWeight) || 0), 0),
    totalAccountedWeight: filteredSheets.reduce((sum, row) => sum + (Number(row.totalAccountedWeight) || 0), 0),
    totalShrinkageKg: filteredSheets.reduce((sum, row) => sum + (Number(row.totalShrinkageKg) || 0), 0),
    trueShortageKg: filteredSheets.reduce((sum, row) => sum + (Number(row.trueShortageKg) || 0), 0),
  }

  const purchasingRows = groupedPortions.map(row => {
    const totalUsedKg = row.totalWeightKg
    const averageDailyUsageKg = totalUsedKg / numberOfDays
    const forecastUsageKg = averageDailyUsageKg * forecastDays
    const requiredStockKg = forecastUsageKg * (1 + bufferPercent / 100)
    const currentStockKg = currentStock[row.stockItemName] || 0
    const suggestedPurchaseKg = Math.max(requiredStockKg - currentStockKg, 0)

    return {
      stockItemName: row.stockItemName,
      totalUsedKg,
      averageDailyUsageKg,
      forecastUsageKg,
      requiredStockKg,
      currentStockKg,
      suggestedPurchaseKg,
    }
  })

  const styles = {
    container: {
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '24px',
      color: '#111',
    },
    card: {
      backgroundColor: '#fff',
      padding: '20px',
      marginBottom: '18px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    heading: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    subHeading: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '14px',
    },
    row: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      alignItems: 'end',
    },
    label: {
      display: 'flex',
      flexDirection: 'column' as const,
      fontWeight: 'bold',
      fontSize: '14px',
      gap: '6px',
    },
    input: {
      padding: '9px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      minWidth: '180px',
    },
    button: {
      backgroundColor: 'orange',
      color: '#fff',
      padding: '10px 15px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 'bold',
      display: 'inline-block',
      marginBottom: '15px',
    },
    metricGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
    },
    metricCard: {
      backgroundColor: '#fff7ec',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #ffd9a8',
      textAlign: 'center' as const,
    },
    metricLabel: {
      fontSize: '14px',
      marginBottom: '8px',
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#d46b08',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '10px',
    },
    th: {
      backgroundColor: '#111827',
      color: '#fff',
      padding: '10px',
      textAlign: 'left' as const,
      border: '1px solid #ddd',
      fontSize: '13px',
    },
    td: {
      padding: '10px',
      border: '1px solid #ddd',
      fontSize: '13px',
      backgroundColor: '#fff',
    },
    orangeText: {
      color: '#d46b08',
      fontWeight: 'bold',
    },
  }

  return (
    <div style={styles.container}>
      <a href="/portioning" style={styles.button}>
        Back to Portioning
      </a>

      <h1 style={styles.heading}>Portioning Summary</h1>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Filters</h2>

        <div style={styles.row}>
          <label style={styles.label}>
            Date Range
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={styles.input}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Date Range</option>
            </select>
          </label>

          <label style={styles.label}>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Stock Item
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              style={styles.input}
            >
              <option>All</option>
              <option>Chicken Supreme</option>
              <option>Wahoo Fish</option>
              <option>Marlin Fish</option>
            </select>
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Summary Cards</h2>

        <div style={styles.metricGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Sheets</div>
            <div style={styles.metricValue}>{summary.totalSheets}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Portions Produced</div>
            <div style={styles.metricValue}>{summary.totalPortionsProduced}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Net Usable Weight</div>
            <div style={styles.metricValue}>{summary.netUsableWeight.toFixed(2)} kg</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Accounted Weight</div>
            <div style={styles.metricValue}>{summary.totalAccountedWeight.toFixed(2)} kg</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Shrinkage</div>
            <div style={styles.metricValue}>{summary.totalShrinkageKg.toFixed(2)} kg</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>True Shortage</div>
            <div style={styles.metricValue}>{summary.trueShortageKg.toFixed(2)} kg</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Portions Made Summary</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SwiftPOS Stock Item</th>
              <th style={styles.th}>Portion Size</th>
              <th style={styles.th}>Total Qty Produced</th>
              <th style={styles.th}>Total Weight kg</th>
            </tr>
          </thead>

          <tbody>
            {groupedPortions.map(row => (
              <tr key={row.stockItemName}>
                <td style={styles.td}>{row.stockItemName}</td>
                <td style={styles.td}>{row.portionSize}g</td>
                <td style={styles.td}>{row.totalQty}</td>
                <td style={styles.td}>{row.totalWeightKg.toFixed(2)}</td>
              </tr>
            ))}

            {groupedPortions.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={4}>
                  No saved portion sheets found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Forecast Purchasing & Par Levels</h2>

        <div style={styles.row}>
          <label style={styles.label}>
            Forecast Days Required
            <input
              type="number"
              value={forecastDays}
              onChange={e => setForecastDays(Number(e.target.value))}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Safety Buffer %
            <input
              type="number"
              value={bufferPercent}
              onChange={e => setBufferPercent(Number(e.target.value))}
              style={styles.input}
            />
          </label>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Total Used kg</th>
              <th style={styles.th}>Average Daily Usage kg</th>
              <th style={styles.th}>Forecast Usage kg</th>
              <th style={styles.th}>Required Stock kg</th>
              <th style={styles.th}>Current Stock On Hand kg</th>
              <th style={styles.th}>Suggested Purchase kg</th>
            </tr>
          </thead>

          <tbody>
            {purchasingRows.map(row => (
              <tr key={row.stockItemName}>
                <td style={styles.td}>{row.stockItemName}</td>
                <td style={styles.td}>{row.totalUsedKg.toFixed(2)}</td>
                <td style={styles.td}>{row.averageDailyUsageKg.toFixed(2)}</td>
                <td style={styles.td}>{row.forecastUsageKg.toFixed(2)}</td>
                <td style={styles.td}>{row.requiredStockKg.toFixed(2)}</td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={currentStock[row.stockItemName] || ''}
                    onChange={e =>
                      setCurrentStock({
                        ...currentStock,
                        [row.stockItemName]: Number(e.target.value),
                      })
                    }
                    style={{ ...styles.input, minWidth: '100px', width: '100px' }}
                  />
                </td>
                <td style={{ ...styles.td, ...styles.orangeText }}>
                  {row.suggestedPurchaseKg.toFixed(2)}
                </td>
              </tr>
            ))}

            {purchasingRows.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Save portion sheets first, then purchasing forecasts will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Detailed Saved Sheets</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable Weight</th>
              <th style={styles.th}>Total Accounted Weight</th>
              <th style={styles.th}>Total Shrinkage</th>
              <th style={styles.th}>True Shortage</th>
              <th style={styles.th}>Variance Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredSheets.map((sheet, index) => (
              <tr key={index}>
                <td style={styles.td}>{sheet.date}</td>
                <td style={styles.td}>{sheet.stockItem}</td>
                <td style={styles.td}>{sheet.preparedBy}</td>
                <td style={styles.td}>{sheet.checkedBy}</td>
                <td style={styles.td}>{Number(sheet.netUsableWeight || 0).toFixed(2)} kg</td>
                <td style={styles.td}>{Number(sheet.totalAccountedWeight || 0).toFixed(2)} kg</td>
                <td style={styles.td}>{Number(sheet.totalShrinkageKg || 0).toFixed(2)} kg</td>
                <td style={styles.td}>{Number(sheet.trueShortageKg || 0).toFixed(2)} kg</td>
                <td
                  style={{
                    ...styles.td,
                    fontWeight: 'bold',
                    color: sheet.varianceStatus === 'OK' ? 'green' : 'red',
                  }}
                >
                  {sheet.varianceStatus || 'Not Set'}
                </td>
              </tr>
            ))}

            {filteredSheets.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={9}>
                  No saved portion sheets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}