
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
      .filter(line => line.length > 5); // Filter out headers or empty space
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowPicker(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Select Surgical Unit</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hover and click the bullet you want to optimize</p>
              </div>
              <button onClick={() => setShowPicker(false)} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {resumeLines.map((line, idx) => (
                <button
                  key={idx}
                  onClick={() => selectLine(line)}
                  className="w-full text-left p-6 rounded-2xl hover:bg-indigo-600 hover:text-white group transition-all duration-200 border border-transparent hover:border-indigo-400 shadow-sm hover:shadow-indigo-200/50 hover:-translate-y-0.5"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 transition-colors text-slate-400 group-hover:text-white">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-700 group-hover:text-white">
                      {line}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 text-center">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">End of Source Data</span>
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
                  className="text-[9px] font-black text-white bg-slate-800 hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95 shadow-lg"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Pick from Resume
                </button>
              </div>
              <textarea 
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="e.g. Led a team to build a new dashboard using React..."
                className="w-full h-40 bg-slate-900 border-2 border-slate-800 rounded-[2rem] p-8 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-slate-600 transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Keyword to Integrate</label>
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Unit Testing with Jest"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-8 py-5 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleRewrite}
              disabled={loading || !original || !keyword}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl text-lg active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Running AI Synthesis...</span>
                </div>
              ) : 'Perform Forensic Integration'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-indigo-600/10 rounded-[2.5rem] p-10 border border-indigo-500/20 flex flex-col min-h-[400px]">
            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Synthesis Result</label>
            {optimized ? (
              <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-2xl font-black text-indigo-50 leading-tight italic">
                   "{optimized}"
                </div>
                <div className="space-y-4 pt-4 border-t border-indigo-500/10">
                   <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                     Optimized for Recruiter Skim
                   </div>
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(optimized);
                      const btn = document.getElementById('copy-btn');
                      if (btn) btn.innerText = "COPIED!";
                      setTimeout(() => { if (btn) btn.innerText = "COPY TO CLIPBOARD"; }, 2000);
                    }}
                    id="copy-btn"
                    className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
                   >
                    Copy to Clipboard
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-2xl">⚡</div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Ready for Synthesis</p>
                <p className="text-[10px] font-medium text-slate-500 max-w-[150px]">Select a bullet from your resume to begin surgical matching.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLab;
