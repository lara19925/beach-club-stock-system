'use client'

import { useEffect, useMemo, useState } from 'react'

type StockItem = {
  code: string
  name: string
  category: string
  unit: string
  supplier: string
  location: string
}

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

const locations = [
  'Warehouse Freezer',
  'Warehouse Dry Stores',
  'Alcohol Store',
  'Bar',
  'Kitchen 1',
  'Kitchen 2',
]

export default function WarehousePage() {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('Warehouse Freezer')
  const [items, setItems] = useState<StockItem[]>([])
  const [rows, setRows] = useState<StockRow[]>([])

  const [stocktakeDoneBy, setStocktakeDoneBy] = useState('')
  const [supervisedBy, setSupervisedBy] = useState('')
  const [physicalSignedOff, setPhysicalSignedOff] = useState('No')
  const [signOffNotes, setSignOffNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')

  useEffect(() => {
    const savedItems = localStorage.getItem('stockItems')

    if (savedItems) {
      setItems(JSON.parse(savedItems))
    }
  }, [])

  const getLastClosingStock = (
    itemCode: string,
    selectedLocation: string
  ) => {
    const savedHistory = localStorage.getItem('stocktakeHistory')
    const history: SavedStocktake[] = savedHistory
      ? JSON.parse(savedHistory)
      : []

    const lastStocktake = history.find(
      (entry) => entry.location === selectedLocation
    )

    const lastRow = lastStocktake?.rows.find(
      (row) => row.code === itemCode
    )

    return lastRow ? lastRow.closing : 0
  }

  const buildRowsForLocation = (selectedLocation: string) => {
    const filtered = items.filter(
      (item) => item.location === selectedLocation
    )

    return filtered.map((item) => ({
      code: item.code,
      item: item.name,
      unit: item.unit,
      opening: getLastClosingStock(item.code, selectedLocation),
      purchased: 0,
      sold: 0,
      closing: 0,
      action: '',
      comment: '',
    }))
  }

  useEffect(() => {
    if (submitted) return

    setRows(buildRowsForLocation(location))
  }, [location, items, submitted])

  const dayName = useMemo(() => {
    return new Date(date).toLocaleDateString('en-FJ', {
      weekday: 'long',
    })
  }, [date])

  const updateValue = (
    index: number,
    field: keyof StockRow,
    value: string
  ) => {
    if (submitted) return

    const updated = [...rows]

    updated[index] = {
      ...updated[index],
      [field]:
        field === 'comment' ||
        field === 'item' ||
        field === 'code' ||
        field === 'unit' ||
        field === 'action'
          ? value
          : Number(value),
    }

    setRows(updated)
  }

  const totalVariance = rows.reduce((total, row) => {
    const expected = row.opening + row.purchased - row.sold
    const variance = row.closing - expected
    return total + variance
  }, 0)

  const varianceRows = rows.filter((row) => {
    const expected = row.opening + row.purchased - row.sold
    return row.closing - expected !== 0
  })

  const saveStocktakeToHistory = (submittedTime: string) => {
    const savedHistory = localStorage.getItem('stocktakeHistory')
    const history: SavedStocktake[] = savedHistory
      ? JSON.parse(savedHistory)
      : []

    const newStocktake: SavedStocktake = {
      id: crypto.randomUUID(),
      date,
      day: dayName,
      location,
      stocktakeDoneBy,
      supervisedBy,
      physicalSignedOff,
      signOffNotes,
      submittedAt: submittedTime,
      totalVariance,
      rows,
    }

    localStorage.setItem(
      'stocktakeHistory',
      JSON.stringify([newStocktake, ...history])
    )
  }

  const submitStocktake = () => {
    if (!stocktakeDoneBy.trim()) {
      alert('Please enter who completed the stocktake.')
      return
    }

    if (!supervisedBy.trim()) {
      alert('Please enter who supervised the stocktake.')
      return
    }

    const invalidVariance = rows.some((row) => {
      const expected = row.opening + row.purchased - row.sold
      const variance = row.closing - expected

      if (variance === 0) return false

      return !row.action || !row.comment.trim()
    })

    if (invalidVariance) {
      alert(
        'All variance items must have an action and comment before submitting.'
      )
      return
    }

    const submittedTime = new Date().toLocaleString('en-FJ')

    saveStocktakeToHistory(submittedTime)
    setSubmitted(true)
    setSubmittedAt(submittedTime)

    alert('Stocktake submitted, saved, and locked.')
  }

  const resetStocktake = () => {
    const confirmed = confirm(
      'Start a new stocktake? This will clear current entries and carry forward the last saved closing stock.'
    )

    if (!confirmed) return

    setSubmitted(false)
    setSubmittedAt('')
    setStocktakeDoneBy('')
    setSupervisedBy('')
    setPhysicalSignedOff('No')
    setSignOffNotes('')
    setRows(buildRowsForLocation(location))
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Stock Control, Phase 1
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Date</label>
          <input
            type="date"
            value={date}
            disabled={submitted}
            onChange={(event) => setDate(event.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Day</label>
          <input
            value={dayName}
            disabled
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Location</label>
          <select
            value={location}
            disabled={submitted}
            onChange={(event) => setLocation(event.target.value)}
            className="border p-2 rounded w-full"
          >
            {locations.map((locationName) => (
              <option key={locationName}>{locationName}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm text-gray-500">Total Variance</p>
          <p
            className={`text-2xl font-bold ${
              totalVariance !== 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {totalVariance}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Stocktake Done By
          </label>
          <input
            value={stocktakeDoneBy}
            disabled={submitted}
            onChange={(event) => setStocktakeDoneBy(event.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Staff name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Supervised By
          </label>
          <input
            value={supervisedBy}
            disabled={submitted}
            onChange={(event) => setSupervisedBy(event.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Supervisor name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Physical Count Signed Off?
          </label>
          <select
            value={physicalSignedOff}
            disabled={submitted}
            onChange={(event) => setPhysicalSignedOff(event.target.value)}
            className="border p-2 rounded w-full"
          >
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Time of Entry
          </label>
          <input
            value={submitted ? submittedAt : 'Captured on submit'}
            disabled
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-sm font-semibold mb-1">
            Sign Off Notes
          </label>
          <textarea
            value={signOffNotes}
            disabled={submitted}
            onChange={(event) => setSignOffNotes(event.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Physical count notes, issues found, supervisor comments"
          />
        </div>
      </div>

      {submitted && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded font-semibold">
          Submitted, saved, and locked at {submittedAt}
        </div>
      )}

      {varianceRows.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-800 p-3 rounded">
          {varianceRows.length} item(s) have variance. Select an action and add a comment before submission.
        </div>
      )}

      {rows.length === 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
          No items found for this location. Go to Items page and import your stock list first.
        </div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Item</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Opening</th>
              <th className="p-2">Purchased</th>
              <th className="p-2">Sold/Used</th>
              <th className="p-2">Expected</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Variance</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
              <th className="p-2">Comment</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const expected = row.opening + row.purchased - row.sold
              const variance = row.closing - expected

              return (
                <tr key={row.code} className="border-t">
                  <td className="p-2">{row.code}</td>
                  <td className="p-2 font-semibold">{row.item}</td>
                  <td className="p-2 text-center">{row.unit}</td>

                  <td>
                    <input
                      type="number"
                      value={row.opening}
                      disabled={submitted}
                      onChange={(event) =>
                        updateValue(index, 'opening', event.target.value)
                      }
                      className="w-full p-1 border bg-gray-50"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.purchased}
                      disabled={submitted}
                      onChange={(event) =>
                        updateValue(index, 'purchased', event.target.value)
                      }
                      className="w-full p-1 border"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.sold}
                      disabled={submitted}
                      onChange={(event) =>
                        updateValue(index, 'sold', event.target.value)
                      }
                      className="w-full p-1 border"
                    />
                  </td>

                  <td className="text-center font-semibold">
                    {expected}
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.closing}
                      disabled={submitted}
                      onChange={(event) =>
                        updateValue(index, 'closing', event.target.value)
                      }
                      className="w-full p-1 border"
                    />
                  </td>

                  <td
                    className={`text-center font-bold ${
                      variance !== 0
                        ? 'text-red-600 bg-red-100'
                        : 'text-green-600'
                    }`}
                  >
                    {variance}
                  </td>

                  <td className="text-center">
                    {variance === 0 ? (
                      <span className="text-green-600 font-semibold">OK</span>
                    ) : variance < 0 ? (
                      <span className="text-red-600 font-semibold">Short</span>
                    ) : (
                      <span className="text-orange-600 font-semibold">Over</span>
                    )}
                  </td>

                  <td>
                    <select
                      value={row.action}
                      disabled={submitted || variance === 0}
                      onChange={(event) =>
                        updateValue(index, 'action', event.target.value)
                      }
                      className={`w-full p-1 border ${
                        variance !== 0 && !row.action ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="Recount">Recount</option>
                      <option value="Explain">Explain</option>
                      <option value="Accepted Loss">Accepted Loss</option>
                    </select>
                  </td>

                  <td>
                    <input
                      value={row.comment}
                      disabled={submitted}
                      onChange={(event) =>
                        updateValue(index, 'comment', event.target.value)
                      }
                      placeholder={
                        variance !== 0
                          ? row.action === 'Recount'
                            ? 'Recount and confirm result'
                            : 'Explain variance'
                          : 'Optional'
                      }
                      className={`w-full p-1 border ${
                        variance !== 0 && !row.comment ? 'border-red-500' : ''
                      }`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-4">
        {!submitted && (
          <button
            onClick={submitStocktake}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Submit & Lock Stocktake
          </button>
        )}

        <button
          onClick={resetStocktake}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Start New Stocktake
        </button>
      </div>
    </div>
  )
}