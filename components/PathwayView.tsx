
import React, { useState } from 'react';
import { LearningPathway } from '../types';
import { getLearningPathway } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import Tooltip from './Tooltip';

interface PathwayViewProps {
  pathways: LearningPathway[];
  onBack: () => void;
}

const PathwayView: React.FC<PathwayViewProps> = ({ pathways, onBack }) => {
  const { isPro, triggerCheckout } = useUser();
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

  const copySectionHeader = () => {
    navigator.clipboard.writeText("Applied Technical Projects");
    alert("Section header copied!");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to analysis</span>
          </button>
          <h2 className="text-4xl font-bold text-slate-950 tracking-tight leading-tight">
            Skill <span className="text-indigo-600">Growth Plan</span>
          </h2>
          <p className="text-slate-500 text-base font-medium">
            Strategic projects and resources to bridge your technical gaps.
          </p>
        </div>
        
        <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="text-2xl font-bold text-indigo-600">{activePathways.length}</div>
          <div className="text-[9px] font-black uppercase tracking-widest leading-tight text-slate-400">
            Missing <br/> Gaps Found
          </div>
        </div>
      </div>

      {/* Quest Grid */}
      <div className="grid gap-12">
        {activePathways.map((path, idx) => (
          <div key={idx} className={`bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col items-stretch transition-all duration-500 ${refreshingIds[idx] ? 'grayscale blur-sm pointer-events-none scale-95' : ''}`}>
            
            {/* Top Reward Bar - The "Hero" Bullet Point & Section Preview */}
            <div className="w-full bg-slate-50 border-b border-slate-200 p-8 md:p-12 relative overflow-hidden">
                <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
                   <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                          Resume Strategy
                        </div>
                        <h3 className="text-2xl font-bold text-slate-950 tracking-tight">
                          Showcase as <span className="text-indigo-600">Applied Knowledge</span>
                        </h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
                          Bridge the gap by adding an <span className="text-slate-900 font-bold">Applied Projects</span> section. It demonstrates proactive learning to recruiters.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Tooltip content="Copy 'Applied Technical Projects' as a new section header.">
                          <button 
                            onClick={copySectionHeader}
                            className="flex items-center gap-2.5 text-[10px] font-black text-white bg-slate-900 uppercase tracking-widest hover:bg-indigo-600 px-5 py-3 rounded-xl transition-all active:scale-95"
                          >
                            Copy Section Header
                          </button>
                        </Tooltip>
                        <Tooltip content="Copy the suggested bullet point.">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(path.futureResumeBullet || "");
                              alert("Bullet copied!");
                            }}
                            className="flex items-center gap-2.5 text-[10px] font-black text-indigo-600 bg-white uppercase tracking-widest hover:bg-indigo-50 px-5 py-3 rounded-xl transition-all active:scale-95 border border-indigo-100"
                          >
                            Copy Bullet Point
                          </button>
                        </Tooltip>
                      </div>
                   </div>

                   {/* Resume Snippet Preview - Slightly more muted */}
                   <div className="w-full lg:w-[360px] bg-white rounded-xl shadow-lg border border-slate-200 p-6 relative">
                      <div className="absolute top-0 right-0 -mt-2.5 -mr-2.5 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200">
                        Visual Preview
                      </div>
                      <div className="space-y-4">
                        <div className="h-1 w-2/3 bg-slate-50 rounded-full"></div>
                        
                        <div className="pt-2 space-y-3">
                           <div className="text-[9px] font-black text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1">Applied Projects</div>
                           <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-slate-900">{path.projectTitle || "Implementation"}</span>
                                <span className="text-[8px] font-bold text-slate-400">Current</span>
                              </div>
                              <div className="flex gap-2 bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/50">
                                <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0 mt-1.5"></div>
                                <p className="text-[9px] font-medium leading-relaxed text-slate-600">
                                  {path.futureResumeBullet || "Project details coming soon..."}
                                </p>
                              </div>
                           </div>
                        </div>
                        <div className="h-1 w-1/2 bg-slate-50 rounded-full"></div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch">
                {/* Left Column: Context & Knowledge */}
                <div className="lg:w-[45%] p-8 md:p-10 bg-white border-r border-slate-100 flex flex-col gap-8">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                       <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         Skill: {path.skill}
                       </div>
                       <div className="flex items-center gap-3 text-slate-400">
                         <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <span className="text-[9px] font-black uppercase tracking-widest">{path.timeEstimate || "2-4 hours"}</span>
                         </div>
                         <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{path.difficulty || "Intermediate"}</span>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Learning Sprint</div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">"{path.projectIdea || "Generating strategy..."}"</h3>
                      <button 
                        onClick={() => refreshProject(idx, path.skill)}
                        className="group/skip flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                      >
                        <svg className="group-hover/skip:rotate-180 transition-transform duration-500" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                        Swap Concept
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Recruiter Perspective</div>
                       <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                         {path.valueProposition || "Building technical authority..."}
                       </p>
                    </div>
                  </div>

                  {/* Mastery Stack - Muted and refined */}
                  <div className="space-y-4 relative">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Curated Learning Stack</div>
                    
                    {!isPro && (
                      <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-slate-200 shadow-lg mt-8">
                         <div className="text-2xl mb-2 text-indigo-600">💎</div>
                         <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Stack Locked</div>
                         <p className="text-[10px] font-bold text-slate-500 leading-tight mb-4 max-w-[160px] mx-auto">
                           Unlock the hand-picked resources to master this skill.
                         </p>
                         <button 
                          onClick={() => triggerCheckout("pro_24h")}
                          className="px-5 py-2.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-indigo-700 transition-all"
                         >
                           Unlock
                         </button>
                      </div>
                    )}

                    <div className={`grid gap-2 transition-all duration-700 ${!isPro ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                      {(path.resources || []).map((res, rIdx) => (
                        <a 
                          key={rIdx}
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              res.type === 'Free' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
                            }`}>
                              {res.type === 'Free' ? '⚡' : '💎'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-black uppercase ${res.type === 'Free' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                  {res.type === 'Free' ? 'FREE' : res.investmentLevel || '$$'}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                <span className="text-[8px] font-bold text-slate-400">{res.duration || "Self-paced"}</span>
                              </div>
                              <div className="text-xs font-bold text-slate-900 mt-0.5">{res.name}</div>
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Scripts & Books */}
                <div className="flex-1 p-8 md:p-10 flex flex-col gap-10 bg-white">
                  <div className="grid gap-10">
                    {/* Interview Points - More prominent than the book */}
                    <div className="space-y-6">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interview Talking Points</div>
                      <div className="grid gap-3">
                        {(path.interviewTalkingPoints || []).map((point, pIdx) => (
                          <div key={pIdx} className="flex gap-4 items-start p-5 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-all group/li">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[8px] font-black group-hover/li:bg-indigo-600 group-hover/li:text-white transition-all shrink-0">
                              {pIdx + 1}
                            </div>
                            <p className="text-[13px] font-medium text-slate-700 leading-tight pt-1">
                              "{point}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Book Box - Smaller and more integrated */}
                    <div className="bg-slate-950 text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Industry Field Guide</div>
                        <div className="space-y-1">
                          <h5 className="text-lg font-bold italic tracking-tight leading-tight">{path.fieldGuide?.title || "Recommended Reading"}</h5>
                          <p className="text-[10px] text-slate-400 font-bold">by {path.fieldGuide?.author || "Expert Source"}</p>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                          {path.fieldGuide?.whyItWorks || "Master the theoretical foundations of this core requirement."}
                        </p>
                      </div>
                      <a 
                        href={path.fieldGuide?.amazonUrl || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative z-10 mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        Find Field Guide <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-12 border-t border-slate-200 flex justify-center pb-20">
         <button 
           onClick={onBack}
           className="px-8 py-4 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
         >
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
           Back to My Results
         </button>
      </div>
    </div>
  );
};

export default PathwayView;
