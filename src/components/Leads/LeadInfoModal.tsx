import React from 'react';
import { Lead } from '../../stores/leadStore';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  Info,
  Layers,
  FileText,
  History,
  Copy,
  Check,
  Send,
  Sparkles
} from 'lucide-react';

interface LeadInfoModalProps {
  lead: Lead | null;
  onClose: () => void;
  onMailClick?: (leadId: string) => void;
}

export const LeadInfoModal: React.FC<LeadInfoModalProps> = ({
  lead,
  onClose,
  onMailClick
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatSourceDisplay = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('instagram') || s.includes('ig')) {
      return {
        label: 'Apify Instagram Scraper',
        logoImg: null,
        badgeBg: 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 text-pink-700 border-pink-200'
      };
    }
    if (s.includes('google maps') || s.includes('gmaps') || s.includes('places')) {
      return {
        label: 'Apify Google Maps Scraper',
        logoImg: '/assets/google-logos/google-maps.png',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (s.includes('google search') || s.includes('search') || s.includes('google')) {
      return {
        label: 'Apify Google Search Scraper',
        logoImg: '/assets/google-logos/google.png',
        badgeBg: 'bg-accent/5 text-accent border-accent/20'
      };
    }
    if (s.includes('linkedin')) {
      return {
        label: 'Apify LinkedIn Prospector',
        logoImg: null,
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    }
    if (s.includes('csv') || s.includes('import')) {
      return {
        label: 'CSV Data Upload',
        logoImg: null,
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      label: source || 'Manual Entry / Team Member',
      logoImg: null,
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  const sourceInfo = formatSourceDisplay(lead.source || '');
  const addedDateFormatted = lead.timeline && lead.timeline[0]?.date
    ? new Date(lead.timeline[0].date).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : lead.last_updated_at
    ? new Date(lead.last_updated_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Unknown';

  const lastUpdatedFormatted = lead.last_updated_at
    ? new Date(lead.last_updated_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
              {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{lead.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                  {lead.status || 'New'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Building className="size-3.5 text-slate-400" />
                <span>{lead.company || 'Independent Prospect'}</span>
                {lead.type && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">{lead.type}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-800 text-xs">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <DollarSign className="size-3 text-emerald-600" /> Est. Value
              </span>
              <div className="text-base font-extrabold text-slate-900">
                ${(lead.estimated_value || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="size-3 text-accent" /> Pipeline Stage
              </span>
              <div className="text-sm font-bold text-slate-800">
                {lead.status || 'New'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="size-3 text-purple-600" /> Added Time
              </span>
              <div className="text-[11px] font-semibold text-slate-700 truncate" title={addedDateFormatted}>
                {addedDateFormatted}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                {sourceInfo.logoImg ? (
                  <img src={sourceInfo.logoImg} className="size-3.5 object-contain" alt="Logo" />
                ) : (
                  <Sparkles className="size-3 text-pink-600" />
                )}
                Origin Source
              </span>
              <div className="text-[11px] font-semibold text-slate-700 truncate flex items-center gap-1.5" title={sourceInfo.label}>
                {sourceInfo.label}
              </div>
            </div>
          </div>

          {/* Source & Origin Badge Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="size-3.5 text-accent" /> Origin & Provenance Metadata
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Verified Record
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400">Creation Date / Added:</span>
                <p className="font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {addedDateFormatted}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Added By / Generator:</span>
                <p className="font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  {sourceInfo.logoImg ? (
                    <img src={sourceInfo.logoImg} className="size-3.5 object-contain" alt="Logo" />
                  ) : (
                    <Sparkles className="size-3.5 text-amber-400" />
                  )}
                  {sourceInfo.label}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Last Modified / Updated:</span>
                <p className="font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <Clock className="size-3.5 text-slate-400" />
                  {lastUpdatedFormatted}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Record ID:</span>
                <p className="font-mono text-[11px] text-slate-300 mt-0.5 truncate">{lead.id}</p>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="size-3.5 text-slate-700" /> Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5">{lead.email || 'No email provided'}</p>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(lead.email!, 'email')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </button>
                    {onMailClick && (
                      <button
                        onClick={() => {
                          onClose();
                          onMailClick(lead.id);
                        }}
                        className="p-1.5 text-accent hover:bg-accent/5 rounded-lg transition-colors cursor-pointer"
                        title="Send email"
                      >
                        <Send className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5">{lead.phone || 'No phone provided'}</p>
                </div>
                {lead.phone && (
                  <button
                    onClick={() => copyToClipboard(lead.phone!, 'phone')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy phone"
                  >
                    {copiedField === 'phone' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </button>
                )}
              </div>

              {/* Socials / Website */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Website / Social Profile</span>
                  {lead.socials ? (
                    <a
                      href={lead.socials.startsWith('http') ? lead.socials : `https://${lead.socials}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent hover:underline truncate block mt-0.5"
                    >
                      {lead.socials}
                    </a>
                  ) : (
                    <p className="font-medium text-slate-400 mt-0.5">Not specified</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Address</span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5 flex items-center gap-1">
                    <MapPin className="size-3 text-slate-400 shrink-0" />
                    <span>{lead.location || 'Unspecified'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags & Classification */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Tag className="size-3.5 text-slate-700" /> Tags & Classification
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {lead.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes & Summary */}
          {lead.notes_summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="size-3.5 text-slate-700" /> Notes & Activity Summary
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 leading-relaxed text-xs">
                {lead.notes_summary}
              </div>
            </div>
          )}

          {/* Timeline Events */}
          {lead.timeline && lead.timeline.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <History className="size-3.5 text-slate-700" /> Lead Timeline & History
              </h3>
              <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
                {lead.timeline.map((ev, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{ev.event}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ev.date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => copyToClipboard(JSON.stringify(lead, null, 2), 'json')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            {copiedField === 'json' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            Copy Lead JSON
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
