'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type PortionSheet = {
  id: string;
  sheet_date: string;
  staff_name: string | null;
  location: string | null;
  notes: string | null;
  total_variance: number | null;
};

type PortionLine = {
  id: string;
  item_code: string | null;
  item_name: string | null;
  opening_qty: number | null;
  produced_qty: number | null;
  used_qty: number | null;
  closing_qty: number | null;
  expected_qty: number | null;
  actual_qty: number | null;
  variance_qty: number | null;
  variance_value: number | null;
  issue_note: string | null;
};

export default function PortionSheetDetailPage({ params }: { params: { id: string } }) {
  const [sheet, setSheet] = useState<PortionSheet | null>(null);
  const [lines, setLines] = useState<PortionLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSheet();
  }, []);

  async function loadSheet() {
    const { data: sheetData, error: sheetError } = await supabase
      .from('portion_sheets')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: lineData, error: lineError } = await supabase
      .from('portion_sheet_lines')
      .select('*')
      .eq('sheet_id', params.id);

    if (sheetError || lineError) {
      console.error(sheetError || lineError);
      alert('Could not load full portion sheet');
    } else {
      setSheet(sheetData);
      setLines(lineData || []);
    }

    setLoading(false);
  }

  if (loading) return <main style={{ padding: '30px' }}>Loading sheet...</main>;
  if (!sheet) return <main style={{ padding: '30px' }}>Sheet not found.</main>;

  return (
    <main style={{ padding: '30px' }}>
      <h1>Full Portion Sheet</h1>

      <p><strong>Date:</strong> {sheet.sheet_date}</p>
      <p><strong>Staff:</strong> {sheet.staff_name || '-'}</p>
      <p><strong>Location:</strong> {sheet.location || '-'}</p>
      <p><strong>Total Variance:</strong> {sheet.total_variance || 0}</p>
      <p><strong>Notes:</strong> {sheet.notes || '-'}</p>

      <h2 style={{ marginTop: '30px' }}>Items</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f3f3' }}>
            <th style={cell}>Code</th>
            <th style={cell}>Item</th>
            <th style={cell}>Opening</th>
            <th style={cell}>Produced</th>
            <th style={cell}>Used</th>
            <th style={cell}>Closing</th>
            <th style={cell}>Expected</th>
            <th style={cell}>Actual</th>
            <th style={cell}>Variance Qty</th>
            <th style={cell}>Variance Value</th>
            <th style={cell}>Issue</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td style={cell}>{line.item_code || '-'}</td>
              <td style={cell}>{line.item_name || '-'}</td>
              <td style={cell}>{line.opening_qty || 0}</td>
              <td style={cell}>{line.produced_qty || 0}</td>
              <td style={cell}>{line.used_qty || 0}</td>
              <td style={cell}>{line.closing_qty || 0}</td>
              <td style={cell}>{line.expected_qty || 0}</td>
              <td style={cell}>{line.actual_qty || 0}</td>
              <td style={cell}>{line.variance_qty || 0}</td>
              <td style={cell}>{line.variance_value || 0}</td>
              <td style={cell}>{line.issue_note || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const cell = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'left' as const,
};