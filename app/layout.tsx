import './globals.css'
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex">

        {/* Sidebar */}
        <div className="w-64 h-screen bg-gray-900 text-white p-4">
          <h2 className="text-lg font-semibold mb-6 leading-tight">
  The Beach Club Wailoaloa
  <br />
  <span className="block mt-2">Stock System</span>
</h2>

          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/items">Items</Link>
            <Link href="/suppliers">Suppliers</Link>
            <Link href="/warehouse">Warehouse</Link>
            <Link href="/history">History</Link>
            <Link href="/stocktake-bar">Bar Stocktake</Link>
            <Link href="/bar-bottle-master">Bottle Master</Link>
            <Link href="/stocktake-kitchen">Kitchen Stocktake</Link>
            <Link href="/portioning">Portioning</Link>
            <Link href="/variance">Variance</Link>
            <Link href="/par-levels">Par Levels</Link>
            <Link href="/purchasing">Purchasing</Link>
            <Link href="/xero">Xero Support</Link>
            <Link href="/reports">Reports</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-100 min-h-screen">
          {children}
        </div>

      </body>
    </html>
  )
}