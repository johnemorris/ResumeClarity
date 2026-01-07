
import React, { useState, useEffect } from 'react';
import { AnalysisSummary, KeywordCategory, MatchStatus, KeywordResult, SignificanceLevel, InterviewTrap, LearningPathway } from '../types';
import KeywordBadge from './KeywordBadge';
import { getInterviewTraps, getLearningPathway } from '../services/geminiService';
import { useUser } from '../context/UserContext';

interface AnalysisViewProps {
  analysis: AnalysisSummary;
  resume: string;
  jd: string;
  onViewPathways: (data: LearningPathway[]) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, resume, jd, onViewPathways }) => {
  const { isPro, triggerCheckout } = useUser();
  const [activeTab, setActiveTab] = useState<'all' | 'missing' | 'present' | 'phrases'>('all');
  const [traps, setTraps] = useState<InterviewTrap[]>([]);
  const [loadingTraps, setLoadingTraps] = useState(false);
  const [loadingPathways, setLoadingPathways] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [freePreviewIds, setFreePreviewIds] = useState<string[]>([]);

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

  const hiddenCount = analysis.results.filter(r => 
    r.status === MatchStatus.MISSING && !freePreviewIds.includes(r.text)
  ).length;

  return (
    <div className="space-y-12">
      <div className="relative bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 md:p-16 flex flex-col lg:flex-row items-stretch gap-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[160px] -z-10"></div>
        
        <div className="flex-1 flex flex-col md:flex-row items-center gap-14">
          <div className="relative text-center md:text-left min-w-[320px]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Overall Skill Match</h2>
            <div className={`text-[10rem] leading-[0.8] font-black tracking-tighter ${scoreColor(analysis.score)} drop-shadow-sm`}>
              {analysis.score}<span className="text-4xl text-slate-200 -ml-2 font-bold">%</span>
            </div>
            <p className="mt-8 text-sm font-bold text-slate-500 max-w-[280px]">
               You have matched <span className="text-slate-900">{analysis.matchedKeywords}</span> out of <span className="text-slate-900">{analysis.totalJDKeywords}</span> key requirements for this role.
            </p>
          </div>
          
          <div className="w-px h-full bg-slate-100 hidden sm:block opacity-50"></div>
          
          <div className="flex-1 space-y-10 w-full max-w-sm">
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Technical Skills</div>
                      <div className="text-xl font-black text-slate-900">70% Impact</div>
                   </div>
                   <div className="text-2xl font-black text-slate-900">{analysis.calculationBreakdown.hardSkillsScore}%</div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.hardSkillsScore)}`} style={{ width: `${analysis.calculationBreakdown.hardSkillsScore}%` }}></div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Qualities</div>
                      <div className="text-xl font-black text-slate-900">20% Impact</div>
                   </div>
                   <div className="text-2xl font-black text-slate-900">{analysis.calculationBreakdown.softSignalsScore}%</div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.softSignalsScore)}`} style={{ width: `${analysis.calculationBreakdown.softSignalsScore}%` }}></div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry Language</div>
                      <div className="text-xl font-black text-slate-900">10% Impact</div>
                   </div>
                   <div className="text-2xl font-black text-slate-900">{analysis.calculationBreakdown.phrasesScore}%</div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${barColor(analysis.calculationBreakdown.phrasesScore)}`} style={{ width: `${analysis.calculationBreakdown.phrasesScore}%` }}></div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="flex-1 bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group cursor-pointer" onClick={fetchTraps}>
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-300">Interview Defense</div>
              <div className="text-3xl font-black leading-tight">{loadingTraps ? 'Running Simulation...' : 'Anticipate Gap Questions'}</div>
              <p className="text-indigo-400 text-xs font-bold leading-relaxed">
                 How to handle questions about your missing {analysis.totalJDKeywords - analysis.matchedKeywords} requirements.
              </p>
            </div>
          </div>
          
          <div className="flex-1 bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group cursor-pointer" onClick={fetchPathways}>
             <div className="relative z-10 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-200">The Edge Track</div>
                <div className="text-3xl font-black leading-tight">{loadingPathways ? 'Synthesizing...' : 'Close the Gap Fast'}</div>
                <p className="text-indigo-100 text-xs font-bold leading-relaxed">
                   Fun, high-velocity projects to add missing skills to your resume this weekend.
                </p>
             </div>
          </div>
        </div>
      </div>

      {traps.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-500">
          {traps.map((trap, idx) => (
            <div key={idx} className="bg-white border-4 border-slate-900 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center pt-8 pr-8">
                <span className="text-rose-600 font-black text-3xl opacity-20 tracking-tighter">RISK</span>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Potential Interview "Trap"</div>
                <h4 className="text-3xl font-black text-slate-900 leading-tight italic">"{trap.question}"</h4>
              </div>
              <div className="space-y-6">
                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Why they ask this</div>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">{trap.reason}</p>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-100">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Your Strategic Pivot</div>
                  <p className="text-sm font-black text-emerald-800 leading-relaxed">{trap.suggestedAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden transition-all duration-700 ${showHeatmap ? 'ring-8 ring-rose-100 scale-[1.01]' : ''}`}>
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 bg-slate-50/40">
          <div className="flex w-full md:w-auto">
            {(['all', 'missing', 'present', 'phrases'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${
                  activeTab === tab 
                  ? 'text-indigo-600 bg-white' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? 'The Audit' : tab === 'missing' ? 'The Gaps' : tab === 'present' ? 'The Wins' : 'Language'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-indigo-600"></div>}
              </button>
            ))}
          </div>

          <div className="px-10 py-6 w-full md:w-auto flex items-center justify-end">
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-3 ${showHeatmap ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-500 hover:text-rose-500'}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${showHeatmap ? 'bg-white animate-ping' : 'bg-slate-300'}`}></div>
              {showHeatmap ? 'Deficiency Scan Active' : 'Scan for Hotspots'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[11px] uppercase tracking-[0.4em] font-black border-b border-slate-100">
                <th className="px-16 py-12">Required Industry Term</th>
                <th className="px-12 py-12">Skill Type</th>
                <th className="px-12 py-12 text-center">Priority</th>
                <th className="px-12 py-12 text-center">Density</th>
                <th className="px-16 py-12 text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((res, i) => {
                const locked = isLocked(res);
                const isCritical = res.significance === SignificanceLevel.CRITICAL;
                const isMissing = res.status === MatchStatus.MISSING;
                
                let rowBgClass = "";
                let nameEffectClass = "";
                
                if (showHeatmap) {
                  if (isMissing) {
                    rowBgClass = isCritical ? "bg-rose-50/80" : "bg-rose-50/40";
                    nameEffectClass = isCritical ? "text-rose-700 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse" : "text-rose-600/80";
                  } else {
                    rowBgClass = "bg-emerald-50/40";
                    nameEffectClass = "text-emerald-700";
                  }
                }

                return (
                  <tr key={i} className={`group border-b border-slate-50 transition-all duration-500 ${rowBgClass} ${!rowBgClass ? 'hover:bg-slate-50/50' : ''}`}>
                    <td className="px-16 py-12">
                      <div className="relative flex items-center gap-4">
                        {showHeatmap && isCritical && isMissing && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                        )}
                        <span className={`text-3xl font-black tracking-tighter transition-all duration-500 ${nameEffectClass} ${!showHeatmap ? 'text-slate-900' : ''} ${locked ? 'blur-[14px] opacity-10 select-none' : ''}`}>
                          {locked ? 'XXXXXXXXXXXX' : res.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-12 py-12">
                      <div className={`transition-all duration-500 ${locked ? 'blur-[8px] opacity-20' : ''}`}>
                        <KeywordBadge type={res.category} size="md" />
                      </div>
                    </td>
                    <td className="px-12 py-12 text-center">
                      <div className={`transition-all duration-500 ${locked ? 'blur-[8px] opacity-20' : ''}`}>
                        <KeywordBadge type={res.significance} size="sm" />
                      </div>
                    </td>
                    <td className="px-12 py-12 text-center">
                      <div className={`inline-flex items-center gap-4 px-6 py-3 bg-slate-100 rounded-2xl transition-all duration-500 ${locked ? 'opacity-0' : ''}`}>
                        <div className="flex flex-col items-center">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">In Job</span>
                           <span className="text-lg font-black text-slate-900">{res.countInJD}x</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">In You</span>
                           <span className={`text-lg font-black ${res.countInResume > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{res.countInResume}x</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-16 py-12 text-right">
                      {locked ? (
                        <button onClick={() => triggerCheckout("pro_24h")} className="text-[11px] font-black text-white bg-indigo-600 px-8 py-3.5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 uppercase tracking-widest">Unlock Info</button>
                      ) : (
                        <KeywordBadge type={res.status} size="md" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isPro && hiddenCount > 0 && (
            <div className="p-24 text-center bg-slate-950/95 backdrop-blur-xl relative">
               <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
               <h4 className="text-5xl font-black text-white mb-6 tracking-tighter">You are blind to {hiddenCount} gaps.</h4>
               <p className="text-slate-400 text-xl font-medium mb-12 max-w-2xl mx-auto">Our radar detected more missing requirements. Unlock the full scan to secure your interview slot.</p>
               <button onClick={() => triggerCheckout("pro_24h")} className="px-16 py-8 bg-white text-slate-950 rounded-[2.5rem] font-black text-2xl tracking-tight shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2)] hover:-translate-y-2 transition-all active:scale-95">Upgrade for Full Thermal Audit — $5</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
