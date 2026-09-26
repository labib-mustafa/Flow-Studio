import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Users, Tag, AlignLeft, Type } from 'lucide-react';
import { useEventStore } from '../../stores/eventStore';
import { DatePickerInput } from '../ui/DatePickerInput';
import { formatLocalDate } from '../../lib/timezone';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, defaultDate }) => {
  const { addEvent } = useEventStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<'Call' | 'Design' | 'Team Sync' | 'Other'>('Call');
  const [participants, setParticipants] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(defaultDate || formatLocalDate(new Date()));
      setTime('09:00');
      setType('Call');
      setParticipants('');
    }
  }, [isOpen, defaultDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    addEvent({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      type,
      participants: participants.trim()
    });
    
    onClose();
  };

  const eventTypes: Array<'Call' | 'Design' | 'Team Sync' | 'Other'> = ['Call', 'Design', 'Team Sync', 'Other'];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="event-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md"
        >
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />
          
          <motion.div
            key="event-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200/80 flex flex-col"
          >
          <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md shadow-zinc-950/20">
                <CalendarIcon className="size-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Schedule Calendar Event</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Block time on your workspace calendar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Type className="size-3.5" /> Event Title
              </label>
              <input
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Client Kickoff Sync"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" /> Date
                </label>
                <DatePickerInput
                  value={date}
                  onChange={setDate}
                  placeholder="Select event date..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Tag className="size-3.5" /> Event Type
              </label>
              <div className="flex flex-wrap gap-2.5">
                {eventTypes.map((t) => {
                  const getBadgeStyle = () => {
                    if (type === t) {
                      switch (t) {
                        case 'Call': return 'bg-accent text-white border-accent shadow-md shadow-accent/20 scale-105';
                        case 'Design': return 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-105';
                        case 'Team Sync': return 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-105';
                        default: return 'bg-zinc-950 text-white border-zinc-950 shadow-md shadow-zinc-950/20 scale-105';
                      }
                    } else {
                      switch (t) {
                        case 'Call': return 'bg-accent/5 text-accent border-accent/20 hover:bg-accent/10';
                        case 'Design': return 'bg-purple-50/60 text-purple-700 border-purple-200/60 hover:bg-purple-100/60';
                        case 'Team Sync': return 'bg-amber-50/60 text-amber-700 border-amber-200/60 hover:bg-amber-100/60';
                        default: return 'bg-slate-100 text-slate-700 border-slate-200/60 hover:bg-slate-200/60';
                      }
                    }
                  };
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${getBadgeStyle()}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="size-3.5" /> Participants (Optional)
              </label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="e.g. Alice, Bob, Jane"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <AlignLeft className="size-3.5" /> Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context or meeting links..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all min-h-[80px] resize-none placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 -mx-8 -mb-8 px-8 py-5 bg-slate-50/50">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
              >
                <CalendarIcon className="size-3.5 text-emerald-400" />
                Save Event
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
);
};

