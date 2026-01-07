
import React, { useState, useRef, useEffect } from 'react';
import { ResumeProfile } from '../types';

interface ResumeSelectorProps {
  profiles: ResumeProfile[];
  currentId: string;
  onSelect: (id: string) => void;
  onSave: (name: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({ profiles, currentId, onSelect, onSave, isPro, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = profiles.find(p => p.id === currentId);
  const hasLimit = !isPro && profiles.length >= 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsNaming(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName);
    setIsNaming(false);
    setNewName('');
    setIsOpen(false);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  const triggerAction = (type: 'unlock' | 'save') => {
    if (type === 'unlock') {
      onUpgrade();
      setIsOpen(false);
    } else {
      setIsNaming(true);
      setIsOpen(false); // Close the list when opening naming input
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 px-2" ref={dropdownRef}>
      <div className="flex items-center gap-3 relative">
        {!isNaming ? (
          <div className="relative">
            {/* Trigger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-4 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all min-w-[200px] text-left group"
            >
              <div className="flex-1 flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Active Version</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 truncate">
                  {activeProfile?.name || 'Select Resume'}
                </span>
              </div>
              <div className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </button>

            {/* Custom Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3">Saved Versions</span>
                </div>
                
                <div className="max-h-60 overflow-y-auto py-2">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className={`w-full text-left px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-between group/item ${
                        p.id === currentId ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.name}
                      {p.id === currentId && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                  {hasLimit ? (
                    <button
                      onClick={() => triggerAction('unlock')}
                      className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-white rounded-xl transition-all flex items-center gap-3 group"
                    >
                      <span className="text-lg group-hover:scale-125 transition-transform">✨</span>
                      Unlock additional saves
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerAction('save')}
                      className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-white rounded-xl transition-all flex items-center gap-3 group"
                    >
                      <span className="text-lg group-hover:scale-125 transition-transform">+</span>
                      Save as new version
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300 bg-white p-1 rounded-2xl border-2 border-indigo-100 shadow-xl">
            <input 
              autoFocus
              type="text"
              placeholder="Name version..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="h-10 px-5 bg-transparent text-[11px] font-black uppercase tracking-widest outline-none w-48 text-slate-900"
            />
            <button 
              onClick={handleSave}
              className="h-10 px-6 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Confirm
            </button>
            <button 
              onClick={() => { setIsNaming(false); setIsOpen(false); }}
              className="h-10 px-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {activeProfile && (
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] hidden sm:block">
            Last Synced
          </span>
          <span className="text-[10px] font-bold text-slate-400 hidden sm:block">
            {new Date(activeProfile.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ResumeSelector;
