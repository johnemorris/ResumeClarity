
import React, { useState } from 'react';
import { LearningPathway } from '../types';
import { getLearningPathway } from '../services/geminiService';

interface PathwayViewProps {
  pathways: LearningPathway[];
  onBack: () => void;
}

const PathwayView: React.FC<PathwayViewProps> = ({ pathways, onBack }) => {
  const [activePathways, setActivePathways] = useState<LearningPathway[]>(pathways);
  const [refreshingIds, setRefreshingIds] = useState<Record<number, boolean>>({});

  const refreshProject = async (index: number, skill: string) => {
    setRefreshingIds(prev => ({ ...prev, [index]: true }));
    try {
      const newPath = await getLearningPathway(skill);
      if (newPath) {
        const updated = [...activePathways];
        updated[index] = newPath;
        setActivePathways(updated);
      }
    } catch (err) {
      console.error("Failed to refresh project", err);
    } finally {
      setRefreshingIds(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="max-w-3xl space-y-4">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Scan Results
          </button>
          <h2 className="text-7xl font-black text-slate-950 tracking-tighter leading-[0.85] pt-4">
            Cultivate Your <br/> <span className="text-indigo-600">Competitive Edge.</span>
          </h2>
          <p className="text-slate-500 text-xl font-medium">
            Bridging technical gaps at high velocity. Boot-camp style builds, zero fluff.
          </p>
        </div>
        
        <div className="bg-slate-950 text-white px-10 py-8 rounded-[2.5rem] shadow-2xl flex items-center gap-6">
          <div className="text-4xl font-black text-indigo-400">{activePathways.length}</div>
          <div className="text-[10px] font-black uppercase tracking-widest leading-tight text-slate-400">
            Active <br/> Edge-Tracks
          </div>
        </div>
      </div>

      {/* Quest Grid */}
      <div className="grid gap-16">
        {activePathways.map((path, idx) => (
          <div key={idx} className={`bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row items-stretch transition-all duration-500 ${refreshingIds[idx] ? 'grayscale blur-sm pointer-events-none scale-95' : ''}`}>
            {/* Left Column: Context & Knowledge */}
            <div className="lg:w-2/5 p-12 md:p-16 bg-slate-50 border-r border-slate-100 flex flex-col gap-10">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                   <div className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Target: {path.skill}
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1.5 text-slate-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{path.timeEstimate}</span>
                     </div>
                     <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{path.difficulty}</span>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-950 italic tracking-tight leading-tight">"{path.projectIdea}"</h3>
                  <button 
                    onClick={() => refreshProject(idx, path.skill)}
                    className="group/skip flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                  >
                    <svg className="group-hover/skip:rotate-180 transition-transform duration-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                    Swap Project Idea
                  </button>
                </div>
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Recruiter Psychology</div>
                   <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                     {path.valueProposition}
                   </p>
                </div>
              </div>

              {/* Mastery Stack */}
              <div className="space-y-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Mastery Payload</div>
                <div className="grid gap-3">
                  {path.resources.map((res, rIdx) => (
                    <a 
                      key={rIdx}
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`group flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all hover:-translate-y-1 ${
                        res.type === 'Free' 
                        ? 'bg-emerald-50 border-emerald-100 hover:bg-white hover:border-emerald-500' 
                        : 'bg-indigo-50 border-indigo-100 hover:bg-white hover:border-indigo-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                          res.type === 'Free' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
                        }`}>
                          {res.type === 'Free' ? '⚡' : '💎'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={res.type === 'Free' ? 'text-emerald-600' : 'text-indigo-600'}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                <span className={`text-[9px] font-black uppercase ${res.type === 'Free' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                  {res.type === 'Free' ? 'FREE' : res.investmentLevel || '$$'}
                                </span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                <span className="text-[9px] font-bold tracking-tight">{res.duration}</span>
                            </div>
                          </div>
                          <div className="text-[13px] font-black text-slate-900 leading-tight mt-1">{res.name}</div>
                        </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: The Reward & Scripts */}
            <div className="flex-1 p-12 md:p-16 flex flex-col gap-12">
              {/* Authorized Bullet */}
              <div className="bg-emerald-50 border-2 border-emerald-200 border-dashed rounded-[3rem] p-10 space-y-6 relative overflow-hidden group/auth">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/auth:scale-110 transition-transform">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-1.006 3.42 3.42 0 014.438 0c.594.524 1.348.878 2.137 1.012a3.42 3.42 0 012.75 4.764c-.115.824.015 1.66.375 2.392a3.42 3.42 0 010 3.27c-.36.731-.49 1.567-.375 2.392a3.42 3.42 0 01-2.75 4.764 3.42 3.42 0 01-2.137 1.012 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-1.006 3.42 3.42 0 01-2.75-4.764 3.42 3.42 0 00-.375-2.392 3.42 3.42 0 010-3.27c.36-.731.49-1.567.375-2.392a3.42 3.42 0 012.75-4.764z"/></svg>
                </div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  The Upgrade (Post-Project Bullet)
                </div>
                <p className="text-3xl font-black text-emerald-950 leading-tight italic max-w-2xl">
                  "{path.futureResumeBullet}"
                </p>
                <button 
                  onClick={() => navigator.clipboard.writeText(path.futureResumeBullet)}
                  className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-600 hover:text-white px-6 py-3 rounded-xl border border-emerald-200 transition-all w-fit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  Copy Reward
                </button>
              </div>

              {/* Field Guide & Ammunition Combo */}
              <div className="grid md:grid-cols-5 gap-10 flex-1">
                {/* Book Box */}
                <div className="md:col-span-2 bg-slate-950 text-white rounded-[2.5rem] p-10 flex flex-col justify-between shadow-xl relative group/book overflow-hidden">
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Rapid Field Guide</div>
                    <div className="space-y-1">
                      <h5 className="text-2xl font-black italic tracking-tight leading-none">{path.fieldGuide?.title}</h5>
                      <p className="text-xs text-slate-500 font-bold">by {path.fieldGuide?.author}</p>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {path.fieldGuide?.whyItWorks}
                    </p>
                  </div>
                  <a 
                    href={path.fieldGuide?.amazonUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative z-10 mt-8 w-full py-4 bg-white/10 hover:bg-white text-white hover:text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    Quick-Read Reference <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                </div>

                {/* Interview Points */}
                <div className="md:col-span-3 space-y-8">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Interview Ammunition</div>
                  <div className="space-y-4">
                    {path.interviewTalkingPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex gap-5 items-start p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-indigo-100 transition-all group/li">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black group-hover/li:bg-indigo-600 group-hover/li:text-white transition-all shrink-0">
                          {pIdx + 1}
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-tight pt-1.5 italic">
                          "{point}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-20 border-t border-slate-200 text-center">
         <button 
           onClick={onBack}
           className="px-16 py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-2xl tracking-tight shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] hover:-translate-y-2 transition-all active:scale-95 flex items-center gap-4 mx-auto"
         >
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           Back to My Results
         </button>
      </div>
    </div>
  );
};

export default PathwayView;
