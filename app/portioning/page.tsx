'use client'

import { useEffect, useMemo, useState } from 'react'

type PortionLogItem = {
  item: string
  portionSize: number
  qtyProduced: number
  totalWeight: number
}

type CookedYieldItem = {
  cookedItemName: string
  rawStockItemUsed: string
  rawWeight: number
  cookedWeight: number
  portionSize: number
  qtyProduced: number
  shrinkageKg: number
  shrinkagePercent: number
  cookedYieldPercent: number
}

type TrimUsage = {
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
  cookedYield: CookedYieldItem[]
}

type PortionConfig = {
  title: string
  rawRows: { item: string; portionSize: number }[]
  cookedRows: { cookedItemName: string; portionSize: number }[]
}

const makeRaw = (item: string, portionSize: number): PortionLogItem => ({
  item,
  portionSize,
  qtyProduced: 0,
  totalWeight: 0,
})

const makeCooked = (
  cookedItemName: string,
  rawStockItemUsed: string,
  portionSize: number
): CookedYieldItem => ({
  cookedItemName,
  rawStockItemUsed,
  rawWeight: 0,
  cookedWeight: 0,
  portionSize,
  qtyProduced: 0,
  shrinkageKg: 0,
  shrinkagePercent: 0,
  cookedYieldPercent: 0,
})

const portionConfigs: Record<string, PortionConfig> = {
  'Chicken Supreme': {
    title: 'CHICKEN SUPREME PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Spicy Chicken', portionSize: 200 },
      { item: 'Popcorn Chicken', portionSize: 100 },
      { item: 'Chicken Parma', portionSize: 200 },
      { item: 'Chicken Kebabs', portionSize: 200 },
      { item: 'Sizzling Chicken', portionSize: 200 },
      { item: 'Stuffed Chicken', portionSize: 200 },
      { item: 'Fried Rice Chicken', portionSize: 100 },
      { item: 'Extra Chicken', portionSize: 100 },
    ],
    cookedRows: [
      { cookedItemName: 'BBQ Chicken', portionSize: 150 },
      { cookedItemName: 'BBQ Chicken', portionSize: 50 },
      { cookedItemName: 'Tandoori Chicken', portionSize: 150 },
      { cookedItemName: 'Tandoori Chicken', portionSize: 50 },
      { cookedItemName: 'Chicken Mushroom', portionSize: 150 },
    ],
  },

  'Wahoo Fish': {
    title: 'WAHOO FISH PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Panfried Snapper', portionSize: 200 },
      { item: 'Fish & Chips', portionSize: 100 },
      { item: 'Sizzling Fish', portionSize: 200 },
    ],
    cookedRows: [],
  },

  'Marlin Fish': {
    title: 'MARLIN FISH PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Fish Patty', portionSize: 150 },
      { item: 'Fish Finger', portionSize: 100 },
      { item: 'Kokoda', portionSize: 200 },
      { item: 'Fish Curry', portionSize: 150 },
      { item: 'Fish Tacos', portionSize: 100 },
      { item: 'Fish Burger', portionSize: 150 },
      { item: 'Extra Fish', portionSize: 100 },
    ],
    cookedRows: [],
  },

  Wings: {
    title: 'WINGS PORTION CONTROL SHEET',
    rawRows: [{ item: 'BBQ Wings', portionSize: 0 }],
    cookedRows: [],
  },

  'Chicken Mince': {
    title: 'CHICKEN MINCE PORTION CONTROL SHEET',
    rawRows: [{ item: 'Chicken Mince', portionSize: 0 }],
    cookedRows: [],
  },

  'Fried Chicken': {
    title: 'FRIED CHICKEN PORTION CONTROL SHEET',
    rawRows: [{ item: 'Fried Chicken', portionSize: 200 }],
    cookedRows: [],
  },

  'Chicken Drumstick': {
    title: 'CHICKEN DRUMSTICK PORTION CONTROL SHEET',
    rawRows: [{ item: 'Drumstick', portionSize: 100 }],
    cookedRows: [],
  },

  'Beef Mince': {
    title: 'BEEF MINCE PORTION CONTROL SHEET',
    rawRows: [{ item: 'Beef Patty', portionSize: 0 }],
    cookedRows: [{ cookedItemName: 'Cooked Beef Mince', portionSize: 0 }],
  },

  Lasagne: {
    title: 'LASAGNE PORTION CONTROL SHEET',
    rawRows: [{ item: 'Lasagne', portionSize: 0 }],
    cookedRows: [{ cookedItemName: 'Lasagne', portionSize: 0 }],
  },

  'Beef Topside Steak': {
    title: 'BEEF TOPSIDE STEAK PORTION CONTROL SHEET',
    rawRows: [{ item: 'Beef Sizzling', portionSize: 200 }],
    cookedRows: [],
  },

  'Streaky Bacon': {
    title: 'STREAKY BACON PORTION CONTROL SHEET',
    rawRows: [{ item: 'Streaky Bacon', portionSize: 100 }],
    cookedRows: [],
  },

  'Bacon Bits': {
    title: 'BACON BITS PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Bacon Bits', portionSize: 100 },
      { item: 'Bacon Bits', portionSize: 150 },
      { item: 'Bacon Bits', portionSize: 50 },
    ],
    cookedRows: [],
  },

  'Lamb Chops': {
    title: 'LAMB CHOPS PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Chilli Lamb', portionSize: 200 },
      { item: 'BBQ Lamb', portionSize: 200 },
    ],
    cookedRows: [],
  },

  Mussel: {
    title: 'MUSSEL PORTION CONTROL SHEET',
    rawRows: [{ item: 'Mussel', portionSize: 120 }],
    cookedRows: [],
  },

  Prawn: {
    title: 'PRAWN PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Prawn', portionSize: 100 },
      { item: 'Prawn', portionSize: 200 },
    ],
    cookedRows: [],
  },

  'Squid Tubes': {
    title: 'SQUID TUBES PORTION CONTROL SHEET',
    rawRows: [{ item: 'Squid', portionSize: 75 }],
    cookedRows: [],
  },

  Octopus: {
    title: 'OCTOPUS PORTION CONTROL SHEET',
    rawRows: [{ item: 'Octopus', portionSize: 75 }],
    cookedRows: [],
  },

  Lobster: {
    title: 'LOBSTER PORTION CONTROL SHEET',
    rawRows: [{ item: 'Lobster', portionSize: 400 }],
    cookedRows: [],
  },

  'Whole Snapper': {
    title: 'WHOLE SNAPPER PORTION CONTROL SHEET',
    rawRows: [{ item: 'Whole Snapper', portionSize: 400 }],
    cookedRows: [],
  },

  Fries: {
    title: 'FRIES PORTION CONTROL SHEET',
    rawRows: [{ item: 'Fries', portionSize: 200 }],
    cookedRows: [],
  },

  'Cassava Fries': {
    title: 'CASSAVA FRIES PORTION CONTROL SHEET',
    rawRows: [{ item: 'Cassava Fries', portionSize: 200 }],
    cookedRows: [],
  },

  Mozzarella: {
    title: 'MOZZARELLA PORTION CONTROL SHEET',
    rawRows: [
      { item: 'Mozzarella', portionSize: 150 },
      { item: 'Mozzarella', portionSize: 50 },
    ],
    cookedRows: [],
  },
}

const stockItemOptions = Object.keys(portionConfigs)

export default function PortioningPage() {
  const today = new Date().toISOString().split('T')[0]

  const [selectedStockItem, setSelectedStockItem] = useState('')
  const [date, setDate] = useState(today)
  const [item, setItem] = useState('')
  const [numBoxes, setNumBoxes] = useState(0)
  const [weightPerBox, setWeightPerBox] = useState(0)
  const [preparedBy, setPreparedBy] = useState('')
  const [checkedBy, setCheckedBy] = useState('')

  const [totalFrozen, setTotalFrozen] = useState(0)
  const [totalDefrosted, setTotalDefrosted] = useState(0)
  const [trimOffcuts, setTrimOffcuts] = useState(0)
  const [wastage, setWastage] = useState(0)

  const [portionLog, setPortionLog] = useState<PortionLogItem[]>([])
  const [cookedYield, setCookedYield] = useState<CookedYieldItem[]>([])
  const [trimUsage, setTrimUsage] = useState<TrimUsage[]>([
    { name: 'Staff Meals', weight: 0 },
    { name: 'Fried Rice', weight: 0 },
    { name: 'Other', weight: 0 },
  ])

  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([])
  const [filterStockItem, setFilterStockItem] = useState('')
  const [acceptableVariancePercent, setAcceptableVariancePercent] = useState(2)

  useEffect(() => {
    const saved = localStorage.getItem('portionSheets')
    if (saved) {
      setSavedSheets(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (!selectedStockItem) {
      setPortionLog([])
      setCookedYield([])
      setItem('')
      return
    }

    const config = portionConfigs[selectedStockItem]
    setItem(selectedStockItem)
    setPortionLog(config.rawRows.map(row => makeRaw(row.item, row.portionSize)))
    setCookedYield(
      config.cookedRows.map(row =>
        makeCooked(row.cookedItemName, selectedStockItem, row.portionSize)
      )
    )
  }, [selectedStockItem])

  const totalWeightPortioned = numBoxes * weightPerBox
  const netUsable = totalDefrosted - trimOffcuts - wastage
  const yieldPercent = totalFrozen > 0 ? (netUsable / totalFrozen) * 100 : 0

  const totalRawPortionWeight = portionLog.reduce(
    (sum, row) => sum + row.totalWeight,
    0
  )

  const totalCookedRawWeightUsed = cookedYield.reduce(
    (sum, row) => sum + row.rawWeight,
    0
  )

  const totalShrinkageKg = cookedYield.reduce(
    (sum, row) => sum + row.shrinkageKg,
    0
  )

  const totalTrimUsageWeight = trimUsage.reduce(
    (sum, entry) => sum + entry.weight,
    0
  )

  const totalPortionWeight = totalRawPortionWeight + totalCookedRawWeightUsed
  const totalAccountedWeight = totalPortionWeight + totalTrimUsageWeight
  const trueVarianceKg = netUsable - totalAccountedWeight

  const trueVariancePercent =
    netUsable > 0 ? (trueVarianceKg / netUsable) * 100 : 0

  const varianceStatus =
    Math.abs(trueVariancePercent) <= acceptableVariancePercent
      ? 'OK'
      : 'FLAGGED'

  const updatePortionLog = (
    index: number,
    field: keyof PortionLogItem,
    value: string | number
  ) => {
    setPortionLog(prev =>
      prev.map((entry, i) => {
        if (i !== index) return entry

        const updated = { ...entry, [field]: value } as PortionLogItem
        const portionSize = Number(updated.portionSize) || 0
        const qtyProduced = Number(updated.qtyProduced) || 0
        updated.totalWeight = (portionSize * qtyProduced) / 1000

        return updated
      })
    )
  }

  const updateCookedYield = (
    index: number,
    field: keyof CookedYieldItem,
    value: string | number
  ) => {
    setCookedYield(prev =>
      prev.map((entry, i) => {
        if (i !== index) return entry

        const updated = { ...entry, [field]: value } as CookedYieldItem
        const rawWeight = Number(updated.rawWeight) || 0
        const cookedWeight = Number(updated.cookedWeight) || 0
        const portionSize = Number(updated.portionSize) || 0

        updated.qtyProduced =
          portionSize > 0 ? Math.floor((cookedWeight * 1000) / portionSize) : 0

        updated.shrinkageKg = rawWeight - cookedWeight
        updated.shrinkagePercent =
          rawWeight > 0 ? ((rawWeight - cookedWeight) / rawWeight) * 100 : 0
        updated.cookedYieldPercent =
          rawWeight > 0 ? (cookedWeight / rawWeight) * 100 : 0

        return updated
      })
    )
  }

  const updateTrimUsage = (index: number, weight: number) => {
    setTrimUsage(prev =>
      prev.map((entry, i) => (i === index ? { ...entry, weight } : entry))
    )
  }

  const addPortionRow = () => {
    setPortionLog(prev => [
      ...prev,
      { item: '', portionSize: 0, qtyProduced: 0, totalWeight: 0 },
    ])
  }

  const deletePortionRow = (index: number) => {
    setPortionLog(prev => prev.filter((_, i) => i !== index))
  }

  const addCookedYieldRow = () => {
    setCookedYield(prev => [
      ...prev,
      makeCooked('', selectedStockItem || '', 0),
    ])
  }

  const deleteCookedYieldRow = (index: number) => {
    setCookedYield(prev => prev.filter((_, i) => i !== index))
  }

  const portionSummaryRows = useMemo(() => {
    const grouped: Record<
      string,
      { portionSize: number; totalQty: number; totalWeight: number }
    > = {}

    portionLog.forEach(row => {
      if (!row.portionSize) return

      const key = `${row.portionSize}`

      if (!grouped[key]) {
        grouped[key] = {
          portionSize: row.portionSize,
          totalQty: 0,
          totalWeight: 0,
        }
      }

      grouped[key].totalQty += Number(row.qtyProduced) || 0
      grouped[key].totalWeight += Number(row.totalWeight) || 0
    })

    return Object.values(grouped).sort((a, b) => a.portionSize - b.portionSize)
  }, [portionLog])

  const cookedYieldSummaryRows = useMemo(() => {
    const grouped: Record<
      string,
      { portionSize: number; totalQty: number; totalWeight: number }
    > = {}

    cookedYield.forEach(row => {
      if (!row.portionSize) return

      const key = `${row.portionSize}`
      const totalWeight = (row.portionSize * row.qtyProduced) / 1000

      if (!grouped[key]) {
        grouped[key] = {
          portionSize: row.portionSize,
          totalQty: 0,
          totalWeight: 0,
        }
      }

      grouped[key].totalQty += Number(row.qtyProduced) || 0
      grouped[key].totalWeight += Number(totalWeight) || 0
    })

    return Object.values(grouped).sort((a, b) => a.portionSize - b.portionSize)
  }, [cookedYield])

  const portionSummaryByGramSize: PortionSummaryItem[] = [
    ...portionSummaryRows.map(row => ({
      portionSize: row.portionSize,
      stockItemName: `${selectedStockItem} ${row.portionSize}g Portion`,
      totalQty: row.totalQty,
      totalWeightKg: row.totalWeight,
    })),
    ...cookedYieldSummaryRows.map(row => ({
      portionSize: row.portionSize,
      stockItemName: `${selectedStockItem} Cooked ${row.portionSize}g Portion`,
      totalQty: row.totalQty,
      totalWeightKg: row.totalWeight,
    })),
  ]

  const saveSheet = () => {
    if (!selectedStockItem) {
      alert('Please select a stock item first.')
      return
    }

    const sheet: SavedSheet = {
      stockItem: selectedStockItem,
      date,
      item,
      preparedBy,
      checkedBy,
      netUsableWeight: netUsable,
      totalRawPortionWeight,
      totalCookedRawWeightUsed,
      totalTrimUsage: totalTrimUsageWeight,
      totalAccountedWeight,
      trueShortageKg: trueVarianceKg,
      totalShrinkageKg,
      trueShortagePercent: trueVariancePercent,
      acceptableVariancePercent,
      varianceStatus,
      portionSummaryByGramSize,
      cookedYield,
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

  const filteredSheets = savedSheets.filter(
    sheet => !filterStockItem || sheet.stockItem === filterStockItem
  )

  const styles = {
    container: {
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '20px',
      color: '#111',
      fontFamily: 'Arial, sans-serif',
    },
    card: {
      backgroundColor: 'white',
      padding: '20px',
      margin: '12px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    heading: {
      color: '#333',
      marginBottom: '10px',
      fontSize: '26px',
      fontWeight: 800,
    },
    subHeading: {
      color: '#333',
      marginBottom: '12px',
      fontSize: '18px',
      fontWeight: 700,
    },
    input: {
      padding: '8px',
      marginTop: '5px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      width: '200px',
    },
    numberInput: {
      padding: '8px',
      marginTop: '5px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      width: '120px',
    },
    fullWidthInput: {
      padding: '8px',
      marginTop: '5px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      backgroundColor: '#f0f0f0',
      padding: '10px',
      textAlign: 'left' as const,
      border: '1px solid #ddd',
    },
    td: {
      padding: '10px',
      border: '1px solid #ddd',
    },
    summaryCard: {
      backgroundColor: 'white',
      padding: '20px',
      margin: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'inline-block',
      width: '220px',
      textAlign: 'center' as const,
      verticalAlign: 'top',
    },
    summaryValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginTop: '8px',
    },
    label: {
      display: 'flex',
      flexDirection: 'column' as const,
      margin: '5px',
      fontWeight: 500,
    },
    formRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      alignItems: 'end',
    },
    button: {
      backgroundColor: 'orange',
      color: 'white',
      padding: '10px 15px',
      border: 'none',
      borderRadius: '4px',
      margin: '5px',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
      fontWeight: 700,
    },
    deleteButton: {
      backgroundColor: 'red',
      color: 'white',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    buttonRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '10px',
      marginTop: '10px',
    },
  }

  const pageTitle =
    selectedStockItem && portionConfigs[selectedStockItem]
      ? portionConfigs[selectedStockItem].title
      : 'PORTION CONTROL SHEET'

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href="/portioning-summary" style={styles.button}>
          View Portioning Summary
        </a>
      </div>

      <h1 style={styles.heading}>{pageTitle}</h1>

      <div style={styles.card}>
        <label style={styles.label}>
          Stock Item To Portion
          <select
            value={selectedStockItem}
            onChange={e => setSelectedStockItem(e.target.value)}
            style={styles.fullWidthInput}
          >
            <option value="">Select Stock Item</option>
            {stockItemOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Sheet Details</h2>

        <div style={styles.formRow}>
          <label style={styles.label}>
            Date
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Item
            <input
              type="text"
              value={item}
              onChange={e => setItem(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Number of Boxes
            <input
              type="number"
              value={numBoxes}
              onChange={e => setNumBoxes(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Weight Per Box kg
            <input
              type="number"
              value={weightPerBox}
              onChange={e => setWeightPerBox(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Total Weight being Portioned kg
            <strong>{totalWeightPortioned.toFixed(2)}</strong>
          </label>

          <label style={styles.label}>
            Prepared By
            <input
              type="text"
              value={preparedBy}
              onChange={e => setPreparedBy(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Checked By
            <input
              type="text"
              value={checkedBy}
              onChange={e => setCheckedBy(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Yield Summary</h2>

        <div style={styles.formRow}>
          <label style={styles.label}>
            Total Frozen Weight kg
            <input
              type="number"
              value={totalFrozen}
              onChange={e => setTotalFrozen(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Total Defrosted Weight kg
            <input
              type="number"
              value={totalDefrosted}
              onChange={e => setTotalDefrosted(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Trim / Offcuts kg
            <input
              type="number"
              value={trimOffcuts}
              onChange={e => setTrimOffcuts(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Wastage kg
            <input
              type="number"
              value={wastage}
              onChange={e => setWastage(Number(e.target.value))}
              style={styles.numberInput}
            />
          </label>

          <label style={styles.label}>
            Net Usable Weight kg
            <strong>{netUsable.toFixed(2)}</strong>
          </label>

          <label style={styles.label}>
            Yield %
            <strong>{yieldPercent.toFixed(2)}%</strong>
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Portion Log, Raw Items</h2>

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
            {portionLog.map((row, index) => (
              <tr key={index}>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={row.item}
                    onChange={e =>
                      updatePortionLog(index, 'item', e.target.value)
                    }
                    style={styles.input}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.portionSize}
                    onChange={e =>
                      updatePortionLog(
                        index,
                        'portionSize',
                        Number(e.target.value)
                      )
                    }
                    style={styles.numberInput}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.qtyProduced}
                    onChange={e =>
                      updatePortionLog(
                        index,
                        'qtyProduced',
                        Number(e.target.value)
                      )
                    }
                    style={styles.numberInput}
                  />
                </td>

                <td style={styles.td}>{row.totalWeight.toFixed(2)}</td>

                <td style={styles.td}>
                  <button
                    type="button"
                    onClick={() => deletePortionRow(index)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addPortionRow} style={styles.button}>
          Add Raw Row
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Cooked Yield / Shrinkage</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Cooked Item</th>
              <th style={styles.th}>Raw Stock Used</th>
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
            {cookedYield.map((row, index) => (
              <tr key={index}>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={row.cookedItemName}
                    onChange={e =>
                      updateCookedYield(index, 'cookedItemName', e.target.value)
                    }
                    style={styles.input}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="text"
                    value={row.rawStockItemUsed}
                    onChange={e =>
                      updateCookedYield(index, 'rawStockItemUsed', e.target.value)
                    }
                    style={styles.input}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.rawWeight}
                    onChange={e =>
                      updateCookedYield(index, 'rawWeight', Number(e.target.value))
                    }
                    style={styles.numberInput}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.cookedWeight}
                    onChange={e =>
                      updateCookedYield(
                        index,
                        'cookedWeight',
                        Number(e.target.value)
                      )
                    }
                    style={styles.numberInput}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.portionSize}
                    onChange={e =>
                      updateCookedYield(
                        index,
                        'portionSize',
                        Number(e.target.value)
                      )
                    }
                    style={styles.numberInput}
                  />
                </td>

                <td style={styles.td}>{row.qtyProduced}</td>
                <td style={styles.td}>{row.shrinkageKg.toFixed(2)}</td>
                <td style={styles.td}>{row.shrinkagePercent.toFixed(2)}%</td>
                <td style={styles.td}>{row.cookedYieldPercent.toFixed(2)}%</td>

                <td style={styles.td}>
                  <button
                    type="button"
                    onClick={() => deleteCookedYieldRow(index)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={addCookedYieldRow}
          style={styles.button}
        >
          Add Cooked Row
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Trim Usage</h2>

        <div style={styles.formRow}>
          {trimUsage.map((trim, index) => (
            <label key={trim.name} style={styles.label}>
              {trim.name}
              <input
                type="number"
                value={trim.weight}
                onChange={e => updateTrimUsage(index, Number(e.target.value))}
                style={styles.numberInput}
              />
            </label>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Summary</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>
            Acceptable Variance %
            <input
              type="number"
              value={acceptableVariancePercent}
              onChange={e =>
                setAcceptableVariancePercent(Number(e.target.value))
              }
              style={styles.numberInput}
            />
          </label>
        </div>

        <div style={styles.summaryCard}>
          <div>Net Usable Weight</div>
          <div style={styles.summaryValue}>{netUsable.toFixed(2)} kg</div>
        </div>

        <div style={styles.summaryCard}>
          <div>Raw Portion Weight</div>
          <div style={styles.summaryValue}>
            {totalRawPortionWeight.toFixed(2)} kg
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div>Cooked Raw Weight Used</div>
          <div style={styles.summaryValue}>
            {totalCookedRawWeightUsed.toFixed(2)} kg
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div>Shrinkage Weight</div>
          <div style={styles.summaryValue}>{totalShrinkageKg.toFixed(2)} kg</div>
        </div>

        <div style={styles.summaryCard}>
          <div>Trim Usage</div>
          <div style={styles.summaryValue}>
            {totalTrimUsageWeight.toFixed(2)} kg
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div>Total Accounted Weight</div>
          <div style={styles.summaryValue}>
            {totalAccountedWeight.toFixed(2)} kg
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div>True Variance kg</div>
          <div style={styles.summaryValue}>{trueVarianceKg.toFixed(2)} kg</div>
        </div>

        <div style={styles.summaryCard}>
          <div>True Variance %</div>
          <div style={styles.summaryValue}>
            {trueVariancePercent.toFixed(2)}%
          </div>
        </div>

        <div
          style={{
            ...styles.summaryCard,
            backgroundColor: varianceStatus === 'OK' ? '#d4edda' : '#f8d7da',
            border:
              varianceStatus === 'OK'
                ? '2px solid #28a745'
                : '2px solid #dc3545',
          }}
        >
          <div>Variance Status</div>
          <div
            style={{
              ...styles.summaryValue,
              color: varianceStatus === 'OK' ? '#28a745' : '#dc3545',
            }}
          >
            {varianceStatus}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Portion Summary By Gram Size</h2>

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
                <td style={{ ...styles.td, color: 'orange', fontWeight: 700 }}>
                  {row.totalQty}
                </td>
                <td style={{ ...styles.td, color: 'orange', fontWeight: 700 }}>
                  {row.totalWeightKg.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.buttonRow}>
        <button type="button" onClick={saveSheet} style={styles.button}>
          Save Sheet
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          style={styles.button}
        >
          Print Sheet
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subHeading}>Saved Portion Sheets</h2>

        <label style={styles.label}>
          Filter by stock item
          <select
            value={filterStockItem}
            onChange={e => setFilterStockItem(e.target.value)}
            style={styles.fullWidthInput}
          >
            <option value="">All</option>
            {stockItemOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable kg</th>
              <th style={styles.th}>Shrinkage kg</th>
              <th style={styles.th}>True Variance kg</th>
              <th style={styles.th}>Variance Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredSheets.map((sheet, index) => (
              <tr key={index}>
                <td style={styles.td}>{sheet.date}</td>
                <td style={styles.td}>{sheet.stockItem}</td>
                <td style={styles.td}>{sheet.preparedBy}</td>
                <td style={styles.td}>{sheet.checkedBy}</td>
                <td style={styles.td}>{sheet.netUsableWeight.toFixed(2)}</td>
                <td style={styles.td}>{sheet.totalShrinkageKg.toFixed(2)}</td>
                <td style={styles.td}>{sheet.trueShortageKg.toFixed(2)}</td>
                <td style={styles.td}>{sheet.varianceStatus}</td>
                <td style={styles.td}>
                  <button
                    type="button"
                    onClick={() => deleteSavedSheet(index)}
                    style={styles.deleteButton}
                  >
                    Delete
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