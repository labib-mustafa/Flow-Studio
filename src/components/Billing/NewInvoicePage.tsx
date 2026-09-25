import React, { useState } from 'react';
import { useBillingStore, InvoiceLineItem } from '../../stores/billingStore';
import { useClientStore } from '../../stores/clientStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { formatLocalDate } from '../../lib/timezone';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface NewInvoicePageProps {
  onBack?: () => void;
  onSave?: () => void;
}



const PAYMENT_METHOD_OPTIONS = [
  { id: 'Bank Transfer', icon: 'account_balance' },
  { id: 'PayPal', icon: 'payments' },
  { id: 'Payoneer', icon: 'currency_exchange' },
  { id: 'Binance', icon: 'currency_bitcoin' },
  { id: 'Bkash', icon: 'smartphone' },
  { id: 'Nagad', icon: 'send_to_mobile' },
  { id: 'Rocket', icon: 'rocket_launch' },
];

export const PaymentLogo: React.FC<{ method: string; className?: string }> = ({ method, className = "size-5" }) => {
  const normalized = method.toLowerCase();
  
  let src = "";
  let alt = method;
  
  if (normalized.includes('paypal')) {
    src = "/payment-logos/paypal.png";
  } else if (normalized.includes('payoneer')) {
    src = "/payment-logos/payoneer.svg";
  } else if (normalized.includes('binance')) {
    src = "/payment-logos/binance.svg";
  } else if (normalized.includes('bkash')) {
    src = "/payment-logos/bkash.png";
  } else if (normalized.includes('nagad')) {
    src = "/payment-logos/nagad.png";
  } else if (normalized.includes('rocket')) {
    src = "/payment-logos/rocket.png";
  }
  
  if (src) {
    return <img src={src} alt={alt} className={`${className} object-contain`} />;
  }
  
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="19" width="18" height="3" rx="1" />
      <path d="M5 19V10m4 9V10m6 9V10m4 9V10M2 10l10-7 10 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};


export const NewInvoicePage: React.FC<NewInvoicePageProps> = ({ onBack, onSave }) => {
  const addInvoice = useBillingStore((state) => state.addInvoice);
  const workspace = useWorkspaceStore();
  const currSym = workspace.currencySymbol || '$';

  const { clients } = useClientStore();
  const [selectedClient, setSelectedClient] = useState<any>(clients.length > 0 ? clients[0] : null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(clients.length > 0 && clients[0].location ? clients[0].location : '');
  const [shippingAddress, setShippingAddress] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(() => formatLocalDate(new Date()));
  const [dueDate, setDueDate] = useState(() => formatLocalDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
  const [projectRef, setProjectRef] = useState('');

  const [selectedMethods, setSelectedMethods] = useState<string[]>(['Bank Transfer']);

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  const [notes, setNotes] = useState('Payment is due within 15 days. Please include the invoice number on your check.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendMenuOpen, setIsSendMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setBillingAddress(client.location || '');
    setIsClientDropdownOpen(false);
  };

  const toggleMethod = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId) ? prev.filter((m) => m !== methodId) : [...prev, methodId]
    );
  };

  const handleLineItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        description: 'New Service Item',
        subDescription: 'Description of deliverables',
        quantity: 10,
        rate: 100.00
      }
    ]);
  };

  const handleDeleteItem = (id: string) => {
    if (lineItems.length <= 1) {
      showToast('Invoice must have at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBulkImport = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}-1`,
        description: 'Frontend Development Support',
        subDescription: 'Component implementation and QA verification',
        quantity: 25,
        rate: 120.00
      },
      {
        id: `li-${Date.now()}-2`,
        description: 'Responsive Mobile Optimization',
        subDescription: 'Testing and adjusting layouts across breakpoints',
        quantity: 15,
        rate: 120.00
      }
    ]);
    showToast('Imported 2 standard deliverables successfully.');
  };

  const handleExportPDF = () => {
    const previewEl = document.querySelector('.lg\\:flex.w-2\\/5.h-full');
    if (!previewEl) {
      showToast('Invoice preview not found.');
      return;
    }
    
    const invoiceCard = previewEl.querySelector('.bg-white');
    if (!invoiceCard) {
      showToast('Invoice card preview not found.');
      return;
    }

    showToast('Generating and downloading PDF...');

    const opt = {
      margin:       10,
      filename:     `invoice_${invoiceNumber || 'INV-XXXX'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(invoiceCard as HTMLElement).set(opt).save().catch((err: any) => {
      console.error('PDF export error:', err);
      showToast('PDF generation failed.');
    });
  };

  const handleEmailPDF = () => {
    const senderName = workspace.name || 'Flow Studio';
    const subject = encodeURIComponent(`Invoice ${invoiceNumber} from ${senderName}`);
    const body = encodeURIComponent(`Hi ${selectedClient.name},\n\nPlease find attached Invoice ${invoiceNumber} for our recent deliverables.\n\nTotal Due: ${currSym}${total.toFixed(2)}\n\nThank you for your business!\n\nBest regards,\n${senderName}`);
    
    window.location.href = `mailto:${selectedClient.email}?subject=${subject}&body=${body}`;
    showToast(`Launching email client for ${selectedClient.email}...`);
  };

  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const total = subtotal; // 0% tax for simplicity

  const handleCreateAndSave = (status: 'Pending' | 'Draft') => {
    addInvoice({
      invoiceNumber,
      amount: total,
      status,
      recipientName: selectedClient.name,
      recipientAvatar: selectedClient.initials,
      recipientEmail: selectedClient.email,
      date: issueDate,
      dueDate,
      method: selectedMethods[0] || 'Bank Transfer',
      lineItems,
      notes
    });

    if (status === 'Draft') {
      showToast('Invoice saved as draft!');
    } else {
      showToast('Invoice sent and saved to billing records!');
    }

    setTimeout(() => {
      if (onSave) onSave();
    }, 800);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white text-slate-900 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 right-8 z-[999] animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group shrink-0 cursor-pointer"
            title="Back to Billing"
          >
            <svg 
              viewBox="416.66 432.14 158.84 158.84" 
              className="size-8"
            >
              <polyline 
                fill="none"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
                points="507.33 540.98 478.51 512.16 507.33 483.34"
                className="group-hover:-translate-x-[6px] transition-transform duration-200"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">New Invoice</h1>
            <p className="text-xs text-slate-500 font-medium">{projectRef || 'Untitled Project'}</p>
          </div>
          <span className="ml-3 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Draft
          </span>
        </div>

      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Form Area */}
        <div className="w-full lg:w-3/5 h-full overflow-y-auto bg-white border-r border-slate-200 flex flex-col justify-between custom-scrollbar">
          <div className="p-6 md:p-8 pb-32 max-w-4xl mx-auto w-full space-y-10">
            
            {/* Section 1: Client Details */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">person</span> Client Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Select Client</label>
                  <div
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="flex items-center gap-3 w-full p-3.5 border border-slate-200 rounded-2xl hover:border-primary focus-within:border-primary transition-all bg-white cursor-pointer shadow-sm select-none"
                  >
                    <img src={selectedClient.initials} alt={selectedClient.name} className="size-10 rounded-full object-cover border border-slate-100" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-slate-900 text-sm">{selectedClient.name}</p>
                      <p className="text-xs text-slate-500 truncate">{selectedClient.email}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                  </div>

                  {/* Client Dropdown Options */}
                  {isClientDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                      {clients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClient({ name: c.name, email: c.email, avatar: c.initials || '' });
                            setBillingAddress(c.location || '');
                            setIsClientDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                            selectedClient.name === c.name ? 'bg-primary/5 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          {c.initials ? (
                            <img src={c.initials} alt={c.name} className="size-9 rounded-full object-cover" />
                          ) : (
                            <div className="size-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs">
                              {c.name.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </div>
                          {selectedClient.name === c.name && (
                            <span className="material-symbols-outlined text-primary text-sm">check</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Billing Address</label>
                  <textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm leading-relaxed"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Shipping Address (Optional)</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Same as billing address"
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm leading-relaxed placeholder:text-slate-400"
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Invoice Details */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">receipt_long</span> Invoice Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Invoice Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">#</span>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full pl-8 pr-3 py-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Project Reference</label>
                  <input
                    type="text"
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Payment Methods */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">payments</span> Payment Methods
              </h2>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-slate-500 font-medium mb-3">Select available payment options to display on the client invoice:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PAYMENT_METHOD_OPTIONS.map((m) => {
                    const isChecked = selectedMethods.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleMethod(m.id)}
                        className={`relative flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                          isChecked
                            ? 'border-primary bg-primary/5 shadow-sm font-bold text-primary ring-2 ring-primary/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Custom visual checkbox indicator */}
                        <div className={`absolute top-2.5 right-2.5 size-4 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-primary border-primary text-white scale-100' : 'border-slate-300 bg-white scale-90'
                        }`}>
                          {isChecked && (
                            <span className="material-symbols-outlined text-[10px] font-black">check</span>
                          )}
                        </div>
                        <div className="mb-2 p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <PaymentLogo method={m.id} className="size-6 text-slate-600" />
                        </div>
                        <span className="text-xs font-bold">{m.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Section 4: Line Items */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">list</span> Line Items Breakdown
                </h2>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="text-primary hover:text-primary-dark text-xs font-bold flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Bulk Import <span className="material-symbols-outlined text-[16px]">upload</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5 w-12 text-center">#</th>
                      <th className="px-4 py-3.5 w-5/12">Item Description</th>
                      <th className="px-4 py-3.5 text-right">Qty/Hrs</th>
                      <th className="px-4 py-3.5 text-right">Rate</th>
                      <th className="px-4 py-3.5 text-right">Amount</th>
                      <th className="px-4 py-3.5 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-4 space-y-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                            placeholder="Deliverable title..."
                            className="w-full border-none p-0 bg-transparent font-bold text-slate-900 focus:outline-none focus:ring-0 text-sm placeholder:text-slate-300"
                          />
                          <input
                            type="text"
                            value={item.subDescription || ''}
                            onChange={(e) => handleLineItemChange(item.id, 'subDescription', e.target.value)}
                            placeholder="Sub-description or scope details..."
                            className="w-full border-none p-0 bg-transparent text-xs text-slate-500 focus:outline-none focus:ring-0 placeholder:text-slate-300"
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                            className="w-16 text-right border border-slate-200 rounded-xl text-sm font-semibold p-1.5 focus:border-primary focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="relative inline-block">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                              className="w-24 text-right border border-slate-200 rounded-xl text-sm font-semibold p-1.5 pl-6 focus:border-primary focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-900 font-mono">
                          ${(item.quantity * item.rate).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100 p-1"
                            title="Remove Line Item"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center justify-center gap-2 text-primary font-bold text-sm hover:text-primary-dark transition-colors px-4 py-2.5 rounded-xl hover:bg-primary/5 w-full border border-dashed border-primary/40 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Line Item
                  </button>
                </div>
              </div>
            </section>

            {/* Section 5: Notes & Terms */}
            <section>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Notes / Terms & Conditions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 shadow-sm leading-relaxed"
                rows={3}
              />
            </section>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0 z-30 shadow-xl">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              Discard
            </button>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCreateAndSave('Draft')}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
              >
                Save as Draft
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSendMenuOpen(!isSendMenuOpen)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Send & Export
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>

                {/* Send Menu Dropdown */}
                {isSendMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSendMenuOpen(false);
                        handleCreateAndSave('Pending');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary">mail</span>
                      Send to Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSendMenuOpen(false);
                        handleExportPDF();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[20px] text-slate-500">picture_as_pdf</span>
                      Export as PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSendMenuOpen(false);
                        handleEmailPDF();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[20px] text-emerald-500">mark_email_read</span>
                      Email PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview Area */}
        <div className="hidden lg:flex w-2/5 h-full bg-[#f1f5f9] overflow-y-auto p-8 items-start justify-center relative custom-scrollbar ">
          <div className="rounded-xl bg-white w-full max-w-[500px] min-h-[680px] shadow-2xl rounded-sm p-8 relative scale-95 origin-top border border-slate-200/80 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {workspace.logo ? (
                    <img src={workspace.logo} alt={workspace.name} className="size-9 rounded-xl object-cover border border-slate-200 shadow-xs" />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white font-extrabold text-sm shadow-xs">
                      {workspace.name ? workspace.name.substring(0, 2).toUpperCase() : 'FS'}
                    </div>
                  )}
                  <div>
                    <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-tight">
                      {workspace.name || 'Flow Studio'}
                    </span>
                    {workspace.legalName && (
                      <span className="text-[10px] text-slate-400 font-medium block">{workspace.legalName}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-light text-slate-300 uppercase tracking-widest leading-none">Invoice</h1>
                  <p className="font-mono text-sm font-bold text-slate-800 mt-1">#{invoiceNumber || 'INV-XXXX'}</p>
                </div>
              </div>

              {/* Billed To / Dates */}
              <div className="flex justify-between mb-10">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Billed To</p>
                  <h3 className="font-black text-slate-900 text-sm">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-500 whitespace-pre-line mt-1 leading-relaxed">
                    {billingAddress}
                  </p>
                </div>
                <div className="text-right space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Issue Date</p>
                    <p className="text-xs font-bold text-slate-700">{issueDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Due Date</p>
                    <p className="text-xs font-bold text-slate-700">{dueDate}</p>
                  </div>
                </div>
              </div>

              {/* Line Items Preview Table */}
              <div className="mb-8">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider">
                      <th className="text-left py-2.5 w-1/2">Description</th>
                      <th className="text-right py-2.5">Qty</th>
                      <th className="text-right py-2.5">Rate</th>
                      <th className="text-right py-2.5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-2">
                          <p className="font-bold text-slate-800">{item.description || 'Deliverable'}</p>
                          {item.subDescription && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.subDescription}</p>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">{currSym}{Number(item.rate).toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-slate-800 font-mono">
                          {currSym}{(item.quantity * item.rate).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-10">
                <div className="w-7/12 space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-900 font-mono">{currSym}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                    <span className="text-slate-500">Tax (0%)</span>
                    <span className="font-bold text-slate-900 font-mono">{currSym}0.00</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-sm font-extrabold text-slate-900">Total Due</span>
                    <span className="text-xl font-black text-primary font-mono">{currSym}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-6 border-t-2 border-slate-100">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMethods.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                      <PaymentLogo method={m} className="size-3.5 object-contain" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {notes && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Memo / Terms</p>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">"{notes}"</p>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <div>
                  <p>Questions? Contact us at</p>
                  <p className="font-bold text-slate-700">{workspace.email || 'billing@flowstudio.com'}</p>
                  {workspace.taxId && <p className="text-[9px] text-slate-400 mt-0.5">Tax ID: {workspace.taxId}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-medium block">Powered by Flow Studio</span>
                  <div className="mt-1 px-2.5 py-1 rounded bg-slate-900 text-white font-bold uppercase tracking-wider text-[8.5px] opacity-40 inline-block">
                    Pay Online
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp watermark */}
            <div className="absolute bottom-36 right-8 pointer-events-none opacity-[0.03] -rotate-12 select-none">
              <span className="material-symbols-outlined text-[160px]">verified</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
