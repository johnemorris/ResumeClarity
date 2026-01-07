
import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisSummary, KeywordCategory, MatchStatus, KeywordResult, SignificanceLevel, InterviewTrap, LearningPathway } from '../types';
import KeywordBadge from './KeywordBadge';
import { getInterviewTraps, getLearningPathway } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import Tooltip from './Tooltip';

interface AnalysisViewProps {
  analysis: AnalysisSummary;
  resume: string;
  jd: string;
  onViewPathways: (data: LearningPathway[]) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, resume, jd, onViewPathways }) => {
  const { isPro, triggerCheckout } = useUser();
  const [activeTab, setActiveTab] = useState<'all' | 'missing' | 'present' | 'phrases'>('all');
  const [displayMode, setDisplayMode] = useState<'table' | 'document'>('table');
  const [traps, setTraps] = useState<InterviewTrap[]>([]);
  const [loadingTraps, setLoadingTraps] = useState(false);
  const [loadingPathways, setLoadingPathways] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [freePreviewIds, setFreePreviewIds] = useState<string[]>([]);
  const [activeFixingSkill, setActiveFixingSkill] = useState<string | null>(null);

  const jdHash = jd.length + jd.substring(0, 50);

  useEffect(() => {
    if (isPro) return;
    const storageKey = `clarify_free_preview_${jdHash}`;
    const savedPreview = localStorage.getItem(storageKey);
    if (savedPreview) {
      setFreePreviewIds(JSON.parse(savedPreview));
    } else {
      const missingOnes = analysis.results
        .filter(r => r.status === MatchStatus.MISSING)
        .slice(0, 3)
        .map(r => r.text);
      localStorage.setItem(storageKey, JSON.stringify(missingOnes));
      setFreePreviewIds(missingOnes);
    }
  }, [jdHash, isPro, analysis.results]);

  const fetchTraps = async () => {
    if (!isPro) {
      triggerCheckout("pro_24h");
      return;
    }
    setLoadingTraps(true);
    const missing = analysis.results
      .filter(r => r.status === MatchStatus.MISSING && r.significance === SignificanceLevel.CRITICAL)
      .map(r => r.text);
    const result = await getInterviewTraps(missing, jd);
    setTraps(result);
    setLoadingTraps(false);
  };

  const fetchSpecificPathway = async (skill: string) => {
    setActiveFixingSkill(skill);
    try {
      const path = await getLearningPathway(skill);
      if (path) {
        onViewPathways([path]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveFixingSkill(null);
    }
  };

  const fetchPathways = async () => {
    setLoadingPathways(true);
    const topMissing = analysis.results
      .filter(r => r.status === MatchStatus.MISSING)
      .slice(0, 2);
    
    try {
      const results = await Promise.all(topMissing.map(m => getLearningPathway(m.text)));
      const cleanResults = results.filter(Boolean) as LearningPathway[];
      onViewPathways(cleanResults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPathways(false);
    }
  };

  const filteredResults = analysis.results.filter(r => {
    if (activeTab === 'missing') return r.status === MatchStatus.MISSING;
    if (activeTab === 'present') return r.status === MatchStatus.PRESENT;
    if (activeTab === 'phrases') return r.category === KeywordCategory.PHRASE;
    return true;
  });

  const isLocked = (res: KeywordResult) => {
    if (isPro) return false;
    if (res.status === MatchStatus.PRESENT) return false;
    return !freePreviewIds.includes(res.text);
  };

  const highlightedResume = useMemo(() => {
    let text = resume;
    const sortedResults = [...analysis.results].sort((a, b) => b.text.length - a.text.length);
    const placeholders: Record<string, { content: string, status: MatchStatus }> = {};
    
    sortedResults.forEach((res, i) => {
      if (res.status === MatchStatus.PRESENT) {
        const regex = new RegExp(`\\b${res.text}\\b`, 'gi');
        text = text.replace(regex, (match) => {
          const id = `__MATCH_${i}__`;
          placeholders[id] = { content: match, status: MatchStatus.PRESENT };
          return id;
        });
      }
    });

    analysis.weakWordsFound.forEach((m, i) => {
      const regex = new RegExp(`\\b${m.found}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        const id = `__WEAK_${i}__`;
        placeholders[id] = { content: match, status: MatchStatus.MISSING };
        return id;
      });
    });

    return text.split(/(__[A-Z]+_\d+__)/g).map((part, idx) => {
      if (placeholders[part]) {
        const p = placeholders[part];
        const isWeak = part.startsWith('__WEAK');
        return (
          <span 
            key={idx} 
            className={`px-1 rounded-sm font-bold transition-all cursor-help ${
              isWeak 
              ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-400' 
              : 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-400'
            }`}
          >
            {p.content}
          </span>
        );
      }
      return part;
    });
  }, [resume, analysis.results, analysis.weakWordsFound]);

  const missingCriticalKeywords = useMemo(() => {
    return analysis.results
      .filter(r => r.status === MatchStatus.MISSING && r.significance === SignificanceLevel.CRITICAL)
      .slice(0, 3);
  }, [analysis.results]);

  return (
    <div className="space-y-12">
      {/* High-Level Score Dashboard */}
      <div className="relative bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 md:p-16 flex flex-col lg:flex-row items-stretch gap-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[160px] -z-10"></div>
        
        <div className="flex-1 flex flex-col md:flex-row items-center gap-14">
          <div className="relative text-center md:text-left min-w-[320px]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Overall Skill Match</h2>
            <div className={`text-[10rem] leading-[0.8] font-black tracking-tighter ${analysis.score > 75 ? 'text-emerald-600' : analysis.score > 40 ? 'text-amber-600' : 'text-rose-600'} drop-shadow-sm`}>
              {analysis.score}<span className="text-4xl text-slate-200 -ml-2 font-bold">%</span>
            </div>
            <p className="mt-8 text-sm font-bold text-slate-500 max-w-[280px]">
               You matched <span className="text-slate-900">{analysis.matchedKeywords}</span> of <span className="text-slate-900">{analysis.totalJDKeywords}</span> key requirements.
            </p>
          </div>
          
          <div className="w-px h-full bg-slate-100 hidden sm:block opacity-50"></div>
          
          <div className="flex-1 space-y-6 w-full max-w-sm">
             {[
               { label: 'Core Technical Skills', val: analysis.calculationBreakdown.hardSkillsScore, tip: 'Tools, languages, and hard technologies.' },
               { label: 'Professional Qualities', val: analysis.calculationBreakdown.softSignalsScore, tip: 'Behavioral signals and soft skills.' },
               { label: 'Industry Language', val: analysis.calculationBreakdown.phrasesScore, tip: 'Multi-word terminology and methodologies.' }
             ].map((cat, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex justify-between items-end">
                    <Tooltip content={cat.tip}>
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-help border-b border-dotted border-slate-300">{cat.label}</div>
                    </Tooltip>
                    <div className="text-lg font-black text-slate-900">{cat.val}%</div>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${cat.val > 75 ? 'bg-emerald-500' : cat.val > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${cat.val}%` }}></div>
                 </div>
               </div>
             ))}
          </div>
        </div>
        
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="flex-1 bg-slate-950 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={fetchTraps}>
            <div className="relative z-10 space-y-2">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-300">Defense</div>
              <div className="text-xl font-black leading-tight">{loadingTraps ? 'Calculating...' : 'Anticipate Traps'}</div>
              <p className="text-indigo-400 text-[10px] font-bold leading-relaxed">Handling missing gaps.</p>
            </div>
          </div>
          
          <div className="flex-1 bg-indigo-600 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={fetchPathways}>
             <div className="relative z-10 space-y-2">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-200">The Edge</div>
                <div className="text-xl font-black leading-tight">{loadingPathways ? 'Loading...' : 'Weekend Build'}</div>
                <p className="text-indigo-100 text-[10px] font-bold leading-relaxed">Fix gaps with mini projects.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Traps Display */}
      {traps.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
          {traps.map((trap, idx) => (
            <div key={idx} className="bg-white border-2 border-slate-900 rounded-[2.5rem] p-10 space-y-6 shadow-xl relative overflow-hidden">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Trap Question</div>
                <h4 className="text-2xl font-black text-slate-900 leading-tight italic">"{trap.question}"</h4>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100">
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Pivot Strategy</div>
                <p className="text-sm font-black text-emerald-800 leading-relaxed">{trap.suggestedAnswer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Forensic Table / Document View Toggle */}
      <div className={`bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 transition-all duration-700 ${showHeatmap ? 'ring-4 ring-rose-100' : ''}`}>
        <div className="border-b border-slate-100 bg-slate-50/50 rounded-t-[2.5rem]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex gap-1 p-1 bg-slate-200/40 rounded-xl">
              {(['table', 'document'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    displayMode === mode 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'table' ? 'Keyword Table' : 'Forensic Document'}
                </button>
              ))}
            </div>

            <Tooltip 
              content="Forensic visualization mode. Highlights 'hot' critical gaps with pulsing red dots and emerald green for high-density matches."
              position="top"
            >
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all flex items-center gap-2 ${showHeatmap ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showHeatmap ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
                {showHeatmap ? 'Scan On' : 'Thermal Scan'}
              </button>
            </Tooltip>
          </div>
        </div>

        {displayMode === 'table' ? (
          <div className="overflow-x-auto scrollbar-hide rounded-b-[2.5rem]">
            <table className="w-full text-left border-collapse min-w-[800px] table-fixed">
              <thead>
                <tr className="bg-white text-slate-400 text-[9px] uppercase tracking-[0.3em] font-black border-b border-slate-100">
                  <th className="px-8 py-4 w-[35%]">Industry Term</th>
                  <th className="px-4 py-4 w-[15%]">Type</th>
                  <th className="px-4 py-4 w-[15%] text-center">Priority</th>
                  <th className="px-4 py-4 w-[15%] text-center">Density</th>
                  <th className="px-8 py-4 w-[20%] text-right whitespace-nowrap">Recovery / Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResults.map((res, i) => {
                  const locked = isLocked(res);
                  const isCritical = res.significance === SignificanceLevel.CRITICAL;
                  const isMissing = res.status === MatchStatus.MISSING;
                  const isFixingThis = activeFixingSkill === res.text;
                  
                  return (
                    <tr key={i} className={`group transition-all duration-300 ${showHeatmap ? (isMissing ? (isCritical ? "bg-rose-50/70" : "bg-rose-50/30") : "bg-emerald-50/20") : ""} hover:bg-slate-50/80`}>
                      <td className="px-8 py-5">
                        <div className="relative flex items-center gap-3">
                          {showHeatmap && isCritical && isMissing && (
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></div>
                          )}
                          <span className={`text-base font-black tracking-tight leading-snug break-words ${locked ? 'blur-[10px] opacity-10 select-none' : 'text-slate-900'}`}>
                            {locked ? 'XXXXXXXXXXXX' : res.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5"><KeywordBadge type={res.category} size="sm" /></td>
                      <td className="px-4 py-5 text-center"><KeywordBadge type={res.significance} size="sm" /></td>
                      <td className="px-4 py-5 text-center">
                         <div className={`inline-flex items-center gap-2 text-[10px] font-black ${locked ? 'opacity-0' : ''}`}>
                            <span className="text-slate-900">{res.countInJD}</span>
                            <span className="text-slate-200">/</span>
                            <span className={res.countInResume > 0 ? 'text-emerald-500' : 'text-slate-300'}>{res.countInResume}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {locked ? (
                          <button onClick={() => triggerCheckout("pro_24h")} className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">Unlock</button>
                        ) : isMissing ? (
                          <button 
                            onClick={() => fetchSpecificPathway(res.text)}
                            disabled={!!activeFixingSkill}
                            className={`px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 ml-auto ${isFixingThis ? 'animate-pulse opacity-50' : ''}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            Fix Gap
                          </button>
                        ) : (
                          <KeywordBadge type={res.status} size="sm" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 md:p-16 bg-slate-50 rounded-b-[2.5rem] overflow-hidden">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900">Forensic Markup</h4>
                  <p className="text-xs text-slate-500 font-medium">Visualizing hits and weak spots directly on your source document.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-[2rem] p-12 md:p-16 shadow-xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                
                {/* Original Content */}
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
                    {highlightedResume}
                  </div>
                </div>

                {/* Forensic Upgrade: Suggested Personal Projects Section */}
                {missingCriticalKeywords.length > 0 && (
                  <div className="mt-12 pt-10 border-t-2 border-dashed border-slate-100 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-6">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-2">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                         Forensic Upgrade Required
                       </span>
                    </div>

                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                       <div className="space-y-4">
                          <h5 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Personal Projects (New Section)</h5>
                          <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                            Inject this section to prove initiative on missing critical skills. Demonstrating personal projects outside of your main job role signals a growth mindset to recruiters.
                          </p>
                       </div>

                       <div className="grid gap-6">
                          {missingCriticalKeywords.map((res, i) => (
                            <div key={i} className="group relative bg-indigo-50/20 p-8 rounded-2xl border border-indigo-100/50 hover:bg-indigo-50 transition-all border-l-4 border-l-indigo-400">
                               <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Skill: {res.text}</span>
                                     <span className="text-[13px] font-black text-slate-900 uppercase italic">Implementation Placeholder</span>
                                  </div>
                                  <div className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[8px] font-black text-indigo-600 uppercase">Proactive Fix</div>
                               </div>
                               <div className="bg-white/80 p-4 rounded-xl border border-indigo-50 shadow-sm mb-4">
                                  <p className="text-xs font-medium text-indigo-700 italic leading-relaxed">
                                     "Developed a technical proof-of-concept utilizing <span className="font-bold underline">{res.text}</span> to solve [Specific Problem], demonstrating competency in [Technical Context]."
                                  </p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => fetchSpecificPathway(res.text)}
                                    className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 transition-all shadow-sm"
                                  >
                                    View Full Learning Track
                                  </button>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Resolves {res.significanceReason}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                       
                       <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between gap-6">
                          <p className="text-[11px] font-medium leading-relaxed italic text-slate-300 max-w-lg">
                            "Including personal projects specifically for skills you lack in your day-job is the fastest way to bridge seniority gaps in the eyes of a technical hiring manager."
                          </p>
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expert Tip</div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
