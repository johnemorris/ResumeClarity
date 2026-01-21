
import React from 'react';
import { ModernitySignal } from '../types';

interface ModernityScanProps {
  score: number;
  signals: ModernitySignal[];
  advice: string;
}

const ModernityScan: React.FC<ModernityScanProps> = ({ score, signals, advice }) => {
  return (
    <div className="bg-slate-950 rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl overflow-hidden relative border border-slate-800">
      <div className="absolute top-8 right-8 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
        Modernity Guard v1.0
      </div>

      <div className="flex flex-col lg:flex-row gap-16 items-start">
        <div className="lg:w-1/3 space-y-8">
           <div className="space-y-4">
              <h3 className="text-4xl font-black tracking-tight leading-none">Era Alignment</h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Our "Anti-Bias" engine detects keywords that might inadvertently anchor your resume to a previous era.
              </p>
           </div>
           
           <div className="pt-6">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">2026 Market Readiness</div>
              <div className={`text-[8rem] leading-[0.8] font-black ${score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {score}<span className="text-2xl text-slate-600 font-bold ml-1">%</span>
              </div>
           </div>

           <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Expert Modernization Strategy</div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                "{advice}"
              </p>
           </div>
        </div>

        <div className="flex-1 w-full space-y-6">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Detected Temporal Anchors</div>
           
           <div className="grid gap-4">
              {signals.length > 0 ? (
                signals.map((s, i) => (
                  <div key={i} className="group p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-amber-500/50 hover:bg-white/[0.07] transition-all duration-500 relative overflow-hidden">
                     {/* Risk Level Badge */}
                     <div className="absolute top-4 right-8">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          s.riskLevel === 'High' ? 'bg-rose-500/20 text-rose-400' : 
                          s.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {s.riskLevel} Disclosure Risk
                        </span>
                     </div>

                     <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-6">
                        <div className="flex-1 space-y-1">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.type}</span>
                           <div className="text-xl font-black text-slate-300 line-through decoration-rose-500/50 underline-offset-4">{s.signal}</div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-600 shrink-0">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>

                        <div className="flex-1 space-y-1 text-right sm:text-left">
                           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">2026 Standard</span>
                           <div className="text-xl font-black text-emerald-400 tracking-tight">{s.modernEquivalent}</div>
                        </div>
                     </div>
                     
                     <div className="pt-6 border-t border-white/5">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                          <span className="text-indigo-400 font-black uppercase text-[10px] mr-2">Why?</span>
                          {s.suggestion}
                        </p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-700 text-center space-y-4">
                   <div className="w-16 h-16 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-3xl">✨</div>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Zero Legacy Anchors Detected</p>
                   <p className="text-xs text-slate-600 max-w-xs">Your resume is perfectly aligned with contemporary market terminology.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ModernityScan;
