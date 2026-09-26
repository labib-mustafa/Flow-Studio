import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBillingStore } from '../../stores/billingStore';
import { Receipt, Download, Plus, Search } from 'lucide-react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useAuthStore } from '../../stores/authStore';
import { BillingSkeleton } from '../GlobalComponents/Skeletons/BillingSkeleton';

interface BillingPageProps {
  onNewInvoice?: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onNewInvoice }) => {
  const { settings, updateSettings } = useSettingsContext();
  const { user } = useAuthStore();
  const {
    balance,
    nextPaymentAmount,
    nextPaymentDate,
    savedCard,
    billingAddress,
    paymentHistory,
    updateSavedCard,
    updateBillingAddress,
    updateInvoiceStatus,
    _hasHydrated
  } = useBillingStore();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed' | 'Draft'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for editing
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [addressNameInput, setAddressNameInput] = useState(billingAddress.name || settings?.displayName || user?.displayName || '');
  const [addressLine1Input, setAddressLine1Input] = useState(billingAddress.addressLine1 || settings?.companyName || '');
  const [addressLine2Input, setAddressLine2Input] = useState(billingAddress.addressLine2 || '');

  useEffect(() => {
    setAddressNameInput(billingAddress.name || settings?.displayName || user?.displayName || '');
    setAddressLine1Input(billingAddress.addressLine1 || settings?.companyName || '');
    setAddressLine2Input(billingAddress.addressLine2 || '');
  }, [billingAddress, settings, user]);

  // NOTE: two effects used to live here. On mount they generated a random masked card
  // number, defaulted the brand to 'Mastercard', and stamped an expiry three years out,
  // then persisted all of it via updateSavedCard. That fabricated a payment method the
  // user had never added, and it was indistinguishable from real saved-card data.
  //
  // They were not needed: every field in the card panel already renders a neutral
  // placeholder when nothing is stored — `savedCard.cardNumber || '•••• •••• •••• ••••'`,
  // `savedCard.brand || 'CARD'`, `savedCard.validThru || '--/--'`. So removing the
  // fabrication leaves an honest empty card rather than a broken one.

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const totalPaymentsCleared = paymentHistory
    .filter((item) => item.status === 'Completed')
    .reduce((sum, item) => sum + item.amount, 0);

  const filteredHistory = paymentHistory.filter((item) => {
    const matchesTab = activeTab === 'All' ? true : item.status === activeTab;
    const matchesSearch =
      item.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };



  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    updateBillingAddress({
      name: addressNameInput,
      addressLine1: addressLine1Input,
      addressLine2: addressLine2Input
    });
    setIsEditAddressOpen(false);
    showToast('Billing address updated successfully.');
  };

  if (!_hasHydrated) {
    return <BillingSkeleton />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f5f5f7] text-slate-900 relative font-sans flex-col">
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

      {/* Header Banner */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-2 w-1/3">
          <Receipt className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Billing & Finance</h2>
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200/60">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Account
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative group w-full max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center hover:text-slate-700 text-slate-400"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-1/3">
          <button
            onClick={() => showToast('Exporting financial statement as CSV...')}
            type="button"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-2 outline-none shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            Export Statement
          </button>

          <button
            onClick={onNewInvoice}
            type="button"
            className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 outline-none border border-slate-950 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            New Invoice
          </button>
        </div>
      </header>

      {/* Main split content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Left Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-[#f5f5f7]">

          {/* Top Bento Cards Section */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 3D Flip Credit Card (Left Bento - 5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="w-full flex justify-center md:justify-start">
                <div className="group w-full max-w-[380px] aspect-[1.586] [perspective:1000px] cursor-pointer">
                  <div className="relative w-full h-full rounded-2xl transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl">

                    {/* Front Side */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#09090b] to-[#171719] p-6 text-white [backface-visibility:hidden] border border-white/10 overflow-hidden flex flex-col justify-between shadow-xl">
                      {/* Glowing background shapes */}
                      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-3xl pointer-events-none"></div>
                      <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-11 rounded bg-gradient-to-br from-amber-200/40 to-amber-500/40 border border-amber-300/40 flex items-center justify-center backdrop-blur-md shadow-inner">
                            <div className="h-5 w-8 rounded border border-amber-900/30 bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90 grid grid-cols-3"></div>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono ml-1">Debit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-white/80 text-[18px] rotate-90">rss_feed</span>
                          <span className="text-white font-black tracking-widest uppercase text-xs">{savedCard.brand || 'CARD'}</span>
                        </div>
                      </div>

                      <div className="relative z-10 my-2">
                        <p className="font-mono text-lg sm:text-xl font-bold tracking-[0.2em] text-white drop-shadow-md text-center">
                          {savedCard.cardNumber || '•••• •••• •••• ••••'}
                        </p>
                      </div>

                      <div className="flex items-end justify-between relative z-10">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Card Holder</p>
                          <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-white mt-0.5">
                            {settings?.displayName || user?.displayName || savedCard.cardHolder || 'Account Holder'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Valid Thru</p>
                          <p className="font-mono text-xs font-bold text-white mt-0.5">{savedCard.validThru || '--/--'}</p>
                        </div>
                        <div className="flex items-center -space-x-3">
                          <div className="h-7 w-7 rounded-full bg-[#EB001B] opacity-90 mix-blend-screen shadow-md"></div>
                          <div className="h-7 w-7 rounded-full bg-[#F79E1B] opacity-90 mix-blend-screen shadow-md"></div>
                        </div>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#09090b] to-[#121214] text-white [backface-visibility:hidden] [transform:rotateY(180deg)] border border-white/10 overflow-hidden flex flex-col items-center justify-center p-6 shadow-xl">
                      {/* Glowing ambient colors */}
                      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
                      <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none"></div>

                      <div className="relative z-10 text-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Total Payments Cleared</p>
                        <h3 className="text-3xl font-black tracking-tight text-white mt-2 font-mono drop-shadow-md">
                          ${totalPaymentsCleared.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Next Scheduled Payment Card (Right Bento - 7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-white p-7 shadow-sm border border-slate-200/80 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 size-48 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Next Autopay Debit</span>
                      <span className="text-xs font-semibold text-slate-700">Recurring Subscription</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    Monthly Cycle
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <h3 className="text-4xl font-black tracking-tight text-slate-900 font-mono">
                    ${nextPaymentAmount.toFixed(2)}
                  </h3>
                  <span className="text-xs font-medium text-slate-400">Due on {nextPaymentDate}</span>
                </div>

                {/* Credit Utilization Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Credit Limit Utilization</span>
                    <span className="font-mono font-bold text-slate-700">
                      ${totalPaymentsCleared.toFixed(0)} / ${balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, (totalPaymentsCleared / balance) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-slate-100">
                <button
                  onClick={() => showToast('Payment processed early! Thank you.')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  Pay Early Now
                </button>
                <button
                  onClick={() => showToast('Autopay schedule settings opened.')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  Manage Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Invoices & Transactions</h3>
                  <p className="text-xs text-slate-500 font-medium">Complete audit log of billed client deliverables and transfers</p>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['All', 'Pending', 'Completed', 'Draft'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 rounded-xl mb-3 border border-slate-100">
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Client / Recipient</div>
              <div className="col-span-2">Issue Date</div>
              <div className="col-span-2">Method / ID</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                  <p className="text-sm font-bold text-slate-600">No transactions found</p>
                  <p className="text-xs text-slate-400 mt-1">Try refining your search query or switching category filter</p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isExpanded = expandedInvoiceId === item.id;
                  return (
                    <div key={item.id} className="transition-all duration-200">
                      <div
                        onClick={() => toggleExpand(item.id)}
                        className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 rounded-2xl px-6 py-4 cursor-pointer transition-all border ${isExpanded
                          ? 'bg-slate-900 text-white shadow-xl border-slate-900'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/70'
                          }`}
                      >
                        <div className="col-span-2 flex items-center justify-between md:justify-start">
                          <span className={`text-lg font-black font-mono ${isExpanded ? 'text-white' : 'text-slate-900'}`}>
                            ${item.amount.toFixed(2)}
                          </span>
                          <span className="md:hidden text-xs font-mono opacity-80">{item.invoiceNumber}</span>
                        </div>

                        <div className="col-span-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isExpanded
                              ? 'bg-white/20 text-white backdrop-blur-sm'
                              : item.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                : item.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                          >
                            <span className={`size-1.5 rounded-full ${isExpanded ? 'bg-white' : item.status === 'Completed' ? 'bg-emerald-500' : item.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                              }`}></span>
                            {item.status}
                          </span>
                        </div>

                        <div className="col-span-4 flex items-center gap-3">
                          {item.recipientAvatar ? (
                            <img
                              src={item.recipientAvatar}
                              alt={item.recipientName}
                              className={`size-9 rounded-full object-cover border-2 shrink-0 shadow-sm ${isExpanded ? 'border-white/40' : 'border-white'
                                }`}
                            />
                          ) : (
                            <div className="size-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                              {item.recipientName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className={`text-sm font-bold truncate ${isExpanded ? 'text-white' : 'text-slate-800'}`}>
                              {item.recipientName}
                            </p>
                            {item.recipientEmail && (
                              <p className={`text-xs truncate ${isExpanded ? 'text-white/80' : 'text-slate-400'}`}>
                                {item.recipientEmail}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className={`col-span-2 text-sm font-medium ${isExpanded ? 'text-white/90' : 'text-slate-500'}`}>
                          {item.date}
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-end gap-3">
                          <span className={`text-sm font-mono font-medium ${isExpanded ? 'text-white/90' : 'text-slate-500'}`}>
                            {item.method || item.invoiceNumber}
                          </span>
                          <div className={`size-8 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-700'
                            }`}>
                            <span className={`material-symbols-outlined text-[18px] transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Accordion Details */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 rounded-2xl bg-white border border-slate-200 p-6">
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Reference</span>
                                  <h4 className="text-base font-black text-slate-900 font-mono mt-0.5">{item.invoiceNumber}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast(`Invoice #${item.invoiceNumber} PDF downloaded.`);
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">download</span> Download PDF
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast(`Reminder email sent to ${item.recipientName}.`);
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-xs font-bold text-accent transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">mail</span> Resend Receipt
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Line Items Breakdown</h5>
                                  <div className="space-y-2">
                                    {item.lineItems && item.lineItems.length > 0 ? (
                                      item.lineItems.map((li, idx) => (
                                        <div key={li.id || idx} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                          <div className="flex items-start gap-2.5">
                                            <span className="material-symbols-outlined text-[16px] text-accent mt-0.5">check_circle</span>
                                            <div>
                                              <p className="text-xs font-bold text-slate-800">{li.description}</p>
                                              {li.subDescription && (
                                                <p className="text-[11px] text-slate-500 mt-0.5">{li.subDescription}</p>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-xs font-bold text-slate-900 font-mono ml-4">
                                            ${(li.quantity * li.rate).toFixed(2)}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">Standard billing item</p>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Status</p>
                                      <select
                                        value={item.status}
                                        onChange={(e) => {
                                          updateInvoiceStatus(item.id, e.target.value as 'Pending' | 'Completed' | 'Draft' | 'Overdue');
                                          showToast(`Invoice status updated to ${e.target.value}`);
                                        }}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer appearance-none pr-6 bg-no-repeat bg-[right_0.25rem_center] bg-[length:12px_12px] ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80' :
                                          item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200/80' :
                                            item.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200/80' :
                                              'bg-slate-50 text-slate-600 border-slate-200/80'
                                          }`}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
                                      >
                                        <option value="Draft">Draft</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Overdue">Overdue</option>
                                      </select>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice Date</p>
                                      <p className="text-sm font-medium text-slate-700 mt-0.5">{item.date}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</p>
                                      <p className="text-sm font-medium text-slate-700 mt-0.5">{item.dueDate}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</p>
                                      <p className="text-sm font-medium text-slate-700 mt-0.5">{item.method}</p>
                                    </div>
                                  </div>

                                  {item.notes && (
                                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes / Memo</p>
                                      <p className="text-xs text-slate-600 italic mt-0.5">"{item.notes}"</p>
                                    </div>
                                  )}

                                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Charged</span>
                                    <span className="text-xl font-black text-slate-900 font-mono">
                                      ${item.amount.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Redesigned Right Sidebar Panel (Billing Command & Controls) */}
        <div className="hidden xl:flex w-88 border-l border-slate-200/80 bg-white p-6 flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          <div className="space-y-6">
            {/* Primary Action Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-[#2563eb] to-[#1e40af] p-6 text-white shadow-xl shadow-accent/25">
              <div className="absolute right-0 top-0 size-36 -mr-10 -mt-10 rounded-full bg-white/15 blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
                  Instant Billing
                </span>
                <span className="material-symbols-outlined text-white/80">auto_awesome</span>
              </div>

              <h3 className="text-lg font-black tracking-tight mb-1">Create New Invoice</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed mb-5">
                Draft professional itemized invoices with live calculation and automated reminders.
              </p>

              <button
                onClick={onNewInvoice}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-accent shadow-md hover:bg-slate-50 transition-all active:scale-95 transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">post_add</span>
                Launch Invoice Builder
              </button>
            </div>



            {/* Compliance & Tax Documents */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tax & Compliance</h4>
              <div className="space-y-2">
                <button
                  onClick={() => showToast('Downloading W-9 Tax Certificate (2024)...')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-accent text-[20px]">description</span>
                    <span className="text-xs font-bold text-slate-700">W-9 Form (2024)</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-[18px]">download</span>
                </button>

                <button
                  onClick={() => showToast('Downloading Tax Exemption Verification...')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-accent text-[20px]">policy</span>
                    <span className="text-xs font-bold text-slate-700">Tax Exemption Certificate</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-[18px]">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Edit Address Modal */}
      {isEditAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Edit Billing Address</h3>
              <button onClick={() => setIsEditAddressOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company or Person Name</label>
                <input
                  type="text"
                  required
                  value={addressNameInput}
                  onChange={(e) => setAddressNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressLine1Input}
                  onChange={(e) => setAddressLine1Input(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">City, State & Zip</label>
                <input
                  type="text"
                  required
                  value={addressLine2Input}
                  onChange={(e) => setAddressLine2Input(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditAddressOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
