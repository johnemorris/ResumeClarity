
import React, { useState, useMemo } from 'react';
import { rewriteBulletPoint } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import Tooltip from './Tooltip';

interface PremiumLabProps {
  jd: string;
  resume: string;
}

const PremiumLab: React.FC<PremiumLabProps> = ({ jd, resume }) => {
  const { isPro, triggerCheckout } = useUser();
  const [original, setOriginal] = useState('');
  const [keyword, setKeyword] = useState('');
  const [optimized, setOptimized] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Parse resume into surgical units (lines)
  const resumeLines = useMemo(() => {
    return resume
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5); // Filter out headers, empty lines, or artifacts
  }, [resume]);

  const handleRewrite = async () => {
    if (!isPro) {
      triggerCheckout("pro_24h");
      return;
    }
    if (!original || !keyword) return;
    setLoading(true);
    const result = await rewriteBulletPoint(original, keyword, jd);
    setOptimized(result);
    setLoading(false);
  };

  const selectLine = (line: string) => {
    setOriginal(line);
    setShowPicker(false);
    // Visual feedback hint for the user
    const textArea = document.getElementById('target-bullet-input');
    textArea?.classList.add('ring-4', 'ring-indigo-500/30');
    setTimeout(() => {
      textArea?.classList.remove('ring-4', 'ring-indigo-500/30');
    }, 1000);
  };

  return (
    <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl overflow-hidden relative border border-slate-800">
      {/* Premium Badge */}
      <div className="absolute top-8 right-8 bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
        Forensic Lab
      </div>

      {/* Bullet Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowPicker(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h4 className="text-3xl font-black text-slate-950 tracking-tight">Select Surgical Unit</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hover and click to pull a bullet from your source resume</p>
              </div>
              <button 
                onClick={() => setShowPicker(false)} 
                className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90 shadow-sm"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-white">
              {resumeLines.length > 0 ? (
                resumeLines.map((line, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectLine(line)}
                    className="w-full text-left p-8 rounded-[2rem] hover:bg-indigo-600 hover:text-white group transition-all duration-200 border border-transparent hover:border-indigo-400 shadow-sm hover:shadow-indigo-200/50 hover:-translate-y-1 relative"
                  >
                    <div className="flex gap-6 items-start">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white/20 flex items-center justify-center text-[11px] font-black shrink-0 transition-colors text-slate-400 group-hover:text-white border border-slate-100 group-hover:border-white/20">
                        {idx + 1}
                      </div>
                      <p className="text-base font-medium leading-relaxed text-slate-800 group-hover:text-white">
                        {line}
                      </p>
                    </div>
                    <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest">Inject into Lab</span>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                   <div className="text-4xl">🔎</div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No recognizable bullets found in source.</p>
                </div>
              )}
            </div>
            
            <div className="p-8 border-t border-slate-50 text-center bg-slate-50/30">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Source: Master Enclave Sync</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        <h3 className="text-4xl font-black mb-4 tracking-tight">Surgical Alignment Lab</h3>
        <p className="text-slate-400 text-lg font-medium mb-12 max-w-2xl">
          Don't just add keywords. Seamlessly weave them into your achievements using our achievement-oriented AI engine.
        </p>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Target Achievement (Current Bullet)</label>
                <button 
                  onClick={() => setShowPicker(true)}
                  className="group flex items-center gap-2.5 text-[9px] font-black text-white bg-slate-800 hover:bg-indigo-600 px-4 py-2 rounded-xl border border-slate-700 transition-all uppercase tracking-widest active:scale-95 shadow-lg"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:rotate-12 transition-transform"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Pick from Resume
                </button>
              </div>
              <textarea 
                id="target-bullet-input"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Select a bullet from your resume or paste a specific achievement line here..."
                className="w-full h-44 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-slate-700 transition-all font-mono leading-relaxed"
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Keyword to Integrate</label>
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Unit Testing with Jest & Enzyme"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-8 py-5 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-700"
              />
            </div>

            <button 
              onClick={handleRewrite}
              disabled={loading || !original || !keyword}
              className="w-full py-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] text-lg active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="uppercase tracking-widest text-sm">Synthesizing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                   <span>Perform Forensic Integration</span>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-indigo-600/5 rounded-[3rem] p-10 border border-indigo-500/10 flex flex-col min-h-[450px] relative">
            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Synthesis Result</label>
            
            {optimized ? (
              <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col">
                <div className="flex-1">
                  <div className="text-2xl font-black text-indigo-50 leading-tight italic decoration-indigo-500/30 underline-offset-8">
                     "{optimized}"
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        High-Density Match Ready
                      </div>
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">~18 Words</div>
                   </div>
                   
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(optimized);
                      const btn = document.getElementById('copy-lab-btn');
                      if (btn) btn.innerText = "COPIED TO CLIPBOARD";
                      setTimeout(() => { if (btn) btn.innerText = "COPY SYNTHESIS"; }, 2000);
                    }}
                    id="copy-lab-btn"
                    className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Copy Synthesis
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-4xl animate-[pulse_3s_infinite]">
                    🧪
                  </div>
                  <div className="absolute -top-2 -right-2 bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    !
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Ready for Synthesis</p>
                  <p className="text-xs font-medium text-slate-600 max-w-[200px] leading-relaxed">
                    Pick a bullet from your resume or paste one manually to begin <span className="text-indigo-400">forensic integration.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLab;
