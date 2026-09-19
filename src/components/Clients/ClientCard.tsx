import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Client } from '../../stores/clientStore';
import { sound } from '../../stores/soundStore';
import {
  CheckCircle2,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpRight,
  Phone
} from 'lucide-react';

export interface ClientCardProps {
  client: Client;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string, name: string) => void;
  formatCurrency?: (val: number) => string;
}

const formatVol = (val: number) => {
  if (!val) return '$0';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1).replace('.0', '')}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1).replace('.0', '')}k`;
  return `$${val}`;
};

export const ClientCard: React.FC<ClientCardProps> = React.memo(({
  client,
  index,
  isSelected,
  onSelect,
  onOpenDetails,
  onEdit,
  onDelete
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ongoingCount = client.projectHistory ? client.projectHistory.filter(p => p.statusType === 'ongoing').length : 0;
  const completedCount = client.projectHistory ? client.projectHistory.filter(p => p.statusType === 'completed').length : 0;
  const totalProjects = (client.projectsCount && client.projectsCount > 0) ? client.projectsCount : (ongoingCount + completedCount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.22,
        delay: Math.min(index * 0.02, 0.25),
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => onSelect(client.id)}
      onDoubleClick={() => onOpenDetails(client.id)}
      className={`relative bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group w-full ${isSelected
        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10'
        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg shadow-xs'
        }`}
    >
      <div>
        {/* Top Row: Avatar, Name & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              {client.avatarUrl ? (
                <img
                  src={client.avatarUrl}
                  alt={client.name}
                  className="size-11 rounded-xl object-cover border border-slate-100 shadow-2xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`size-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-2xs ${client.avatarUrl ? 'hidden' : ''}`}>
                {client.initials || client.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Status Ring Dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${client.status === 'Active'
                  ? 'bg-emerald-500'
                  : client.status === 'Prospect'
                    ? 'bg-blue-500'
                    : 'bg-slate-400'
                  }`}
              />
            </div>

            {/* Name & Company */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {client.name}
                </h3>
                {client.status === 'Active' && (
                  <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                {client.company || 'Client'}
                {client.role ? ` • ${client.role}` : ''}
              </p>
            </div>
          </div>

          {/* Status Badge & 3-dots Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${client.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : client.status === 'Prospect'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
            >
              {client.status}
            </span>

            {/* Context Menu Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.tick();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="size-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                title="Client Options"
              >
                <MoreVertical className="size-3.5" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-8 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.tick();
                        setIsMenuOpen(false);
                        onEdit(client);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Edit className="size-3.5 text-slate-400" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onDelete(client.id, client.name);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="size-3.5 text-rose-500" />
                      <span>Delete Client</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Row */}
        <div className="my-3 flex items-center justify-between text-xs text-slate-500 gap-2">
          {client.email ? (
            <a
              href={`mailto:${client.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 truncate hover:text-blue-600 transition-colors"
              title={client.email}
            >
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span className="truncate">{client.email}</span>
            </a>
          ) : (
            <span className="text-slate-400 text-[11px]">No email listed</span>
          )}

          {client.location && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 max-w-[120px] truncate" title={client.location}>
              <MapPin className="size-3 text-slate-300 shrink-0" />
              <span className="truncate">{client.location}</span>
            </span>
          )}
        </div>

        {/* 3-Pill Metrics Bento */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 text-center">
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {totalProjects}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-0.5">
              Projects
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {formatVol(client.totalVolume || 0)}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-0.5">
              Volume
            </span>
          </div>
          <div>
            <span className={`text-xs font-bold block leading-tight ${client.outstandingAmount ? 'text-amber-600' : 'text-emerald-600'}`}>
              {client.outstandingAmount ? formatVol(client.outstandingAmount) : 'Paid'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-0.5">
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Brand Colors & Details Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
        {/* Brand Colors or Phone */}
        <div className="flex items-center gap-1">
          {client.brandColors && client.brandColors.length > 0 ? (
            client.brandColors.slice(0, 4).map((col, idx) => (
              <span
                key={idx}
                className="size-3 rounded-full"
                style={{ backgroundColor: col.hex }}
                title={col.name || col.hex}
              />
            ))
          ) : client.phone ? (
            <a
              href={`tel:${client.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              title={client.phone}
            >
              <Phone className="size-2.5 text-slate-400" />
              <span>{client.phone}</span>
            </a>
          ) : (
            <span className="text-[10px] font-medium text-slate-300">Standard</span>
          )}
        </div>

        {/* View Profile Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.tick();
            onOpenDetails(client.id);
          }}
          className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          <span>View Details</span>
          <ArrowUpRight className="size-3 text-slate-400 group-hover:text-blue-600" />
        </button>
      </div>
    </motion.div>
  );
});

ClientCard.displayName = 'ClientCard';
