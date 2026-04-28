'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'

type StockItem = {
  code: string
  name: string
  category: string
  unit: string
  supplier: string
  location: string
}

const allowedLocations = [
  'Warehouse Freezer',
  'Warehouse Dry Stores',
  'Alcohol Store',
  'Bar',
  'Kitchen 1',
  'Kitchen 2',
]

export default function ItemsPage() {
  const [items, setItems] = useState<StockItem[]>([])

  useEffect(() => {
    const savedItems = localStorage.getItem('stockItems')

    if (savedItems) {
      setItems(JSON.parse(savedItems))
    }
  }, [])

  const saveItems = (updatedItems: StockItem[]) => {
    setItems(updatedItems)
    localStorage.setItem('stockItems', JSON.stringify(updatedItems))
  }

  const importCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: any[] = results.data

        const requiredHeaders = [
          'Item',
          'Category',
          'Unit',
          'Supplier',
          'Location',
        ]

        const headers = Object.keys(data[0] || {})

        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        )

        if (missingHeaders.length > 0) {
          alert(`Missing required columns: ${missingHeaders.join(', ')}`)
          return
        }

        const importedItems = data.map((row, index) => {
          const itemCode =
            row['Item Code']?.trim() ||
            `ITEM-${String(index + 1).padStart(4, '0')}`

          return {
            code: itemCode,
            name: row.Item?.trim(),
            category: row.Category?.trim(),
            unit: row.Unit?.trim(),
            supplier: row.Supplier?.trim() || '',
            location: row.Location?.trim(),
          }
        })

        const validItems = importedItems.filter(
          (item) =>
            item.code &&
            item.name &&
            item.category &&
            item.unit &&
            allowedLocations.includes(item.location)
        )

        const existingCodes = new Set(
          items.map((item) => item.code.toLowerCase())
        )

        const newItems = validItems.filter(
          (item) => !existingCodes.has(item.code.toLowerCase())
        )

        saveItems([...items, ...newItems])

        alert(
          `${newItems.length} items imported successfully.\n${
            importedItems.length - validItems.length
          } rows skipped because of missing data or invalid location.\n${
            validItems.length - newItems.length
          } duplicates skipped.`
        )

        event.target.value = ''
      },
    })
  }

  const clearItems = () => {
    const confirmed = confirm('Clear all saved items?')
    if (!confirmed) return

    saveItems([])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Items</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Import Item Master CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={importCsv}
          className="border p-2 rounded"
        />

        <p className="text-sm text-gray-500 mt-2">
          Required columns: Item, Category, Unit, Supplier, Location. Item Code is optional.
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Allowed locations: Warehouse Freezer, Warehouse Dry Stores, Alcohol Store, Bar, Kitchen 1, Kitchen 2
        </p>

        <button
          onClick={clearItems}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Clear Items
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Supplier</th>
              <th className="p-2 text-left">Location</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.code} className="border-t">
                <td className="p-2">{item.code}</td>
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.category}</td>
                <td className="p-2">{item.unit}</td>
                <td className="p-2">{item.supplier}</td>
                <td className="p-2">{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}