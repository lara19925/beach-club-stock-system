import Link from 'next/link'
import Image from 'next/image'
import './globals.css'

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
<div
  style={{
    padding: '32px 20px 28px 20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '24px',
  }}
>
  <Image
    src="/logo.png"
    alt="The Beach Club Wailoaloa Logo"
    width={280}
    height={280}
    style={{
      width: '210px',
      height: 'auto',
      margin: '0 auto 18px auto',
      objectFit: 'contain',
    }}
    priority
  />

  <div
    style={{
      color: '#ffffff',
      fontSize: '30px',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.5px',
      fontFamily: 'Inter, Arial, sans-serif',
    }}
  >
    Stock
    <br />
    System
  </div>
</div>

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