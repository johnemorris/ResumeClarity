
import React, { useState, useEffect } from 'react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const FORM_ENDPOINT = "https://formspree.io/f/xdanpqdj";

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, featureName = "Pro Pass" }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: email,
          feature_requested: featureName,
          source: "Clarify Web App"
        })
      });

      if (response.ok) {
        localStorage.setItem('clarify_waitlist_email', email);
        setSubmitted(true);
      } else {
        throw new Error("Failed to join waitlist. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-all duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative bg-white w-full max-w-xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 transition-all duration-500 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
           </div>
           <button 
             onClick={onClose}
             className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors z-20"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="p-10 md:p-14 text-center">
          {!submitted ? (
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest">Early Access Phase</span>
              </div>
              
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Unlock {featureName}
              </h3>
              
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Payments are currently disabled while we finalize our recruiter-side integrations. <br/>
                <span className="text-slate-950 font-bold">Join the waitlist to be notified when we launch.</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    name="email"
                    placeholder="Enter your professional email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-900"
                  />
                </div>
                {error && <div className="text-rose-500 text-xs font-bold px-2">{error}</div>}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Secure My Spot"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
               </div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tight">You're on the list!</h3>
               <p className="text-slate-500 text-lg font-medium leading-relaxed">
                 We've saved your spot. Tell your network about your Audit Score while we process your request!
               </p>
               <div className="flex flex-col gap-4">
                 <button 
                  onClick={onClose}
                  className="w-full py-6 border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
                 >
                   Back to My Report
                 </button>
                 <a 
                   href="https://www.linkedin.com/sharing/share-offsite/?url=https://clarify-audit.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-3 text-indigo-600 font-bold hover:underline"
                 >
                   Share on LinkedIn
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                 </a>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;
