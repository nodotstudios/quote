// App.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './index.css';
import './App.css';

const templates = {
  'Tech Pack': { desc: 'Detailed production tech pack', price: 2000 },
  'Premium Design CAT A': { desc: 'Premium fashion design A', price: 4500 },
  'Premium Design CAT B': { desc: 'Premium fashion design B', price: 4000 },
  'Standard Design CAT A': { desc: 'Standard fashion design A', price: 3500 },
  'Standard Design CAT B': { desc: 'Standard fashion design B', price: 3000 },
  'Custom Item': { desc: 'Add Details here', price: 0 },
};

function convertToWords(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function App() {
  const [clientName, setClientName] = useState('');
  const [sharedBy, setSharedBy] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectName, setProjectName] = useState('');
  const [subject, setSubject] = useState('');
  const [termsUrl, setTermsUrl] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState({ type: '%', value: 0 });
  const [taxes, setTaxes] = useState([]);
  const [currency, setCurrency] = useState('₹');

  const addItem = () => {
    setItems([...items, { type: '', desc: '', qty: 1, price: 0, total: 0 }]);
  };

  const updateItem = (idx, field, val) => {
    const temp = [...items];
    if (field === 'type') {
      const t = templates[val] || { desc: '', price: 0 };
      temp[idx] = { type: val, desc: t.desc, qty: 1, price: t.price, total: t.price };
    } else {
      temp[idx][field] = field === 'qty' || field === 'price' ? parseFloat(val) : val;
      temp[idx].total = temp[idx].qty * temp[idx].price;
    }
    setItems(temp);
  };

  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const discountAmt = discount.type === '%' ? (discount.value / 100) * subtotal : discount.value;
  const taxable = subtotal - discountAmt;

  const taxAmounts = taxes.map(t => {
    const amt = t.type === '%' ? (t.value / 100) * taxable : t.value;
    return { ...t, amount: amt };
  });
  const total = taxable + taxAmounts.reduce((a, t) => a + t.amount, 0);

  const exportPDF = async () => {
    const el1 = document.getElementById('pdf');
    const canvas1 = await html2canvas(el1, { scale: 1.5 }); // lower resolution
    const img1 = canvas1.toDataURL('image/jpeg', 0.6); // compressed JPEG

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFont('helvetica');
    pdf.addImage(img1, 'JPEG', 0, 0, 210, 297);

    // Page 2: Terms
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('Terms & Conditions', 14, 20);
    pdf.setFontSize(12);
    if (termsUrl) {
      pdf.setTextColor('#0000FF');
      pdf.textWithLink('Click here to view full Terms & Conditions', 14, 30, { url: termsUrl });
      pdf.setTextColor('#000000');
    } else {
      pdf.text('No Terms & Conditions URL provided.', 14, 30);
    }

    pdf.save(`Estimate-${clientName || 'unnamed'}.pdf`);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Project Estimate</h1>
      <div className="space-y-3">
        <input value={sharedBy} onChange={e => setSharedBy(e.target.value)} placeholder="Shared By" className="w-full border p-2 rounded" />
        <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Customer Name" className="w-full border p-2 rounded" />
        <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full border p-2 rounded" />
        <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Name" className="w-full border p-2 rounded" />
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full border p-2 rounded" />
        <input type="url" value={termsUrl} onChange={e => setTermsUrl(e.target.value)} placeholder="Terms & Conditions URL" className="w-full border p-2 rounded" />

        <div className="flex items-center space-x-2">
          <label>Currency:</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="border p-2 rounded">
            <option value="₹">INR (₹)</option>
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
          </select>
        </div>

        <div className="border p-2 rounded">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-5 gap-1 items-center mb-2">
              <select value={it.type} onChange={e => updateItem(i, 'type', e.target.value)} className="border p-1 col-span-2">
                <option value="">Select</option>
                {Object.keys(templates).map(k => <option key={k}>{k}</option>)}
              </select>
              <input value={it.desc} onChange={e => updateItem(i, 'desc', e.target.value)} placeholder="Desc" className="border p-1" />
              <input type="number" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="border p-1 w-12" />
              <input type="number" value={it.price} onChange={e => updateItem(i, 'price', e.target.value)} className="border p-1 w-16" />
              <div className="text-right">{currency}{it.total.toFixed(2)}</div>
            </div>
          ))}
          <button onClick={addItem} className="text-blue-600">+ Add Item</button>
        </div>

        <div className="flex items-center space-x-2">
          <label>Discount:</label>
          <select value={discount.type} onChange={e => setDiscount({ ...discount, type: e.target.value })} className="border p-1 rounded">
            <option value="%">%</option>
            <option value="flat">₹</option>
          </select>
          <input type="number" value={discount.value} onChange={e => setDiscount({ ...discount, value: parseFloat(e.target.value) })} className="border p-1 w-20 rounded" />
        </div>

        {taxes.map((t, i) => (
          <div key={i} className="flex items-center space-x-2">
            <input value={t.label} onChange={e => {
              const nt = [...taxes]; nt[i].label = e.target.value; setTaxes(nt);
            }} placeholder="Tax name" className="border p-1 rounded w-24" />
            <select value={t.type} onChange={e => {
              const nt = [...taxes]; nt[i].type = e.target.value; setTaxes(nt);
            }} className="border p-1 rounded">
              <option value="%">%</option>
              <option value="flat">₹</option>
            </select>
            <input type="number" value={t.value} onChange={e => {
              const nt = [...taxes]; nt[i].value = parseFloat(e.target.value); setTaxes(nt);
            }} className="border p-1 w-20 rounded" />
          </div>
        ))}
        <button onClick={() => setTaxes([...taxes, { label: 'New', type: '%', value: 0 }])} className="text-blue-600">+ Add Tax</button>

        <div className="pt-2 border-t space-y-1">
          <p>Subtotal: {currency}{subtotal.toFixed(2)}</p>
          <p>Discount: -{currency}{discountAmt.toFixed(2)}</p>
          {taxAmounts.map((t, i) => <p key={i}>{t.label}: +{currency}{t.amount.toFixed(2)}</p>)}
          <p className="font-bold">Total: {currency}{total.toFixed(2)}</p>
          <p>In Words: {convertToWords(total)}</p>
        </div>

        <button onClick={exportPDF} className="bg-green-600 text-white w-full p-2 rounded">Share PDF</button>
      </div>

      <div id="pdf" className="hidden p-4" style={{ width: '210mm', minHeight: '297mm', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
        <h2>Project Estimate</h2>
        <p>Shared By: {sharedBy}</p>
        <p>Date: {quoteDate}</p>
        <p>Bill To: {clientName}</p>
        <p>Project: {projectName}</p>
        <p>Subject: {subject}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
          <thead>
            <tr><th>#</th><th>Item</th><th>Desc</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.type}</td>
                <td>{it.desc}</td>
                <td>{it.qty}</td>
                <td>{currency}{it.price.toFixed(2)}</td>
                <td>{currency}{it.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Subtotal: {currency}{subtotal.toFixed(2)}</p>
        <p>Discount: -{currency}{discountAmt.toFixed(2)}</p>
        {taxAmounts.map((t, i) => <p key={i}>{t.label}: +{currency}{t.amount.toFixed(2)}</p>)}
        <h3>Total: {currency}{total.toFixed(2)}</h3>
        <p>In Words: {convertToWords(total)}</p>
        <p>Notes:<br />Looking forward for your business.</p>
      </div>
    </div>
  );
}
