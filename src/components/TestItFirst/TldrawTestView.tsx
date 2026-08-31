import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';

interface TldrawTestViewProps {
  onBack?: () => void;
}

export const TldrawTestView: React.FC<TldrawTestViewProps> = ({ onBack }) => {
  const [TldrawComponent, setTldrawComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import to support both installed npm module & runtime loading
    import('@tldraw/tldraw')
      .then((mod) => {
        setTldrawComponent(() => mod.Tldraw);
      })
      .catch((err) => {
        console.warn('Local @tldraw/tldraw not found yet, fallback loading...', err);
        // @ts-ignore
        import('https://esm.sh/@tldraw/tldraw@2.4.4?deps=react@19.0.0,react-dom@19.0.0')
          .then((mod) => {
            setTldrawComponent(() => mod.Tldraw);
          })
          .catch((e) => {
            setError('Failed to load tldraw module.');
          });
      });
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="size-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Layers className="size-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Tldraw Infinite Canvas Sandbox</h2>
            <p className="text-[10px] text-slate-400 font-medium">Test Sandbox for Moodboards, Sketching & Asset Drag-and-Drop</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3" />
            Interactive Tldraw 2.0 Engine
          </span>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 relative w-full h-full bg-slate-950 overflow-hidden">
        {TldrawComponent ? (
          <div className="w-full h-full relative tldraw-wrapper">
            <TldrawComponent persistenceKey="flow-studio-tldraw-sandbox" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <p className="text-xs font-bold text-rose-400 mb-1">{error}</p>
            <p className="text-[11px]">Please ensure @tldraw/tldraw is installed in package.json.</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold">Loading Tldraw Infinite Canvas Sandbox...</p>
          </div>
        )}
      </main>
    </div>
  );
};
