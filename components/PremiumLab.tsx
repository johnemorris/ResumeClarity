
import React, { useState } from 'react';
import { rewriteBulletPoint } from '../services/geminiService';
import { useUser } from '../context/UserContext';

interface PremiumLabProps {
  jd: string;
}

const PremiumLab: React.FC<PremiumLabProps> = ({ jd }) => {
  const { isPro, triggerCheckout } = useUser();
  const [original, setOriginal] = useState('');
  const [keyword, setKeyword] = useState('');
  const [optimized, setOptimized] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl overflow-hidden relative border border-slate-800">
      {/* Premium Badge */}
      <div className="absolute top-8 right-8 bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
        Forensic Lab
      </div>

      <div className="max-w-4xl">
        <h3 className="text-4xl font-black mb-4 tracking-tight">Surgical Alignment Lab</h3>
        <p className="text-slate-400 text-lg font-medium mb-12 max-w-2xl">
          Don't just add keywords. Seamlessly weave them into your achievements using our achievement-oriented AI engine.
        </p>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Target Achievement (Current Bullet)</label>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLab;
