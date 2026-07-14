import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../stores/notificationStore';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, markAllRead, markAsRead } = useNotificationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center size-10 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all focus:outline-none"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-[rgba(19,19,22,0.15)_0px_8px_24px] overflow-hidden z-[100]"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <button onClick={markAllRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {notifications.map(notification => (
                <div key={notification.id} onClick={() => markAsRead(notification.id)} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notification.unread ? 'bg-blue-50/10' : ''}`}>
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`size-2 rounded-full ${notification.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">{notification.message}</p>
                      <span className="text-xs font-bold text-slate-400 mt-1 block">{notification.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-center bg-slate-50/50">
              <button className="text-sm font-bold text-slate-600 hover:text-slate-900">View all notifications</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
