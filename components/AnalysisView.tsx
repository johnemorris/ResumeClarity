
import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisSummary, MatchStatus, KeywordResult, SignificanceLevel, RecruiterSignal, LearningPathway } from '../types';
import KeywordBadge from './KeywordBadge';
import { getSignalAudit, getExecutiveSummary, getLearningPathway } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import Tooltip from './Tooltip';
import PremiumLab from './PremiumLab';
import ModernityScan from './ModernityScan';

interface AnalysisViewProps {
  analysis: AnalysisSummary;
  resume: string;
  jd: string;
  onBack: () => void;
  onViewPathways: (data: LearningPathway[]) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, resume, jd, onBack, onViewPathways }) => {
  const { isPro } = useUser();
  const [displayMode, setDisplayMode] = useState<'table' | 'document'>('table');
  const [loadingSignal, setLoadingSignal] = useState(false);
  const [loadingPathwaySkill, setLoadingPathwaySkill] = useState<string | null>(null);
  
  const [biasGuardOn, setBiasGuardOn] = useState(false);
  const [thermalScanOn, setThermalScanOn] = useState(true);

  const [execSummary, setExecSummary] = useState<string | null>(null);
  const [signalScore, setSignalScore] = useState<number | null>(null);
  const [signalResults, setSignalResults] = useState<RecruiterSignal[]>([]);
  const [signalAdvice, setSignalAdvice] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getExecutiveSummary(resume, jd, analysis.score);
      setExecSummary(summary);
    };
    fetchSummary();
  }, [analysis.score]);

  const handleToggleBiasGuard = async () => {
    if (!signalScore && !loadingSignal) {
      setLoadingSignal(true);
      const result = await getSignalAudit(resume);
      if (result) {
        setSignalScore(result.score);
        setSignalResults(result.signals || []);
        setSignalAdvice(result.generalAdvice || '');
      }
      setLoadingSignal(false);
    }
    setBiasGuardOn(!biasGuardOn);
  };

  const handleGrowthPlan = async (skill: string) => {
    setLoadingPathwaySkill(skill);
    const pathway = await getLearningPathway(skill);
    if (pathway) {
      onViewPathways([pathway]);
    }
    setLoadingPathwaySkill(null);
  };

  const scrollToLab = () => {
    const lab = document.getElementById('surgical-lab');
    if (lab) lab.scrollIntoView({ behavior: 'smooth' });
  };

  const highlightedResume = useMemo(() => {
    let text = resume;
    
    // 1. Bias Guard: PII Masking (Only active if biasGuardOn is true)
    if (biasGuardOn) {
      const phoneRegex = /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      text = text.replace(phoneRegex, '[REDACTED PHONE]');
      text = text.replace(emailRegex, '[REDACTED EMAIL]');
    }

    const placeholders: Record<string, { content: string, type: 'match' | 'signal', data?: any }> = {};

    // 2. Thermal Scan: Keyword Matches
    if (thermalScanOn) {
      const sortedMatches = [...analysis.results]
        .filter(r => r.status === MatchStatus.PRESENT)
        .sort((a, b) => b.text.length - a.text.length);

      sortedMatches.forEach((res, i) => {
        const regex = new RegExp(`\\b${res.text}\\b`, 'gi');
        text = text.replace(regex, (match) => {
          const id = `__MATCH_${i}__`;
          placeholders[id] = { content: match, type: 'match' };
          return id;
        });
      });
    }

    // 3. Bias Guard: Temporal Anchors (Signals)
    if (biasGuardOn) {
      const sortedSignals = [...signalResults].sort((a, b) => b.signal.length - a.signal.length);
      sortedSignals.forEach((s, i) => {
        const escaped = s.signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        text = text.replace(regex, (match) => {
          const id = `__SIGNAL_${i}__`;
          placeholders[id] = { content: match, type: 'signal', data: s };
          return id;
        });
      });
    }

    return text.split(/(__[A-Z]+_\d+__)/g).map((part, idx) => {
      const placeholder = placeholders[part];
      if (placeholder) {
        if (placeholder.type === 'match') {
          return <span key={idx} className="bg-indigo-100 text-indigo-800 px-1 rounded font-bold border-b-2 border-indigo-400">{placeholder.content}</span>;
        }
        return (
          <Tooltip key={idx} content={`${placeholder.data.type}: ${placeholder.data.suggestion}`}>
            <span className="bg-rose-100 text-rose-800 px-1 rounded font-bold border-b-2 border-rose-400 cursor-help">
              {placeholder.content}
            </span>
          </Tooltip>
        );
      }
      return part;
    });
  }, [resume, analysis.results, signalResults, biasGuardOn, thermalScanOn]);

  return (
    <div className="space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
         <button 
           onClick={onBack}
           className="hover:text-indigo-600 transition-colors"
         >
           Editor
         </button>
         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M9 18l6-6-6-6"/></svg>
         <span className="text-slate-900">Match Report</span>
      </div>

      {/* Executive Summary Header */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 md:p-14 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="text-center lg:text-left min-w-[200px]">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Match Score</h2>
          <div className={`text-8xl md:text-9xl leading-none font-black tracking-tighter ${analysis.score > 70 ? 'text-emerald-600' : 'text-amber-500'}`}>
            {analysis.score}<span className="text-2xl text-slate-300 ml-1">%</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
             <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Recruiter TL;DR
             </div>
             <p className="text-lg font-bold text-slate-800 leading-tight">
               {execSummary || "Analyzing recruiter perspective..."}
             </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
             <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Skill Density</div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600" style={{ width: `${analysis.calculationBreakdown.hardSkillsScore}%` }}></div>
                </div>
             </div>
             <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Era Signal</div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-violet-600" style={{ width: `${signalScore ?? 100}%` }}></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        {/* Navigation Bar */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setDisplayMode('table')} 
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${displayMode === 'table' ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Keyword Table
            </button>
            <button 
              onClick={() => setDisplayMode('document')} 
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${displayMode === 'document' ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Forensic Document
            </button>
          </div>

          <div className="flex items-center gap-3">
             {/* Forensic Controls: Only visible in document mode */}
             {displayMode === 'document' && (
               <>
                 <Tooltip position="bottom" content="Audits PII risks, legacy tech markers, clichéd power words, and temporal anchors to ensure your profile meets 2026 hiring standards.">
                   <button 
                     onClick={handleToggleBiasGuard}
                     disabled={loadingSignal}
                     className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${biasGuardOn ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                   >
                     <div className={`w-2 h-2 rounded-full ${biasGuardOn ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></div>
                     {loadingSignal ? 'Analyzing...' : 'Signal Audit'}
                   </button>
                 </Tooltip>

                 <Tooltip position="bottom-right" content="A heat-map visualization showing exactly where your resume validates the requirements found in the Job Description.">
                   <button 
                     onClick={() => setThermalScanOn(!thermalScanOn)}
                     className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${thermalScanOn ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                   >
                     <div className={`w-2 h-2 rounded-full ${thermalScanOn ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                     Thermal Scan
                   </button>
                 </Tooltip>
               </>
             )}
          </div>
        </div>

        {displayMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                  <th className="px-10 py-6">Industry Term</th>
                  <th className="px-10 py-6">Type</th>
                  <th className="px-10 py-6">Priority</th>
                  <th className="px-10 py-6 text-center">Density</th>
                  <th className="px-10 py-6 text-right">Recovery / Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analysis.results.map((res, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                       <span className="text-lg font-black text-slate-900 tracking-tight">{res.text}</span>
                    </td>
                    <td className="px-10 py-8"><KeywordBadge type={res.category} size="sm" /></td>
                    <td className="px-10 py-8"><KeywordBadge type={res.significance} size="sm" /></td>
                    <td className="px-10 py-8 text-center">
                       <div className="text-xs font-black text-slate-900">
                         {res.countInJD} <span className="text-slate-300 mx-1">/</span> <span className={res.countInResume > 0 ? 'text-indigo-600' : 'text-slate-300'}>{res.countInResume}</span>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       {res.status === MatchStatus.MISSING ? (
                         <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => handleGrowthPlan(res.text)}
                              disabled={loadingPathwaySkill === res.text}
                              className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                               {loadingPathwaySkill === res.text ? 'Building Plan...' : 'Growth Plan'}
                            </button>
                            <button 
                              onClick={scrollToLab}
                              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
                            >
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                               Fix Gap
                            </button>
                         </div>
                       ) : (
                         <div className="flex items-center justify-end gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                            Secured
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="p-12 md:p-20 bg-slate-50 relative">
               {/* Redaction Marker */}
               {biasGuardOn && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl z-10 animate-pulse">
                    Privacy Redaction Active
                  </div>
               )}
               <div className="max-w-3xl mx-auto bg-white p-12 md:p-16 rounded-[2rem] shadow-2xl border border-slate-200">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-600">
                    {highlightedResume}
                  </div>
               </div>
            </div>

            {/* Modernity Scan: Now rendered inside the document view context */}
            {biasGuardOn && signalScore !== null && (
              <div className="px-12 pb-20 bg-slate-50">
                 <div className="max-w-5xl mx-auto">
                    <ModernityScan score={signalScore} signals={signalResults} advice={signalAdvice} />
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div id="surgical-lab">
        <PremiumLab jd={jd} resume={resume} />
      </div>
    </div>
  );
};

export default AnalysisView;
