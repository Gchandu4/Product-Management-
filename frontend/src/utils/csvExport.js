const esc = v => {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (filename, csv) => {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

const toCSV = (headers, rows) =>
  [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');

const today = () => new Date().toISOString().slice(0, 10);

export const exportProducts = products => {
  const headers = ['S.No','Product Name','Sub Type','Product ID','Category','Unit Cost (INR)','Quantity','Stock Value (INR)','Status'];
  const rows = products.map((p, i) => [
    i + 1, p.product_name, p.sub_type || '', p.product_id, p.category || '',
    p.product_cost, p.quantity,
    (p.product_cost * p.quantity).toFixed(2),
    p.quantity === 0 ? 'Out of stock' : p.quantity <= 5 ? 'Low stock' : 'In stock',
  ]);
  download(`CareVale_Products_${today()}.csv`, toCSV(headers, rows));
};

export const exportStockHistory = adjustments => {
  const headers = ['Date','Time','Product Name','Product ID','Type','Before','Change','After','Note','By'];
  const rows = adjustments.map(a => {
    const dt = new Date(a.created_at);
    return [
      dt.toLocaleDateString('en-IN'), dt.toLocaleTimeString('en-IN'),
      a.product_name, a.pid, a.type,
      a.quantity_before, a.quantity_after - a.quantity_before,
      a.quantity_after, a.note || '', a.adjusted_by_name || '',
    ];
  });
  download(`CareVale_StockHistory_${today()}.csv`, toCSV(headers, rows));
};

