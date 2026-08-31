import React, { useState } from 'react';
import { X, UserPlus, Building, Mail, Phone, DollarSign, Tag, FileText, MapPin, Globe, Check } from 'lucide-react';
import { useLeadStore, LeadStatus } from '../../stores/leadStore';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addLead, setStatusFilter, setSearchQuery } = useLeadStore();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'New' as LeadStatus,
    estimated_value: '',
    source: 'Manual Add',
    location: '',
    socials: '',
    notes_summary: '',
    tags: ''
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Lead name is required' });
      return;
    }

    const valueNumber = parseFloat(formData.estimated_value) || 0;
    const parsedTags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addLead({
      name: formData.name.trim(),
      company: formData.company.trim() || 'Draft Entity',
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || undefined,
      status: formData.status,
      estimated_value: valueNumber,
      source: formData.source.trim() || 'Direct Entry',
      location: formData.location.trim() || undefined,
      socials: formData.socials.trim() || undefined,
      notes_summary: formData.notes_summary.trim() || 'Newly added lead.',
      tags: parsedTags
    });

    // Ensure newly added lead is visible in table by resetting search and setting filter to match status
    setSearchQuery('');
    setStatusFilter('All');

    // Reset form
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'New',
      estimated_value: '',
      source: 'Manual Add',
      location: '',
      socials: '',
      notes_summary: '',
      tags: ''
    });
    setErrors({});

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Lead</h3>
              <p className="text-xs text-slate-400">Create a new prospect entry in your pipeline database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Lead Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Lead Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({});
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium ${
                    errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
                />
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Company / Entity
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="sarah@acme.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>
          </div>

          {/* Pipeline Stage & Estimated Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Pipeline Stage
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-semibold cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Forecast Value ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={formData.estimated_value}
                  onChange={e => setFormData({ ...formData, estimated_value: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>
          </div>

          {/* Source & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Origin Source
              </label>
              <input
                type="text"
                placeholder="e.g. Website / LinkedIn / Referral"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Location / Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. New York, NY"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>
          </div>

          {/* Socials & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Social Profile URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. https://linkedin.com/in/sarah"
                  value={formData.socials}
                  onChange={e => setFormData({ ...formData, socials: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Tags (Comma Separated)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Enterprise, High Value"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Notes / Overview
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Add initial notes or brief inquiry summary..."
                value={formData.notes_summary}
                onChange={e => setFormData({ ...formData, notes_summary: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium custom-scrollbar"
              />
              <FileText className="absolute left-3 top-3 text-slate-400 size-3.5" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="size-4" />
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
