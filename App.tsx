
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
    }, 400); // Slightly slower for better effect with laser
  }, [state.resume, state.jobDescription]);

  const resetToInput = () => {
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackNavigation = () => {
    if (view === 'pathway') {
      setView('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'report') {
      resetToInput();
    }
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
    <div className="relative min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <CheckoutModal />

      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-50/40 via-white to-transparent -z-10" />
      
      <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-[100] h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Identity Group */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToInput}>
              <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:bg-indigo-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">Clarify</span>
                <span className="text-indigo-600 italic font-medium text-lg">{isPro ? 'Pro' : 'Pass'}</span>
              </div>
            </div>

            {/* Consolidated Back Button */}
            {view !== 'input' && (
              <button 
                onClick={handleBackNavigation} 
                className="group flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 bg-white px-5 py-2.5 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                {view === 'pathway' ? 'Back to Analysis' : 'Back to Scan'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            {!isPro ? (
              <button 
                onClick={() => triggerCheckout("pro_24h")} 
                className="text-[10px] font-black text-white bg-indigo-600 uppercase tracking-widest px-7 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                Unlock Pro Pass — $5
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Pro Active
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-32">
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
              <div className="space-y-4 relative">
                <div className="px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
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

                <div className="group relative bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all focus-within:ring-4 focus-within:ring-indigo-100 overflow-hidden">
                    {/* Laser Scanner Animation */}
                    {state.isAnalyzing && (
                      <div className="absolute inset-x-0 h-1 bg-indigo-500/50 shadow-[0_0_15px_2px_rgba(99,102,241,0.5)] z-20 animate-[scan_2s_infinite]" />
                    )}
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

              <div className="space-y-4 relative">
                <div className="px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                    Target Opportunity
                  </label>
                </div>
                {/* Spacer to align with the ResumeSelector's height */}
                <div className="h-[52px]"></div>
                <div className="group relative bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all focus-within:ring-4 focus-within:ring-violet-100 overflow-hidden">
                    {/* Laser Scanner Animation */}
                    {state.isAnalyzing && (
                      <div className="absolute inset-x-0 h-1 bg-violet-500/50 shadow-[0_0_15px_2px_rgba(139,92,246,0.5)] z-20 animate-[scan_2s_infinite_reverse]" />
                    )}
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
                    <div className="flex items-center gap-4"><div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /><span>Forensic Extraction...</span></div>
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

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App;
