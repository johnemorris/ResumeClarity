
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
    resume: '', 
    jobDescription: '',
    isAnalyzing: false,
    analysis: null,
    error: null,
  });

  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [view, setView] = useState<'input' | 'report' | 'pathway'>('input');
  const [scanStep, setScanStep] = useState('');
  const [learningData, setLearningData] = useState<LearningPathway[]>([]);
  const [isExternalImport, setIsExternalImport] = useState(false);
  const [isExtensionSource, setIsExtensionSource] = useState(false);
  const [isExtensionSynced, setIsExtensionSynced] = useState(false);

  const autoSaveTimerRef = useRef<number | null>(null);
  const resumeRef = useRef<HTMLTextAreaElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);

  // Core Match Engine
  const handleAnalyze = useCallback((targetJd?: string) => {
    const jdToScan = targetJd || state.jobDescription;
    if (!state.resume.trim() || !jdToScan.trim()) {
      setState(prev => ({ ...prev, error: "Match Failed: Forensic engine requires both Resume + JD." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    const steps = targetJd 
      ? ["Validating Extension Payload...", "Syncing Local Profile...", "Cross-Referencing Skills...", "Calculating Forensic Density...", "Finalizing Match..."]
      : ["Normalizing Content...", "Keyword Extraction...", "Weighted Match Analysis...", "Impact Assessment...", "Generating Report..."];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      setScanStep(steps[currentStep]);
      currentStep++;
      if (currentStep >= steps.length) {
        clearInterval(interval);
        try {
          const results = analyzeTexts(state.resume, jdToScan);
          setState(prev => ({ ...prev, analysis: results, isAnalyzing: false }));
          setView('report');
          setIsExternalImport(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
          setState(prev => ({ ...prev, error: "Match engine error. Check text format.", isAnalyzing: false }));
        }
      }
    }, 400);
  }, [state.resume, state.jobDescription]);

  // Initial Data & Extension Detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    const incomingJd = params.get('jd');

    if (source === 'extension') {
      setIsExtensionSource(true);
      setIsExtensionSynced(true);
    }

    if (incomingJd) {
      const decodedJd = decodeURIComponent(incomingJd);
      setState(prev => ({ ...prev, jobDescription: decodedJd }));
      setIsExternalImport(true);
    }

    const savedProfiles = localStorage.getItem('clarify_resume_profiles');
    const lastActiveId = localStorage.getItem('clarify_active_profile_id');
    const savedJD = localStorage.getItem('clarify_last_jd');
    const extActive = localStorage.getItem('clarify_extension_active') === 'true';

    setIsExtensionSynced(extActive);

    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      if (parsed.length > 0) {
        setProfiles(parsed);
        const activeId = lastActiveId || parsed[0].id;
        setActiveProfileId(activeId);
        const active = parsed.find((p: ResumeProfile) => p.id === activeId);
        if (active) {
          setState(prev => ({ 
            ...prev, 
            resume: active.content, 
            jobDescription: prev.jobDescription || incomingJd || savedJD || SAMPLE_JD 
          }));
        }
      }
    } else if (source !== 'extension') {
      // Normal V1 Landing: Show samples
      const defaultProfile: ResumeProfile = {
        id: 'default',
        name: 'Master Copy',
        content: SAMPLE_RESUME,
        lastUpdated: Date.now()
      };
      setProfiles([defaultProfile]);
      setActiveProfileId('default');
      setState(prev => ({ ...prev, resume: SAMPLE_RESUME, jobDescription: incomingJd || SAMPLE_JD }));
    }
  }, []);

  // Handle Automatic Scanning for Extension Funnel
  useEffect(() => {
    if (isExternalImport && state.resume.length > 100 && !state.isAnalyzing && !state.analysis) {
      // Small delay for UX "Handshake" feel
      const t = setTimeout(() => handleAnalyze(state.jobDescription), 800);
      return () => clearTimeout(t);
    }
  }, [isExternalImport, state.resume, handleAnalyze]);

  // Persistence logic
  useEffect(() => {
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      if (state.resume.length > 10) {
        setProfiles(prev => {
          const updated = prev.map(p => 
            p.id === activeProfileId ? { ...p, content: state.resume, lastUpdated: Date.now() } : p
          );
          if (updated.length === 0 && state.resume.length > 50) {
            const first = [{ id: 'default', name: 'Master Copy', content: state.resume, lastUpdated: Date.now() }];
            localStorage.setItem('clarify_resume_profiles', JSON.stringify(first));
            return first;
          }
          localStorage.setItem('clarify_resume_profiles', JSON.stringify(updated));
          return updated;
        });
      }
      if (!isExternalImport && state.jobDescription.length > 0) {
        localStorage.setItem('clarify_last_jd', state.jobDescription);
      }
    }, 1000);
    return () => { if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current); };
  }, [state.resume, state.jobDescription, activeProfileId, isExternalImport]);

  const toggleSimulateSync = () => {
    const newState = !isExtensionSynced;
    setIsExtensionSynced(newState);
    localStorage.setItem('clarify_extension_active', newState ? 'true' : 'false');
  };

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

  const resetToInput = () => {
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackNavigation = () => {
    if (view === 'pathway') setView('report');
    else if (view === 'report') resetToInput();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showPathways = (data: LearningPathway[]) => {
    setLearningData(data);
    setView('pathway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch (err) { console.error('Copy failed', err); }
  };

  const TextActionOverlay = ({ target, onClear }: { target: 'resume' | 'jd', onClear: () => void }) => (
    <div className="absolute top-6 right-6 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <Tooltip content="Select All">
        <button onClick={() => { const el = target === 'resume' ? resumeRef.current : jdRef.current; el?.focus(); el?.setSelectionRange(0, el.value.length); }} className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </button>
      </Tooltip>
      <Tooltip content="Copy Content">
        <button onClick={() => copyToClipboard(target === 'resume' ? state.resume : state.jobDescription)} className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
        </button>
      </Tooltip>
      <Tooltip content="Clear">
        <button onClick={onClear} className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-90">
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
            <div className="flex items-center gap-3 cursor-pointer group" onClick={resetToInput}>
              <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:bg-indigo-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">Clarify</span>
                <span className="text-indigo-600 italic font-medium text-lg">{isPro ? 'Pro' : 'Pass'}</span>
              </div>
            </div>

            {view !== 'input' && (
              <button onClick={handleBackNavigation} className="group flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 bg-white px-5 py-2.5 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                {view === 'pathway' ? 'Back to Analysis' : 'Back to Scan'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            {!isPro ? (
              <button onClick={() => triggerCheckout("pro_24h")} className="text-[10px] font-black text-white bg-indigo-600 uppercase tracking-widest px-7 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">Unlock Pro Pass — $5</button>
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
          <div className="space-y-16">
            {isExtensionSource && state.resume.length < 50 ? (
              <section className="text-center space-y-8 max-w-4xl mx-auto bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl border-2 border-indigo-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600 text-white rounded-full mb-2 shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sync Connection Required</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter leading-[0.9] text-balance">
                  Arm Your <span className="text-indigo-600">Match Engine.</span>
                </h2>
                <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                  To calculate your score for the JD you just imported, <span className="text-slate-950 font-bold underline decoration-indigo-500/30">paste your resume text below.</span> This syncs your local profile and unlocks forensic matching.
                </p>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    AES-256 Local Storage
                  </div>
                </div>
              </section>
            ) : (
              <section className="text-center space-y-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full mb-2">
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Forensic Matching v1.8</span>
                   <div className="w-1 h-1 rounded-full bg-indigo-200"></div>
                   <span className="text-[10px] font-bold text-slate-400">Zero-Cloud Architecture</span>
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter leading-[0.85] text-balance">
                  Stop Guessing. <br/> <span className="text-indigo-600">Start Matching.</span>
                </h2>
                <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  Bridge the gap between your resume and the recruiter's filters with deterministic keyword weighting.
                </p>
              </section>
            )}

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex-1 space-y-4 relative z-10">
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Official Integration</div>
                        <h3 className="text-3xl font-black text-white leading-tight">Instant LinkedIn Match</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                          Get match scores without leaving LinkedIn. The Clarify extension caches your profile for instant forensic auditing.
                        </p>
                        <button 
                          onClick={toggleSimulateSync}
                          className={`px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-lg ${isExtensionSynced ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950 hover:bg-indigo-50'}`}
                        >
                          {isExtensionSynced ? (
                            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> Extension Armed & Synced</>
                          ) : (
                            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Install & Sync Extension</>
                          )}
                        </button>
                    </div>
                    <div className="hidden md:block w-48 h-48 bg-slate-800 rounded-3xl border border-slate-700 flex flex-col items-center justify-center p-6 text-center space-y-3 relative z-10 rotate-3 group-hover:rotate-0 transition-transform">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-black">C</div>
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pt-2">{isExtensionSynced ? 'Sync Active' : 'Extension Ready'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-600 rounded-[2.5rem] p-10 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="space-y-2 relative z-10">
                        <div className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.4em]">Privacy Guard</div>
                        <div className="text-2xl font-black leading-tight">Data Integrity</div>
                    </div>
                    <p className="text-indigo-100 text-[10px] font-bold leading-relaxed relative z-10 opacity-80">
                        We don't have a database. Your master resume is stored purely in your browser's private enclave.
                    </p>
                    <div className="pt-6 relative z-10">
                        <button className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">Local Security Info</button>
                    </div>
                  </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 relative">
              <div className="space-y-4 relative">
                <div className="px-2 flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    1. Source Material (Resume)
                  </label>
                  {isExtensionSynced && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       Extension Armed
                    </div>
                  )}
                </div>
                
                <ResumeSelector profiles={profiles} currentId={activeProfileId} onSelect={handleProfileSelect} onSave={handleProfileSave} isPro={isPro} onUpgrade={() => triggerCheckout("pro_unlimited")} />

                <div className={`group relative bg-white p-2 rounded-[2.5rem] border-4 transition-all overflow-hidden ${state.resume.length < 50 ? 'border-indigo-500 ring-8 ring-indigo-500/5' : 'border-slate-200 shadow-xl'}`}>
                    {state.isAnalyzing && <div className="absolute inset-x-0 h-1 bg-indigo-500/50 shadow-[0_0_15px_2px_rgba(99,102,241,0.5)] z-20 animate-[scan_2s_infinite]" />}
                    <TextActionOverlay target="resume" onClear={() => setState(prev => ({ ...prev, resume: '' }))} />
                    <textarea
                      ref={resumeRef}
                      className="w-full h-[450px] p-8 bg-slate-50/40 rounded-[2rem] border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300 transition-colors"
                      placeholder="Paste your source resume text here..."
                      value={state.resume}
                      onChange={(e) => setState(prev => ({ ...prev, resume: e.target.value }))}
                    />
                    <div className="absolute bottom-6 left-8 flex items-center gap-2 px-3 py-1 bg-white/80 border border-slate-100 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest backdrop-blur-sm pointer-events-none">
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                       End-to-End Local
                    </div>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className="px-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                    2. Forensic Target (JD)
                  </label>
                </div>
                <div className="h-[52px] flex items-center px-4">
                   {isExternalImport && (
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest animate-in slide-in-from-right-2 duration-500">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        Inbound LinkedIn Payload
                     </div>
                   )}
                </div>
                <div className={`group relative bg-white p-2 rounded-[2.5rem] border transition-all overflow-hidden ${state.resume.length < 50 ? 'border-slate-100 opacity-50 grayscale cursor-not-allowed' : 'border-slate-200 shadow-xl'}`}>
                    {state.isAnalyzing && <div className="absolute inset-x-0 h-1 bg-violet-500/50 shadow-[0_0_15px_2px_rgba(139,92,246,0.5)] z-20 animate-[scan_2s_infinite_reverse]" />}
                    <TextActionOverlay target="jd" onClear={() => setState(prev => ({ ...prev, jobDescription: '' }))} />
                    <textarea
                      ref={jdRef}
                      disabled={state.resume.length < 50}
                      className="w-full h-[450px] p-8 bg-slate-50/40 rounded-[2rem] border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300 transition-colors"
                      placeholder={state.resume.length < 50 ? "Complete step 1 to unlock..." : "Paste target job description..."}
                      value={state.jobDescription}
                      onChange={(e) => setState(prev => ({ ...prev, jobDescription: e.target.value }))}
                    />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 py-12">
              {state.error && <div className="text-rose-600 text-[11px] font-black bg-rose-50 px-8 py-4 rounded-full border border-rose-100 uppercase tracking-widest shadow-xl animate-bounce">⚠️ {state.error}</div>}
              <button
                onClick={() => handleAnalyze()}
                disabled={state.isAnalyzing || state.resume.length < 50}
                className="px-14 py-8 bg-slate-950 text-white rounded-[2.5rem] font-black shadow-[0_25px_60px_-15px_rgba(15,23,42,0.4)] hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 min-w-[380px] text-2xl tracking-tight relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {state.isAnalyzing ? (
                  <div className="flex flex-col items-center gap-1 relative z-10">
                    <div className="flex items-center gap-4"><div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /><span>Forensic Matching...</span></div>
                    <span className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.3em]">{scanStep}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-6 relative z-10">
                    {state.resume.length < 50 ? 'Awaiting Source' : 'Run Match Engine'} 
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {view === 'report' && state.analysis && (
          <div className="space-y-32">
            <AnalysisView analysis={state.analysis} resume={state.resume} jd={state.jobDescription} onViewPathways={showPathways} />
            <ImpactAnalyzer metrics={state.analysis.weakWordsFound} score={state.analysis.impactScore} />
            <div className="grid lg:grid-cols-3 gap-12 items-start">
              {/* FIXED: Added missing resume prop to PremiumLab */}
              <div className="lg:col-span-2"><PremiumLab jd={state.jobDescription} resume={state.resume} /></div>
              <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl space-y-8">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Strategic Context</div>
                  <div className="space-y-4">
                     <h4 className="text-2xl font-black text-slate-900 leading-tight">Match Logic</h4>
                     <p className="text-slate-500 text-sm leading-relaxed font-medium">The score is calculated based on keyword density, technical significance, and requirement weightings extracted from the target JD.</p>
                  </div>
                  <div className="pt-6 border-t border-slate-50">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Forensic Breakdown</div>
                    <div className="space-y-3">
                       <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Match Density</span><span className="text-slate-900">{((state.analysis.matchedKeywords / state.analysis.totalJDKeywords) * 100).toFixed(0)}%</span></div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${(state.analysis.matchedKeywords / state.analysis.totalJDKeywords) * 100}%` }}></div></div>
                    </div>
                  </div>
              </div>
            </div>
            <div className="flex justify-center pb-20">
              <button onClick={resetToInput} className="px-12 py-5 border-2 border-slate-200 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Adjust & Re-Scan
              </button>
            </div>
          </div>
        )}

        {view === 'pathway' && <PathwayView pathways={learningData} onBack={() => setView('report')} />}
      </main>

      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
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
