'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, Search, CreditCard, Printer } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientCode: string;
}

interface UnbilledItem {
  refId: string;
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onGenerate: (payload: any) => Promise<void>;
  apiUrl: string;
  token: string;
}

export function GenerateBillModal({ isOpen, onClose, patients, onGenerate, apiUrl, token }: GenerateBillModalProps) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [unbilledItems, setUnbilledItems] = useState<UnbilledItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      setLoading(true);
      fetch(`${apiUrl}/billing/unbilled/${selectedPatient}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setUnbilledItems(data);
        setSelectedItems(new Set(data.map((i: any) => i.refId)));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setUnbilledItems([]);
      setSelectedItems(new Set());
    }
  }, [selectedPatient, apiUrl, token]);

  const toggleItem = (refId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(refId)) newSelected.delete(refId);
    else newSelected.add(refId);
    setSelectedItems(newSelected);
  };

  const subtotal = unbilledItems
    .filter(item => selectedItems.has(item.refId))
    .reduce((sum, item) => sum + item.total, 0);

  const discountAmount = discountType === 'FIXED' 
    ? discountValue 
    : (subtotal * discountValue) / 100;

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (afterDiscount * taxRate) / 100;
  const finalTotal = afterDiscount + taxAmount;

  const handleGenerate = async () => {
    if (!selectedPatient || selectedItems.size === 0) return;
    const items = unbilledItems.filter(i => selectedItems.has(i.refId));
    await onGenerate({
      patientId: selectedPatient,
      items,
      discountType,
      discountValue: discountValue || undefined,
      taxRate: taxRate || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Receipt size={20} className="text-primary" /> Generate Consolidated Bill
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Patient</label>
              <select 
                value={selectedPatient} 
                onChange={e => setSelectedPatient(e.target.value)}
                className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Choose a patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                    <span>Unbilled Charges</span>
                    {loading && <span className="text-xs font-normal text-slate-400">Loading...</span>}
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {unbilledItems.length === 0 && !loading ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No unbilled charges found for this patient.</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                          <tr>
                            <th className="px-4 py-3 w-10">
                              <input 
                                type="checkbox" 
                                checked={selectedItems.size === unbilledItems.length && unbilledItems.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedItems(new Set(unbilledItems.map(i => i.refId)));
                                  else setSelectedItems(new Set());
                                }}
                                className="rounded text-primary focus:ring-primary"
                              />
                            </th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unbilledItems.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleItem(item.refId)}>
                              <td className="px-4 py-3">
                                <input 
                                  type="checkbox" 
                                  checked={selectedItems.has(item.refId)} 
                                  onChange={() => toggleItem(item.refId)}
                                  className="rounded text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3 text-slate-700 font-medium">{item.description}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                <span className="bg-slate-100 px-2 py-1 rounded-md">{item.category}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Discount</label>
                      <div className="flex gap-2">
                        <select 
                          value={discountType} 
                          onChange={(e: any) => setDiscountType(e.target.value)}
                          className="w-1/3 rounded-lg border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="FIXED">Fixed (₹)</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                        </select>
                        <input 
                          type="number" 
                          min="0"
                          value={discountValue} 
                          onChange={e => setDiscountValue(Number(e.target.value))}
                          className="w-2/3 rounded-lg border-slate-200 px-3 py-2 text-sm" 
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Rate (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={taxRate} 
                        onChange={e => setTaxRate(Number(e.target.value))}
                        className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm" 
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm flex flex-col justify-center">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-semibold">-₹{discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Tax ({taxRate}%):</span>
                        <span className="font-semibold">+₹{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900 mt-2">
                      <span>Total:</span>
                      <span>₹{finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={!selectedPatient || selectedItems.size === 0 || loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={18} />
            Generate Bill
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentModal({ isOpen, onClose, invoice, onPay }: { isOpen: boolean, onClose: () => void, invoice: any, onPay: (amount: number, method: string) => Promise<void> }) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState('CASH'); // Fixed to cash as requested, but UI could show others
  
  useEffect(() => {
    if (invoice) {
      const paid = invoice.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
      setAmount(Number(invoice.total) - paid);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;
  const paid = invoice.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const balance = Number(invoice.total) - paid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Record Payment
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Invoice No</p>
              <p className="font-bold text-slate-800">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Balance Due</p>
              <p className="font-bold text-rose-600 text-lg">₹{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
            <select 
              value={method} 
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-primary"
            >
              <option value="CASH">Cash</option>
              <option value="CARD" disabled>Credit/Debit Card (Coming Soon)</option>
              <option value="UPI" disabled>UPI (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Paying (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              max={balance}
              min={1}
              className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-lg font-bold text-slate-800 focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onPay(amount, method)}
            disabled={amount <= 0 || amount > balance}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ isOpen, onClose, invoice }: { isOpen: boolean, onClose: () => void, invoice: any }) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in print:bg-white print:p-0 print:items-start">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-full flex flex-col max-h-[90vh] print:max-h-full">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
          <h2 className="text-lg font-bold text-slate-800">Print Receipt</h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="rounded-xl bg-indigo-50 text-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto print:overflow-visible print:p-0">
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vasavi Hospital</h1>
            <p className="text-slate-500 text-sm mt-1">123 Health Avenue, Medical District, City - 500001</p>
            <p className="text-slate-500 text-sm">Phone: +91 98765 43210 | Email: billing@vasavihospital.com</p>
            <div className="mt-6 inline-block bg-slate-100 rounded-lg px-4 py-1.5 text-sm font-bold text-slate-700 uppercase tracking-widest">
              Payment Receipt
            </div>
          </div>

          <div className="flex justify-between mb-8 text-sm">
            <div>
              <p className="text-slate-500 font-semibold mb-1">Patient Details</p>
              <p className="font-bold text-slate-800 text-lg">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
              <p className="text-slate-600">ID: {invoice.patient?.patientCode}</p>
              <p className="text-slate-600">Phone: {invoice.patient?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-semibold mb-1">Invoice Details</p>
              <p className="font-bold text-slate-800 text-lg">{invoice.invoiceNumber}</p>
              <p className="text-slate-600">Date: {new Date(invoice.issuedAt).toLocaleDateString()}</p>
              <p className="text-slate-600 mt-1">
                Status: <span className="font-bold text-emerald-600 uppercase">{invoice.status}</span>
              </p>
            </div>
          </div>

          <table className="w-full text-left text-sm mb-8">
            <thead className="border-b-2 border-slate-200 text-slate-600">
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-slate-800">{item.description}</td>
                  <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-600">₹{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">₹{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{Number(invoice.subtotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{Number(invoice.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>+₹{Number(invoice.tax).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                <span>Total Amount</span>
                <span>₹{Number(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="pt-4 space-y-2 border-t border-dashed border-slate-300 mt-4">
                {invoice.payments?.map((payment: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>Paid via {payment.method}</span>
                    <span className="font-semibold">₹{Number(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                ))}
                <div className="flex justify-between text-rose-600 font-bold border-t border-slate-100 pt-2">
                  <span>Balance Due</span>
                  <span>
                    ₹{Math.max(0, Number(invoice.total) - (invoice.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-slate-500 text-xs mt-12 pt-8 border-t border-slate-200">
            <p>Thank you for choosing Vasavi Hospital.</p>
            <p>This is a computer generated receipt and does not require a physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
