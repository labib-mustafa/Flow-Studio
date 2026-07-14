import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptySearchStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onAddClient: () => void;
}

const FloatingAvatar = ({ src, className, delay, blur }: { src: string, className: string, delay: number, blur?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5, type: 'spring' }}
    className={`absolute bg-white p-0.5 rounded-[12px] shadow-sm border border-slate-100/50 ${className}`}
  >
    <img src={src} alt="avatar" className={`w-full h-full rounded-[10px] object-cover ${blur ? 'blur-[1px] opacity-60 grayscale' : 'opacity-80 grayscale-[0.2]'}`} referrerPolicy="no-referrer" />
  </motion.div>
);

export const EmptySearchState: React.FC<EmptySearchStateProps> = ({ searchQuery, onClearSearch, onAddClient }) => {
  return (
    <div id="clients-empty-state" className="p-12 lg:p-20 text-center flex flex-col items-center justify-center min-h-[500px]">

      {/* Graphic Area */}
      <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
        {/* Concentric Circles */}
        <div className="absolute inset-0 border border-slate-200/50 rounded-full scale-[1.3]" />
        <div className="absolute inset-0 border border-slate-200/70 rounded-full scale-[0.85]" />
        <div className="absolute inset-0 border border-slate-200 rounded-full scale-[0.4]" />

        {/* Floating Avatars (Static Positioning) */}
        {/* Outer Orbit */}
        <FloatingAvatar src="https://i.pravatar.cc/150?u=12" className="w-8 h-8 top-[-10%] right-[15%]" delay={0.1} blur />
        <FloatingAvatar src="https://i.pravatar.cc/150?u=15" className="w-9 h-9 bottom-[0%] left-[5%]" delay={0.2} />
        <FloatingAvatar src="https://i.pravatar.cc/150?u=20" className="w-10 h-10 top-[20%] left-[-15%]" delay={0.3} />

        {/* Middle Orbit */}
        <FloatingAvatar src="https://i.pravatar.cc/150?u=25" className="w-11 h-11 top-[5%] left-[30%]" delay={0.4} />
        <FloatingAvatar src="https://i.pravatar.cc/150?u=30" className="w-10 h-10 top-[25%] right-[0%]" delay={0.5} />
        <FloatingAvatar src="https://i.pravatar.cc/150?u=35" className="w-9 h-9 bottom-[15%] right-[10%]" delay={0.6} blur />
        <FloatingAvatar src="https://i.pravatar.cc/150?u=40" className="w-10 h-10 bottom-[10%] left-[30%]" delay={0.7} />

        {/* Center Target */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="relative z-10 bg-white p-1 rounded-2xl shadow-xl border border-slate-100"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden relative">
            <img 
              src="https://i.pravatar.cc/8?u=target" 
              className="w-full h-full object-cover grayscale opacity-70" 
              style={{ imageRendering: 'pixelated' }} 
              alt="Target user" 
            />
          </div>
        </motion.div>
      </div>

      {/* Typography & Actions */}
      <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">No clients found</h3>

      <p className="text-slate-500 text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
        {searchQuery ? (
          <>
            Your search "<span className="font-semibold text-slate-700">{searchQuery}</span>" did not match any clients. Please try again or <button onClick={onAddClient} className="text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900 transition-colors">add a new client</button>.
          </>
        ) : (
          <>
            There are no clients matching your current filters. Please adjust your view or <button onClick={onAddClient} className="text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900 transition-colors">add a new client</button>.
          </>
        )}
      </p>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onClearSearch}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          Clear search
        </button>
        <button
          onClick={onAddClient}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="size-4 text-slate-400" /> Add client
        </button>
      </div>

    </div>
  );
};
