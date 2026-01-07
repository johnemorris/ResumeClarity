
import React, { useState } from 'react';
import { ResumeProfile } from '../types';
import Tooltip from './Tooltip';

interface ResumeSelectorProps {
  profiles: ResumeProfile[];
  currentId: string;
  onSelect: (id: string) => void;
  onSave: (name: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({ profiles, currentId, onSelect, onSave, isPro, onUpgrade }) => {
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName);
    setIsNaming(false);
    setNewName('');
  };

  const activeProfile = profiles.find(p => p.id === currentId);

  return (
    <div className="flex items-center gap-3 mb-4 px-2 overflow-x-auto no-scrollbar pb-2">
      <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
        <select 
          value={currentId}
          onChange={(e) => onSelect(e.target.value)}
          className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none px-3 py-1 cursor-pointer min-w-[140px]"
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!isNaming ? (
        <Tooltip content={!isPro && profiles.length >= 1 ? "Free tier is limited to 1 saved resume. Upgrade to Pro to manage multiple versions." : "Save current text as a new profile."}>
          <button 
            onClick={() => (!isPro && profiles.length >= 1) ? onUpgrade() : setIsNaming(true)}
            className="h-10 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            {!isPro && profiles.length >= 1 ? 'Unlock Slots' : 'Save Version'}
          </button>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
          <input 
            autoFocus
            type="text"
            placeholder="Name (e.g. Sales Role)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="h-10 px-4 bg-white border-2 border-indigo-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-48"
          />
          <button 
            onClick={handleSave}
            className="h-10 px-4 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl"
          >
            OK
          </button>
          <button 
            onClick={() => setIsNaming(false)}
            className="h-10 px-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-xl"
          >
            Cancel
          </button>
        </div>
      )}

      {activeProfile && (
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-auto hidden sm:block">
          Auto-saved {new Date(activeProfile.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};

export default ResumeSelector;
