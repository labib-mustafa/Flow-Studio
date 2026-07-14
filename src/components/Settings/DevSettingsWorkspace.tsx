import React, { useMemo } from 'react';
import { useDevStore, DevFlags, DevHiddenItem } from '../../stores/devStore';

export const DevSettingsWorkspace: React.FC = () => {
  const { 
    flags, 
    toggleFlag, 
    searchFilter, 
    setSearchFilter, 
    hiddenItemsRegistry,
    toggleHiddenItemForce 
  } = useDevStore();

  const handleToggle = (flagName: keyof DevFlags) => {
    toggleFlag(flagName);
  };

  const filteredRegistry = useMemo(() => {
    if (!searchFilter) return hiddenItemsRegistry;
    
    const lowerFilter = searchFilter.toLowerCase();
    const result: typeof hiddenItemsRegistry = {};
    
    for (const [category, items] of Object.entries(hiddenItemsRegistry)) {
      const typedItems = items as DevHiddenItem[];
      const filteredItems = typedItems.filter(item => 
        item.name.toLowerCase().includes(lowerFilter) || 
        category.toLowerCase().includes(lowerFilter)
      );
      
      if (filteredItems.length > 0) {
        result[category] = filteredItems;
      }
    }
    
    return result;
  }, [hiddenItemsRegistry, searchFilter]);

  return (
    <div className="flex flex-col h-full bg-canvas text-ink overflow-auto custom-scrollbar p-10 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[36px] font-semibold text-ink leading-tight tracking-[-1px] font-sans">
            Developer Workspace
          </h1>
          <p className="text-body mt-2 text-muted">
            Configure hidden components, debugging tools, and experimental features.
          </p>
        </div>

        {/* Global Flags */}
        <div className="bg-surface-card rounded-lg p-8 mb-10 shadow-sm border border-hairline relative">
          <h2 className="text-[22px] font-semibold tracking-[-0.3px] mb-6 text-ink">Global Flags</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-sm text-ink mb-1">Show Hidden Bounds</h3>
                <p className="text-body-sm text-muted">Draws dashed red borders around hidden triggers (opacity-0, invisible).</p>
              </div>
              <button 
                onClick={() => handleToggle('showHiddenButtons')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flags.showHiddenButtons ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags.showHiddenButtons ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="h-px bg-hairline-soft w-full" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-sm text-ink mb-1">Force Show Tooltips</h3>
                <p className="text-body-sm text-muted">Keeps all tooltips and infotips permanently rendered for layout testing.</p>
              </div>
              <button 
                onClick={() => handleToggle('forceShowTooltips')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flags.forceShowTooltips ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags.forceShowTooltips ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="h-px bg-hairline-soft w-full" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-sm text-ink mb-1">Disable Login</h3>
                <p className="text-body-sm text-muted">Bypasses the login screen completely and automatically authenticates.</p>
              </div>
              <button 
                onClick={() => handleToggle('disableLogin')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flags.disableLogin ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags.disableLogin ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="h-px bg-hairline-soft w-full" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-sm text-ink mb-1">Component Borders</h3>
                <p className="text-body-sm text-muted">Renders thin blue diagnostic outlines around major component wrapper bounds.</p>
              </div>
              <button 
                onClick={() => handleToggle('showComponentBorders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flags.showComponentBorders ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags.showComponentBorders ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="h-px bg-hairline-soft w-full" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-sm text-ink mb-1">Experimental Features</h3>
                <p className="text-body-sm text-muted">Alows access to modules flagged as under-construction or incomplete.</p>
              </div>
              <button 
                onClick={() => handleToggle('enableExperimentalFeatures')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flags.enableExperimentalFeatures ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags.enableExperimentalFeatures ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Items Tree View */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-ink">Hidden Items Registry</h2>
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search components..." 
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-hairline rounded-md text-sm outline-none focus:border-primary transition-colors bg-canvas text-ink"
              />
            </div>
          </div>
          
          {Object.keys(filteredRegistry).length === 0 ? (
            <div className="bg-surface-card rounded-lg p-10 text-center border border-hairline shadow-sm">
              <span className="material-symbols-outlined text-4xl text-muted-soft mb-2">find_in_page</span>
              <p className="text-muted text-body-md">No hidden items registered or matched your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredRegistry).map(([category, items]) => {
                const typedItems = items as DevHiddenItem[];
                return (
                <div key={category} className="bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-surface-soft px-4 py-3 border-b border-hairline flex items-center gap-2">
                    <span className="material-symbols-outlined text-muted text-[18px]">folder</span>
                    <h3 className="text-title-sm text-ink font-semibold">{category}</h3>
                    <span className="ml-auto bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
                      {typedItems.length} item{typedItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="divide-y divide-hairline">
                    {typedItems.map(item => (
                      <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-ink font-mono">{item.name}</p>
                          <p className="text-xs text-muted-soft mt-0.5">ID: {item.id}</p>
                        </div>
                        <button 
                          onClick={() => toggleHiddenItemForce(category, item.id)}
                          className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium flex items-center gap-1.5
                            ${item.isForced 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {item.isForced ? 'visibility' : 'visibility_off'}
                          </span>
                          {item.isForced ? 'Forced Visible' : 'Isolate'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
