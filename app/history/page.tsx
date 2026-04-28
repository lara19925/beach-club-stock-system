'use client'

import { useEffect, useState } from 'react'

type StockRow = {
  code: string
  item: string
  unit: string
  opening: number
  purchased: number
  sold: number
  closing: number
  action: string
  comment: string
}

type SavedStocktake = {
  id: string
  date: string
  day: string
  location: string
  stocktakeDoneBy: string
  supervisedBy: string
  physicalSignedOff: string
  signOffNotes: string
  submittedAt: string
  totalVariance: number
  rows: StockRow[]
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SavedStocktake[]>([])
  const [selected, setSelected] = useState<SavedStocktake | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('stocktakeHistory')

    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Stocktake History
      </h1>

      {history.length === 0 && (
        <div className="bg-yellow-100 p-4 rounded">
          No stocktakes saved yet.
        </div>
      )}

      {/* LIST */}
      <div className="grid gap-3 mb-6">
        {history.map((entry) => (
          <div
            key={entry.id}
            onClick={() => setSelected(entry)}
            className="bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-50"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">
                  {entry.location}
                </p>
                <p className="text-sm text-gray-500">
                  {entry.date} ({entry.day})
                </p>
                <p className="text-sm">
                  By: {entry.stocktakeDoneBy}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-bold ${
                    entry.totalVariance !== 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {entry.totalVariance}
                </p>
                <p className="text-xs text-gray-400">
                  Variance
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL VIEW */}
      {selected && (
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">
              {selected.location}
            </h2>

            <button
              onClick={() => setSelected(null)}
              className="text-red-600"
            >
              Close
            </button>
          </div>

          <p className="text-sm mb-2">
            {selected.date} ({selected.day})
          </p>
          <p className="text-sm">
            Done By: {selected.stocktakeDoneBy}
          </p>
          <p className="text-sm">
            Supervised By: {selected.supervisedBy}
          </p>

          <p className="text-sm mt-2">
            Physical Signed: {selected.physicalSignedOff}
          </p>

          <p className="text-sm mb-4">
            Notes: {selected.signOffNotes}
          </p>

          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Action</th>
                <th>Comment</th>
              </tr>
            </thead>

            <tbody>
              {selected.rows.map((row) => {
                const expected =
                  row.opening + row.purchased - row.sold
                const variance = row.closing - expected

                return (
                  <tr key={row.code} className="border-t">
                    <td className="p-2">{row.item}</td>
                    <td className="text-center">{expected}</td>
                    <td className="text-center">{row.closing}</td>
                    <td
                      className={`text-center font-bold ${
                        variance !== 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {variance}
                    </td>
                    <td className="text-center">
                      {row.action}
                    </td>
                    <td>{row.comment}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}