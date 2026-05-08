'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PortionHistoryPage() {
  const [sheets, setSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    const { data, error } = await supabase
      .from('portion_sheets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSheets(data)
    }

    setLoading(false)
  }

  const styles: any = {
    container: {
      padding: 30,
      background: '#f5f5f5',
      minHeight: '100vh',
    },
    title: {
      fontSize: 42,
      fontWeight: 800,
      marginBottom: 20,
    },
    card: {
      background: '#fff',
      padding: 20,
      borderRadius: 10,
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      background: '#eee',
      padding: 12,
      textAlign: 'left',
      border: '1px solid #ccc',
    },
    td: {
      padding: 12,
      border: '1px solid #ccc',
    },
    button: {
      background: 'orange',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: 6,
      textDecoration: 'none',
      display: 'inline-block',
      marginBottom: 20,
      fontWeight: 700,
    },
  }

  return (
    <div style={styles.container}>
      <Link href="/portioning" style={styles.button}>
        Back to Portioning
      </Link>

      <h1 style={styles.title}>Portioning History</h1>

      <div style={styles.card}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Prepared By</th>
                <th style={styles.th}>Checked By</th>
                <th style={styles.th}>Net Usable kg</th>
                <th style={styles.th}>Shrinkage kg</th>
                <th style={styles.th}>Variance %</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {sheets.map((sheet) => (
                <tr key={sheet.id}>
                  <td style={styles.td}>{sheet.sheet_date}</td>
                  <td style={styles.td}>{sheet.stock_item}</td>
                  <td style={styles.td}>{sheet.prepared_by}</td>
                  <td style={styles.td}>{sheet.checked_by}</td>
                  <td style={styles.td}>
                    {Number(sheet.net_usable_weight || 0).toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    {Number(sheet.total_shrinkage_kg || 0).toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    {Number(sheet.true_shortage_percent || 0).toFixed(2)}%
                  </td>
                  <td style={styles.td}>
                    {sheet.variance_status || 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}