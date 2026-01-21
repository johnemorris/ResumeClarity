
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeTexts } from './utils/parser';
import { AppState, ResumeProfile, LearningPathway } from './types';
import { SAMPLE_RESUME, SAMPLE_JD } from './constants';
import AnalysisView from './components/AnalysisView';
import ImpactAnalyzer from './components/ImpactAnalyzer';
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

  const autoSaveTimerRef = useRef<number | null>(null);
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleAnalyze = useCallback(() => {
    if (!state.resume.trim() || !state.jobDescription.trim()) {
      setState(prev => ({ ...prev, error: "Please provide both Resume and Job Description." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    const steps = ["Parsing Resume...", "Scanning Requirements...", "Mapping Keyword Gaps...", "Finalizing Match Report..."];
    
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
          setState(prev => ({ ...prev, error: "Analysis failed.", isAnalyzing: false }));
        }
      }
    }, 400);
  }, [state.resume, state.jobDescription]);

  useEffect(() => {
    const savedProfiles = localStorage.getItem('clarity_profiles');
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles(parsed);
      const lastId = localStorage.getItem('clarity_active_id');
      if (lastId) {
        setActiveProfileId(lastId);
        const active = parsed.find((p: any) => p.id === lastId);
        if (active) setState(prev => ({ ...prev, resume: active.content }));
      }
    } else {
      const def = { id: 'default', name: 'My Master Resume', content: SAMPLE_RESUME, lastUpdated: Date.now() };
      setProfiles([def]);
      setState(prev => ({ ...prev, resume: SAMPLE_RESUME, jobDescription: SAMPLE_JD }));
    }
  }, []);

  const handleProfileSelect = (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (p) {
      setActiveProfileId(id);
      setState(prev => ({ ...prev, resume: p.content }));
      localStorage.setItem('clarity_active_id', id);
    }
  };

  const handleProfileSave = (name: string) => {
    const newP: ResumeProfile = { id: Math.random().toString(36).substr(2, 9), name, content: state.resume, lastUpdated: Date.now() };
    const updated = [...profiles, newP];
    setProfiles(updated);
    setActiveProfileId(newP.id);
    localStorage.setItem('clarity_profiles', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <CheckoutModal />
      
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] h-16">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('input')}>
              <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:bg-indigo-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span className="text-xl font-black tracking-tight">Clarity</span>
            </div>
            
            {view !== 'input' && (
              <button 
                onClick={() => setView('input')} 
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors border-l border-slate-200 pl-6"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                New Scan
              </button>
            )}
          </div>
          
          {!isPro && <button onClick={() => triggerCheckout("pro_24h")} className="text-[10px] font-black text-white bg-slate-900 px-6 py-2.5 rounded-xl hover:bg-indigo-600 transition-all">Go Pro</button>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-32">
        {view === 'input' && (
          <div className="space-y-12">
            <section className="text-center space-y-6">
              <h1 className="text-6xl font-black tracking-tighter leading-none">Close the Gap. <br/> <span className="text-indigo-600">Get the Interview.</span></h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Instant keyword matching and professional signal auditing for modern tech hiring.</p>
            </section>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2 mb-2">
                  <div className="flex items-center gap-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">1. Your Resume</label>
                    <ResumeSelector 
                      profiles={profiles} 
                      currentId={activeProfileId} 
                      onSelect={handleProfileSelect} 
                      onSave={handleProfileSave} 
                      isPro={isPro} 
                      onUpgrade={() => triggerCheckout("pro_unlimited")} 
                    />
                  </div>
                  {activeProfile && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Last Handshake</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(activeProfile.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <textarea
                    className="w-full h-[400px] p-6 bg-transparent border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300"
                    placeholder="Paste resume text here..."
                    value={state.resume}
                    onChange={(e) => setState(prev => ({ ...prev, resume: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-[52px] flex items-center px-2 mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Target Job Description</label>
                </div>
                <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <textarea
                    className="w-full h-[400px] p-6 bg-transparent border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 placeholder:text-slate-300"
                    placeholder="Paste JD here..."
                    value={state.jobDescription}
                    onChange={(e) => setState(prev => ({ ...prev, jobDescription: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center pt-8">
              {state.error && <div className="text-rose-600 text-[10px] font-black uppercase mb-4 tracking-widest">{state.error}</div>}
              <button
                onClick={handleAnalyze}
                disabled={state.isAnalyzing || !state.resume || !state.jobDescription}
                className="px-14 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 min-w-[340px]"
              >
                {state.isAnalyzing ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Matching...</span></div>
                    <span className="text-[10px] uppercase opacity-60 tracking-widest font-bold">{scanStep}</span>
                  </div>
                ) : 'Run Match Engine'}
              </button>
            </div>
          </div>
        )}

        {view === 'report' && state.analysis && (
          <div className="space-y-32">
            <AnalysisView 
              analysis={state.analysis} 
              resume={state.resume} 
              jd={state.jobDescription} 
              onBack={() => setView('input')}
              onViewPathways={(data) => {setLearningData(data); setView('pathway');}} 
            />
            <ImpactAnalyzer metrics={state.analysis.weakWordsFound} score={state.analysis.impactScore} />
          </div>
        )}

        {view === 'pathway' && <PathwayView pathways={learningData} onBack={() => setView('report')} />}
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
