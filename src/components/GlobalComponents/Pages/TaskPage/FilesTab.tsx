import React, { useState } from 'react';
import { EmptyFileState } from '../../EmptyFileState';

interface FilesTabProps {
  onTabChange: (tab: 'tasks' | 'files' | 'notes') => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({ onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Mock state: toggle this to true to see the populated mock data
  const hasFiles = false;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-8">
          <button 
            onClick={() => onTabChange('tasks')}
            className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            Tasks
            <span className="bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full ml-1">12</span>
          </button>
          <button className="pb-4 text-sm font-bold text-accent border-b-2 border-accent relative flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">description</span>
            Files
          </button>
          <button 
            onClick={() => onTabChange('notes')}
            className="pb-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
            Notes
          </button>
        </div>
      </div>

      {!hasFiles || searchQuery ? (
        <div className="flex-1 min-h-[400px]">
          <EmptyFileState 
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>
      ) : (
        <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent outline-none transition-all" 
              placeholder="Search project files..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload File
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Files</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-rose-500">picture_as_pdf</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-accent transition-colors">brand_guide.pdf</h4>
              <p className="text-[10px] text-slate-500 mt-1">Updated 2h ago • 4.2 MB</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-amber-500">folder_zip</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-accent transition-colors">logo_pack.zip</h4>
              <p className="text-[10px] text-slate-500 mt-1">Updated Yesterday • 12.8 MB</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-4xl text-emerald-500">image</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-accent transition-colors">hero_illustration.png</h4>
              <p className="text-[10px] text-slate-500 mt-1">Updated Oct 18 • 2.1 MB</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">rocket_launch</span>
              Ready to Ship
            </h3>
            <a className="text-xs font-bold text-accent hover:underline" href="#">View All Finals →</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Date</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                        <span className="material-symbols-outlined text-[20px]">web_asset</span>
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Homepage_v4_Final.fig</span>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide">Approved</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">Figma File</td>
                  <td className="px-6 py-4 text-xs text-slate-500">12.4 MB</td>
                  <td className="px-6 py-4 text-xs text-slate-500">Oct 20, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-accent transition-colors" title="Open in location">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                        <span className="material-symbols-outlined text-[20px]">movie</span>
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Promo_Video_Export.mp4</span>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide">Approved</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">Video</td>
                  <td className="px-6 py-4 text-xs text-slate-500">48.2 MB</td>
                  <td className="px-6 py-4 text-xs text-slate-500">Oct 19, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-accent transition-colors" title="Open in location">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                        <span className="material-symbols-outlined text-[20px]">developer_board</span>
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Dev_Hand-off_Spec.pdf</span>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide">Approved</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">PDF Document</td>
                  <td className="px-6 py-4 text-xs text-slate-500">3.5 MB</td>
                  <td className="px-6 py-4 text-xs text-slate-500">Oct 18, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-accent transition-colors" title="Open in location">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">All Project Assets</h3>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Date</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-accent">description</span>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-accent transition-colors">Typography_Scales.fig</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">Figma File</td>
                  <td className="px-6 py-4 text-xs text-slate-500">1.4 MB</td>
                  <td className="px-6 py-4 text-xs text-slate-500">Oct 15, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-accent transition-colors" title="Open in location">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-accent">article</span>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-accent transition-colors">Feedback_Summary.docx</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">Document</td>
                  <td className="px-6 py-4 text-xs text-slate-500">452 KB</td>
                  <td className="px-6 py-4 text-xs text-slate-500">Oct 12, 2024</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-accent transition-colors" title="Open in location">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}
    </div>
  );
};
