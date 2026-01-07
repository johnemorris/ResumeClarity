
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeTexts } from './utils/parser';
import { AppState, AnalysisSummary, ResumeProfile, LearningPathway } from './types';
import { SAMPLE_RESUME, SAMPLE_JD } from './constants';
import AnalysisView from './components/AnalysisView';
import PremiumLab from './components/PremiumLab';
import ImpactAnalyzer from './components/ImpactAnalyzer';
import Tooltip from './components/Tooltip';
import CheckoutModal from './components/CheckoutModal';
import ResumeSelector from './components/ResumeSelector';
import PathwayView from './components/PathwayView';
import { UserProvider, useUser } from './context/UserContext';

const AppContent: React.FC = () => {
  const { isPro, triggerCheckout } = useUser();
  const [state, setState] = useState<AppState>({
    resume: SAMPLE_RESUME,
    jobDescription: SAMPLE_JD,
    isAnalyzing: false,
    analysis: null,
    error: null,
  });

  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [view, setView] = useState<'input' | 'report' | 'pathway'>('input');
  const [scanStep, setScanStep] = useState('');
  const [learningData, setLearningData] = useState<LearningPathway[]>([]);

  const autoSaveTimerRef = useRef<number | null>(null);
  const resumeRef = useRef<HTMLTextAreaElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedProfiles = localStorage.getItem('clarify_resume_profiles');
    const lastActiveId = localStorage.getItem('clarify_active_profile_id');
    const savedJD = localStorage.getItem('clarify_last_jd');

    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles(parsed);
      const activeId = lastActiveId || 'default';
      setActiveProfileId(activeId);
      const active = parsed.find((p: ResumeProfile) => p.id === activeId);
      if (active) {
        setState(prev => ({ ...prev, resume: active.content, jobDescription: savedJD || SAMPLE_JD }));
      }
    } else {
      const defaultProfile: ResumeProfile = {
        id: 'default',
        name: 'Main Resume',
        content: SAMPLE_RESUME,
        lastUpdated: Date.now()
      };
      setProfiles([defaultProfile]);
      setActiveProfileId('default');
    }
  }, []);

  useEffect(() => {
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = window.setTimeout(() => {
      setProfiles(prev => {
        const updated = prev.map(p => 
          p.id === activeProfileId ? { ...p, content: state.resume, lastUpdated: Date.now() } : p
        );
        localStorage.setItem('clarify_resume_profiles', JSON.stringify(updated));
        return updated;
      });
      localStorage.setItem('clarify_last_jd', state.jobDescription);
    }, 1000);

    return () => { if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current); };
  }, [state.resume, state.jobDescription, activeProfileId]);

  const handleProfileSelect = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setActiveProfileId(id);
      setState(prev => ({ ...prev, resume: profile.content }));
      localStorage.setItem('clarify_active_profile_id', id);
    }
  };

  const handleProfileSave = (name: string) => {
    const newProfile: ResumeProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content: state.resume,
      lastUpdated: Date.now()
    };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    setActiveProfileId(newProfile.id);
    localStorage.setItem('clarify_resume_profiles', JSON.stringify(newProfiles));
    localStorage.setItem('clarify_active_profile_id', newProfile.id);
  };

  const handleAnalyze = useCallback(() => {
    if (!state.resume.trim() || !state.jobDescription.trim()) {
      setState(prev => ({ ...prev, error: "Please provide both a resume and a job description." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    const steps = ["Normalizing structure...", "Extracting entities...", "Logic matching...", "Weighting keywords...", "Finalizing report..."];
    let currentStep = 0;
    const interval = setInterval(() => {
      setScanStep(steps[currentStep]);
      currentStep++;
      if (currentStep >= steps.length) {
        clearInterval(interval);
        try {
          const results = analyzeTexts(state.resume, state.jobDescription);
          setState(prev => ({ ...prev, analysis: results, isAnalyzing: false }));
          setView('report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
          setState(prev => ({ ...prev, error: "An error occurred during analysis.", isAnalyzing: false }));
        }
      }
    }, 250);
  }, [state.resume, state.jobDescription]);

  const resetToInput = () => {
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showPathways = (data: LearningPathway[]) => {
    setLearningData(data);
    setView('pathway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) { console.error('Copy failed', err); }
  };

  const TextActionOverlay = ({ target, onClear }: { target: 'resume' | 'jd', onClear: () => void }) => (
    <div className="absolute top-6 right-6 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <Tooltip content="Select All">
        <button 
          onClick={() => {
            const el = target === 'resume' ? resumeRef.current : jdRef.current;
            el?.focus();
            el?.setSelectionRange(0, el.value.length);
          }}
          className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </button>
      </Tooltip>
      <Tooltip content="Copy to Clipboard">
        <button 
          onClick={() => copyToClipboard(target === 'resume' ? state.resume : state.jobDescription)}
          className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
        </button>
      </Tooltip>
      <Tooltip content="Clear Content">
        <button 
          onClick={onClear}
          className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
        </button>
      </Tooltip>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      <CheckoutModal />

      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-50/40 via-white to-transparent -z-10" />
      
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={resetToInput}>
            <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:bg-indigo-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
            </div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900">
              Clarify {isPro ? <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-sm">Pro</span> : <span className="text-indigo-600 italic font-medium">Pass</span>}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {!isPro && (
              <button onClick={() => triggerCheckout("pro_24h")} className="text-[10px] font-black text-white bg-slate-900 uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                Get 24h Pass — $5
              </button>
            )}
            {view !== 'input' && (
              <button onClick={resetToInput} className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
                New Audit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-16 pb-32">
        {view === 'input' && (
          <div className="space-y-12">
            <section className="text-center space-y-6 max-w-4xl mx-auto">
              <h2 className="text-6xl md:text-7xl font-black text-slate-950 tracking-tighter leading-[0.9] text-balance">
                The Interview Starts <br/> <span className="text-indigo-600">At the Scan.</span>
              </h2>
              <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">
                Beating the ATS isn't luck. It's forensic keyword alignment.
              </p>
            </section>

            <div className="grid lg:grid-cols-2 gap-8 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    Your Experience
                  </label>
                </div>
                
                <ResumeSelector 
                  profiles={profiles}
                  currentId={activeProfileId}
                  onSelect={handleProfileSelect}
                  onSave={handleProfileSave}
                  isPro={isPro}
                  onUpgrade={() => triggerCheckout("pro_unlimited")}
                />

                <div className="group relative bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all focus-within:ring-4 focus-within:ring-indigo-100">
                    <TextActionOverlay target="resume" onClear={() => setState(prev => ({ ...prev, resume: '' }))} />
                    <textarea
                      ref={resumeRef}
                      className="w-full h-[450px] p-8 bg-slate-50/40 rounded-[2rem] border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300 transition-colors"
                      placeholder="Paste your current resume content here..."
                      value={state.resume}
                      onChange={(e) => setState(prev => ({ ...prev, resume: e.target.value }))}
                    />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                    Target Opportunity
                  </label>
                </div>
                <div className="h-[52px]"></div>
                <div className="group relative bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all focus-within:ring-4 focus-within:ring-violet-100">
                    <TextActionOverlay target="jd" onClear={() => setState(prev => ({ ...prev, jobDescription: '' }))} />
                    <textarea
                      ref={jdRef}
                      className="w-full h-[450px] p-8 bg-slate-50/40 rounded-[2rem] border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300 transition-colors"
                      placeholder="Paste the target job description here..."
                      value={state.jobDescription}
                      onChange={(e) => setState(prev => ({ ...prev, jobDescription: e.target.value }))}
                    />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 py-8">
              {state.error && (
                <div className="text-rose-600 text-[11px] font-black bg-rose-50 px-8 py-4 rounded-full border border-rose-100 uppercase tracking-widest shadow-xl animate-bounce">
                  ⚠️ {state.error}
                </div>
              )}
              <button
                onClick={handleAnalyze}
                disabled={state.isAnalyzing}
                className="px-14 py-8 bg-slate-950 text-white rounded-[2.5rem] font-black shadow-[0_25px_60px_-15px_rgba(15,23,42,0.4)] hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-80 min-w-[360px] text-2xl tracking-tight"
              >
                {state.isAnalyzing ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-4"><div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /><span>Crunching Data...</span></div>
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">{scanStep}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-6">Run Forensic Scan <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                )}
              </button>
            </div>
          </div>
        )}

        {view === 'report' && state.analysis && (
          <div className="space-y-24">
            <AnalysisView 
              analysis={state.analysis} 
              resume={state.resume} 
              jd={state.jobDescription} 
              onViewPathways={showPathways}
            />
            <ImpactAnalyzer metrics={state.analysis.weakWordsFound} score={state.analysis.impactScore} />
            <div className="grid lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2"><PremiumLab jd={state.jobDescription} /></div>
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-6">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Why this matters</div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">The "6-Second Rule"</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Recruiters scan resumes for an average of 6.25 seconds. If they don't see specific hard skills, you're out.</p>
              </div>
            </div>
            <div className="flex justify-center pb-20">
              <button onClick={resetToInput} className="px-12 py-5 border-2 border-slate-200 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all">← Adjust Resume & Re-Scan</button>
            </div>
          </div>
        )}

        {view === 'pathway' && (
          <PathwayView pathways={learningData} onBack={() => setView('report')} />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
