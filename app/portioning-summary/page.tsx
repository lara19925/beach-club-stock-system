'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PortionSummary = {
  portionSize: number;
  stockItemName: string;
  totalQty: number;
  totalWeightKg: number;
};

type SavedSheet = {
  id?: string;
  date: string;
  stockItem?: string;
  item?: string;
  preparedBy?: string;
  checkedBy?: string;
  netUsableWeight?: number;
  totalAccountedWeight?: number;
  trueShortageKg?: number;
  totalShrinkageKg?: number;
  portionSummaryByGramSize?: PortionSummary[];
};

type PurchaseRow = {
  stockItemName: string;
  totalQty: number;
  totalWeightKg: number;
  averageDailyUsageKg: number;
  forecastUsageKg: number;
  requiredStockKg: number;
  currentStockKg: number;
  suggestedPurchaseKg: number;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
    color: '#222',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    margin: 0,
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  row: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '180px',
    flex: 1,
  },
  label: {
    fontSize: '13px',
    fontWeight: 700,
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px',
  },
  button: {
    background: '#f28c28',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  smallTitle: {
    fontSize: '20px',
    fontWeight: 800,
    marginBottom: '12px',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  metric: {
    background: '#fff7ef',
    border: '1px solid #ffd9b0',
    borderRadius: '10px',
    padding: '14px',
  },
  metricLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#555',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#d46b08',
    marginTop: '6px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    textAlign: 'left',
    background: '#222',
    color: '#fff',
    padding: '10px',
    fontSize: '13px',
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: '10px',
    fontSize: '13px',
  },
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function readSavedPortionSheets(): SavedSheet[] {
  const sheets: SavedSheet[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed) ? parsed : [parsed];

      records.forEach((record: any) => {
        if (
          record &&
          (record.portionSummaryByGramSize ||
            record.stockItem ||
            record.netUsableWeight ||
            record.trueShortageKg)
        ) {
          sheets.push({
            id: record.id || `${key}-${Math.random()}`,
            date: record.date || todayDate(),
            stockItem: record.stockItem || record.stockItemType || record.item || 'Unknown',
            item: record.item || '',
            preparedBy: record.preparedBy || '',
            checkedBy: record.checkedBy || '',
            netUsableWeight: toNumber(record.netUsableWeight),
            totalAccountedWeight: toNumber(record.totalAccountedWeight),
            trueShortageKg: toNumber(record.trueShortageKg ?? record.varianceKg),
            totalShrinkageKg: toNumber(record.totalShrinkageKg),
            portionSummaryByGramSize: Array.isArray(record.portionSummaryByGramSize)
              ? record.portionSummaryByGramSize.map((p: any) => ({
                  portionSize: toNumber(p.portionSize),
                  stockItemName:
                    p.stockItemName ||
                    `${record.stockItem || record.stockItemType || 'Stock Item'} ${p.portionSize}g Portion`,
                  totalQty: toNumber(p.totalQty),
                  totalWeightKg: toNumber(p.totalWeightKg),
                }))
              : [],
          });
        }
      });
    } catch {
      continue;
    }
  }

  return sheets;
}

export default function PortioningSummaryPage() {
  const [sheets, setSheets] = useState<SavedSheet[]>([]);
  const [rangeType, setRangeType] = useState('This Month');
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(todayDate());
  const [stockFilter, setStockFilter] = useState('All');
  const [forecastDays, setForecastDays] = useState(7);
  const [bufferPercent, setBufferPercent] = useState(15);
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({});

  useEffect(() => {
    setSheets(readSavedPortionSheets());
  }, []);

  useEffect(() => {
    const today = todayDate();
    const now = new Date();

    if (rangeType === 'Today') {
      setStartDate(today);
      setEndDate(today);
    }

    if (rangeType === 'This Month') {
      setStartDate(getMonthStart());
      setEndDate(today);
    }

    if (rangeType === 'This Week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      setStartDate(monday.toISOString().slice(0, 10));
      setEndDate(today);
    }
  }, [rangeType]);

  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const inDate = sheet.date >= startDate && sheet.date <= endDate;
      const inStock = stockFilter === 'All' || sheet.stockItem === stockFilter;
      return inDate && inStock;
    });
  }, [sheets, startDate, endDate, stockFilter]);

  const stockOptions = useMemo(() => {
    const options = Array.from(new Set(sheets.map((s) => s.stockItem || 'Unknown')));
    return ['All', ...options];
  }, [sheets]);

  const summaryRows = useMemo(() => {
    const grouped: Record<string, PortionSummary> = {};

    filteredSheets.forEach((sheet) => {
      sheet.portionSummaryByGramSize?.forEach((portion) => {
        const key = portion.stockItemName;
        if (!grouped[key]) {
          grouped[key] = {
            portionSize: portion.portionSize,
            stockItemName: portion.stockItemName,
            totalQty: 0,
            totalWeightKg: 0,
          };
        }

        grouped[key].totalQty += toNumber(portion.totalQty);
        grouped[key].totalWeightKg += toNumber(portion.totalWeightKg);
      });
    });

    return Object.values(grouped);
  }, [filteredSheets]);

  const purchaseRows: PurchaseRow[] = useMemo(() => {
    const days = daysBetween(startDate, endDate);

    return summaryRows.map((row) => {
      const averageDailyUsageKg = row.totalWeightKg / days;
      const forecastUsageKg = averageDailyUsageKg * forecastDays;
      const requiredStockKg = forecastUsageKg * (1 + bufferPercent / 100);
      const currentStockKg = currentStock[row.stockItemName] || 0;
      const suggestedPurchaseKg = Math.max(requiredStockKg - currentStockKg, 0);

      return {
        stockItemName: row.stockItemName,
        totalQty: row.totalQty,
        totalWeightKg: row.totalWeightKg,
        averageDailyUsageKg,
        forecastUsageKg,
        requiredStockKg,
        currentStockKg,
        suggestedPurchaseKg,
      };
    });
  }, [summaryRows, startDate, endDate, forecastDays, bufferPercent, currentStock]);

  const totals = useMemo(() => {
    return {
      totalSheets: filteredSheets.length,
      netUsable: filteredSheets.reduce((sum, s) => sum + toNumber(s.netUsableWeight), 0),
      accounted: filteredSheets.reduce((sum, s) => sum + toNumber(s.totalAccountedWeight), 0),
      shortage: filteredSheets.reduce((sum, s) => sum + toNumber(s.trueShortageKg), 0),
      shrinkage: filteredSheets.reduce((sum, s) => sum + toNumber(s.totalShrinkageKg), 0),
      portions: summaryRows.reduce((sum, r) => sum + toNumber(r.totalQty), 0),
      suggestedPurchase: purchaseRows.reduce((sum, r) => sum + toNumber(r.suggestedPurchaseKg), 0),
    };
  }, [filteredSheets, summaryRows, purchaseRows]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Portioning Summary</h1>
        <Link href="/portioning" style={styles.button}>
          Back to Portioning
        </Link>
      </div>

      <div style={styles.card}>
        <div style={styles.smallTitle}>Filters</div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Date Range</label>
            <select style={styles.input} value={rangeType} onChange={(e) => setRangeType(e.target.value)}>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Date Range</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Start Date</label>
            <input style={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>End Date</label>
            <input style={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Stock Item</label>
            <select style={styles.input} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              {stockOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.smallTitle}>Summary</div>
        <div style={styles.cards}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Total Sheets</div>
            <div style={styles.metricValue}>{totals.totalSheets}</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Total Portions</div>
            <div style={styles.metricValue}>{totals.portions.toFixed(0)}</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Net Usable Weight</div>
            <div style={styles.metricValue}>{totals.netUsable.toFixed(2)}kg</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Total Accounted Weight</div>
            <div style={styles.metricValue}>{totals.accounted.toFixed(2)}kg</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Shrinkage</div>
            <div style={styles.metricValue}>{totals.shrinkage.toFixed(2)}kg</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>True Shortage</div>
            <div style={styles.metricValue}>{totals.shortage.toFixed(2)}kg</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.smallTitle}>Portions Made By SwiftPOS Stock Item</div>
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
            {summaryRows.map((row) => (
              <tr key={row.stockItemName}>
                <td style={styles.td}>{row.stockItemName}</td>
                <td style={styles.td}>{row.portionSize}g</td>
                <td style={styles.td}>{row.totalQty.toFixed(0)}</td>
                <td style={styles.td}>{row.totalWeightKg.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.smallTitle}>Forecast Purchasing & Par Levels</div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Forecast Days Required</label>
            <input
              style={styles.input}
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(toNumber(e.target.value))}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Safety Buffer %</label>
            <input
              style={styles.input}
              type="number"
              value={bufferPercent}
              onChange={(e) => setBufferPercent(toNumber(e.target.value))}
            />
          </div>

          <div style={styles.metric}>
            <div style={styles.metricLabel}>Total Suggested Purchase</div>
            <div style={styles.metricValue}>{totals.suggestedPurchase.toFixed(2)}kg</div>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Total Used kg</th>
              <th style={styles.th}>Avg Daily kg</th>
              <th style={styles.th}>Forecast kg</th>
              <th style={styles.th}>Required Stock kg</th>
              <th style={styles.th}>Current Stock kg</th>
              <th style={styles.th}>Suggested Purchase kg</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRows.map((row) => (
              <tr key={row.stockItemName}>
                <td style={styles.td}>{row.stockItemName}</td>
                <td style={styles.td}>{row.totalWeightKg.toFixed(2)}</td>
                <td style={styles.td}>{row.averageDailyUsageKg.toFixed(2)}</td>
                <td style={styles.td}>{row.forecastUsageKg.toFixed(2)}</td>
                <td style={styles.td}>{row.requiredStockKg.toFixed(2)}</td>
                <td style={styles.td}>
                  <input
                    style={{ ...styles.input, width: '100px' }}
                    type="number"
                    value={currentStock[row.stockItemName] || ''}
                    onChange={(e) =>
                      setCurrentStock({
                        ...currentStock,
                        [row.stockItemName]: toNumber(e.target.value),
                      })
                    }
                  />
                </td>
                <td style={{ ...styles.td, fontWeight: 800, color: '#d46b08' }}>
                  {row.suggestedPurchaseKg.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.smallTitle}>Detailed Portion Sheets</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Stock Item</th>
              <th style={styles.th}>Prepared By</th>
              <th style={styles.th}>Checked By</th>
              <th style={styles.th}>Net Usable kg</th>
              <th style={styles.th}>Accounted kg</th>
              <th style={styles.th}>Shrinkage kg</th>
              <th style={styles.th}>True Shortage kg</th>
              <th style={styles.th}>True Shortage %</th>
            </tr>
          </thead>
          <tbody>
            {filteredSheets.map((sheet, index) => (
              <tr key={`${sheet.id}-${index}`}>
                <td style={styles.td}>{sheet.date}</td>
                <td style={styles.td}>{sheet.stockItem}</td>
                <td style={styles.td}>{sheet.preparedBy}</td>
                <td style={styles.td}>{sheet.checkedBy}</td>
                <td style={styles.td}>{toNumber(sheet.netUsableWeight).toFixed(2)}</td>
                <td style={styles.td}>{toNumber(sheet.totalAccountedWeight).toFixed(2)}</td>
                <td style={styles.td}>{toNumber(sheet.totalShrinkageKg).toFixed(2)}</td>
                <td style={styles.td}>{toNumber(sheet.trueShortageKg).toFixed(2)}</td>
                <td style={styles.td}>
                  {toNumber(sheet.netUsableWeight) > 0
                    ? ((toNumber(sheet.trueShortageKg) / toNumber(sheet.netUsableWeight)) * 100).toFixed(2)
                    : '0.00'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}