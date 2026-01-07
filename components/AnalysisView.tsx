
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

  const scoreColor = (score: number) => {
    if (score > 75) return 'text-emerald-600';
    if (score > 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const barColor = (score: number) => {
    if (score > 75) return 'bg-emerald-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const isLocked = (res: KeywordResult) => {
    if (isPro) return false;
    if (res.status === MatchStatus.PRESENT) return false;
    return !freePreviewIds.includes(res.text);
  };

  // Logic to highlight the resume text
  const highlightedResume = useMemo(() => {
    let text = resume;
    const sortedResults = [...analysis.results].sort((a, b) => b.text.length - a.text.length);
    
    // We replace with placeholders first to avoid nested replacements
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

    // Handle weak words from impact analysis if available
    analysis.weakWordsFound.forEach((m, i) => {
      const regex = new RegExp(`\\b${m.found}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        const id = `__WEAK_${i}__`;
        placeholders[id] = { content: match, status: MatchStatus.MISSING }; // Mark as 'weak'/yellow via CSS
        return id;
      });
    });

    // Split and rebuild with React components
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

  return (
    <div className="space-y-12">
      {/* High-Level Score Dashboard */}
      <div className="relative bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 md:p-16 flex flex-col lg:flex-row items-stretch gap-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[160px] -z-10"></div>
        
        <div className="flex-1 flex flex-col md:flex-row items-center gap-14">
          <div className="relative text-center md:text-left min-w-[320px]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Overall Skill Match</h2>
            <div className={`text-[10rem] leading-[0.8] font-black tracking-tighter ${scoreColor(analysis.score)} drop-shadow-sm`}>
              {analysis.score}<span className="text-4xl text-slate-200 -ml-2 font-bold">%</span>
            </div>
            <p className="mt-8 text-sm font-bold text-slate-500 max-w-[280px]">
               You matched <span className="text-slate-900">{analysis.matchedKeywords}</span> of <span className="text-slate-900">{analysis.totalJDKeywords}</span> key requirements.
            </p>
          </div>
          
          <div className="w-px h-full bg-slate-100 hidden sm:block opacity-50"></div>
          
          <div className="flex-1 space-y-6 w-full max-w-sm">
             <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <Tooltip content="Specific tools, programming languages, and hard technologies required for the role. (e.g., React, Python, SQL, AWS)">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-help border-b border-dotted border-slate-300">Core Technical Skills</div>
                   </Tooltip>
                   <div className="text-lg font-black text-slate-900">{analysis.calculationBreakdown.hardSkillsScore}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.hardSkillsScore)}`} style={{ width: `${analysis.calculationBreakdown.hardSkillsScore}%` }}></div>
                </div>
             </div>

             <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <Tooltip content="Behavioral signals and soft skills that indicate how you work and lead. (e.g., Leadership, Mentorship, Communication)">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-help border-b border-dotted border-slate-300">Professional Qualities</div>
                   </Tooltip>
                   <div className="text-lg font-black text-slate-900">{analysis.calculationBreakdown.softSignalsScore}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.softSignalsScore)}`} style={{ width: `${analysis.calculationBreakdown.softSignalsScore}%` }}></div>
                </div>
             </div>

             <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <Tooltip content="Multi-word terminology and specific methodologies that demonstrate domain seniority. (e.g., CI/CD, Event-Driven Architecture, TDD)">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-help border-b border-dotted border-slate-300">Industry Language</div>
                   </Tooltip>
                   <div className="text-lg font-black text-slate-900">{analysis.calculationBreakdown.phrasesScore}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.phrasesScore)}`} style={{ width: `${analysis.calculationBreakdown.phrasesScore}%` }}></div>
                </div>
             </div>
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
        
        {/* Compact Navigation Header */}
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

          {/* Sub-menu Filter bar for Table Mode */}
          {displayMode === 'table' && (
            <div className="px-6 pb-4 pt-0 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-200 pr-4">Filter By</div>
              <div className="flex gap-1">
                {(['all', 'missing', 'present', 'phrases'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border ${
                      activeTab === tab 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    {tab === 'all' ? 'Everything' : tab === 'missing' ? 'Gaps Only' : tab === 'present' ? 'Wins' : 'Language'}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                  
                  let thermalEffect = "";
                  let textEffect = "text-slate-900";
                  
                  if (showHeatmap) {
                    if (isMissing) {
                      thermalEffect = isCritical ? "bg-rose-50/70" : "bg-rose-50/30";
                      textEffect = isCritical ? "text-rose-600 drop-shadow-sm" : "text-rose-500/80";
                    } else {
                      thermalEffect = "bg-emerald-50/20";
                      textEffect = "text-emerald-700/80";
                    }
                  }

                  return (
                    <tr key={i} className={`group transition-all duration-300 ${thermalEffect} hover:bg-slate-50/80`}>
                      <td className="px-8 py-5">
                        <div className="relative flex items-center gap-3 overflow-hidden">
                          {showHeatmap && isCritical && isMissing && (
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></div>
                          )}
                          <span className={`text-base font-black tracking-tight leading-snug transition-all duration-300 break-words ${textEffect} ${locked ? 'blur-[10px] opacity-10 select-none' : ''}`}>
                            {locked ? 'XXXXXXXXXXXX' : res.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className={`transition-opacity ${locked ? 'opacity-10' : ''}`}>
                          <KeywordBadge type={res.category} size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className={`transition-opacity ${locked ? 'opacity-10' : ''}`}>
                          <KeywordBadge type={res.significance} size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                         <div className={`inline-flex items-center gap-2 text-[10px] font-black ${locked ? 'opacity-0' : ''}`}>
                            <span className="text-slate-900">{res.countInJD}</span>
                            <span className="text-slate-200">/</span>
                            <span className={res.countInResume > 0 ? 'text-emerald-500' : 'text-slate-300'}>{res.countInResume}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        {locked ? (
                          <button 
                            onClick={() => triggerCheckout("pro_24h")} 
                            className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 transition-all active:scale-95 shadow-sm"
                          >
                            Unlock
                          </button>
                        ) : isMissing ? (
                          <button 
                            onClick={() => fetchSpecificPathway(res.text)}
                            disabled={!!activeFixingSkill}
                            className={`px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600 transition-all active:scale-95 shadow-sm inline-flex items-center gap-2 ${isFixingThis ? 'animate-pulse opacity-50' : ''}`}
                          >
                            {isFixingThis ? 'Mapping...' : (
                              <>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Fix Gap
                              </>
                            )}
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
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900">Forensic Markup</h4>
                  <p className="text-xs text-slate-500 font-medium">Visualizing hits and weak spots directly on your source document.</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Match</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Weak Word</span>
                   </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[2rem] p-12 md:p-16 shadow-xl border border-slate-200 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
                    {highlightedResume}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
