
import React from 'react';
import { ImpactMetric } from '../types';

interface ImpactAnalyzerProps {
  metrics: ImpactMetric[];
  score: number;
}

const ImpactAnalyzer: React.FC<ImpactAnalyzerProps> = ({ metrics, score }) => {
  return (
    <div className="bg-white rounded-[3.5rem] p-12 md:p-16 border border-slate-100 shadow-2xl overflow-hidden relative">
      <div className="absolute top-8 right-8 bg-indigo-100 text-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
        Resume Power Scan
      </div>

      <div className="flex flex-col lg:flex-row gap-16 items-center">
        <div className="lg:w-1/3 text-center lg:text-left space-y-6">
           <h3 className="text-4xl font-black text-slate-900 tracking-tight">Writing Confidence</h3>
           <p className="text-slate-500 text-lg font-medium leading-relaxed">
             Recruiters equate "Power Verbs" with leadership. We detected words in your resume that sound passive and suggested high-impact replacements used by top 1% candidates.
           </p>
           <div className="pt-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Strength Score</div>
              <div className={`text-[8rem] leading-[0.8] font-black ${score > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {score}<span className="text-2xl text-slate-200 font-bold ml-1">/100</span>
              </div>
           </div>
        </div>

        <div className="flex-1 w-full relative">
           <div className="absolute inset-0 bg-slate-50/50 rounded-[2.5rem] -z-10 rotate-1"></div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {metrics.length > 0 ? (
                metrics.map((m, i) => (
                  <div key={i} className="group p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-500">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Passively Stated</span>
                           <span className="text-sm font-black text-rose-400 uppercase tracking-tighter line-through">{m.found}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[8px] font-black text-emerald-600 uppercase mb-1">The Power Version</span>
                           <span className="text-sm font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-xl">{m.suggested}</span>
                        </div>
                     </div>
                     <p className="text-xs text-slate-400 font-medium italic leading-relaxed pt-4 border-t border-slate-50">
                        Try using <span className="text-slate-900 font-black">"{m.suggested}"</span> to sound more like a decisive leader who owns their results.
                     </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-slate-200 gap-6">
                   <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   </div>
                   <div className="text-center">
                      <span className="block font-black text-2xl text-slate-400 mb-2">Maximum Authority Detected</span>
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">No passive verbs found. Your resume speaks with high confidence.</span>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactAnalyzer;
