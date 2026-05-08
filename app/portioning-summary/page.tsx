"use client";

export default function PortioningSummaryPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Portioning Summary</h1>
      <p>Summary page is active.</p>

      <a
        href="/portioning"
        style={{
          backgroundColor: 'orange',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '4px',
          textDecoration: 'none',
          display: 'inline-block',
          marginTop: '10px',
        }}
      >
        Back to Portioning
      </a>
    </div>
  )
}