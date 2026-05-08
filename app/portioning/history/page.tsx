'use client'

import { useState, useEffect } from 'react'

interface SavedSheet {
  date: string
  item: string
  preparedBy: string
  checkedBy: string
  netUsableWeight: number
  variance: number
}

export default function PortioningHistoryPage() {
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('portionSheets')
    if (saved) {
      setSavedSheets(JSON.parse(saved))
    }
  }, [])

  const deleteSavedSheet = (index: number) => {
    const updated = savedSheets.filter((_, i) => i !== index)
    setSavedSheets(updated)
    localStorage.setItem('portionSheets', JSON.stringify(updated))
  }

  const styles = {
    container: { backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' },
    card: { backgroundColor: 'white', padding: '20px', margin: '10px 0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    heading: { color: '#333', marginBottom: '10px', fontSize: '24px' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { backgroundColor: '#f0f0f0', padding: '10px', textAlign: 'left' as const, border: '1px solid #ddd' },
    td: { padding: '10px', border: '1px solid #ddd' },
    deleteButton: { backgroundColor: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Portion Sheet History</h1>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable Weight kg</th>
              <th style={styles.th}>Variance kg</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedSheets.map((s, i) => (
              <tr key={i}>
                <td style={styles.td}>{s.date}</td>
                <td style={styles.td}>{s.item}</td>
                <td style={styles.td}>{s.preparedBy}</td>
                <td style={styles.td}>{s.checkedBy}</td>
                <td style={styles.td}>{s.netUsableWeight.toFixed(2)}</td>
                <td style={styles.td}>{s.variance.toFixed(2)}</td>
                <td style={styles.td}><button onClick={() => deleteSavedSheet(i)} style={styles.deleteButton}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}