
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const CheckoutModal: React.FC = () => {
  const { checkoutPlan, closeCheckout, finalizePurchase, isPaymentEnabled } = useUser();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (!checkoutPlan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await finalizePurchase(email);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 transition-opacity duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={closeCheckout} />
      
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-12 md:p-16 text-center">
          {status !== 'success' ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-900">
                    {isPaymentEnabled ? checkoutPlan.name : `Founder Price: ${checkoutPlan.name}`}
                  </h3>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                    {isPaymentEnabled ? 'Full Access • Single Audit Version' : 'Limited Early Access Slots'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-indigo-600">${checkoutPlan.price}</div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {isPaymentEnabled ? 'One-time payment' : 'Future launch price'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                   <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                   Unlock all hidden keyword gaps
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                   <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                   Full Recruiter Sentiment Analysis
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                   <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                   Unlimited AI Rewrites
                </div>
              </div>

              {!isPaymentEnabled && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-[11px] font-bold text-indigo-600 uppercase tracking-widest leading-relaxed">
                  🛡️ No payment required today. Joining the queue locks in your $5 Founder Price for when we go live.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="email" 
                  required
                  placeholder={isPaymentEnabled ? "Professional Email for Receipt" : "Professional Email for Early Access"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
                />
                <button 
                  disabled={status === 'loading'}
                  className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                >
                  {status === 'loading' 
                    ? (isPaymentEnabled ? 'Securing Transaction...' : 'Saving Your Spot...') 
                    : (isPaymentEnabled ? `Continue to Checkout — $${checkoutPlan.price}` : `Lock In My $${checkoutPlan.price} Early Access`)}
                </button>
              </form>
              <button onClick={closeCheckout} className="text-xs font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest">Maybe Later</button>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
               </div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                 {isPaymentEnabled ? 'Transaction Pending!' : 'Founder Price Locked!'}
               </h3>
               <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                 {isPaymentEnabled 
                   ? `We've initiated your purchase of the ${checkoutPlan.name}. Please check your email for the next steps.`
                   : `We've reserved your spot and locked in your $${checkoutPlan.price} discount. We'll email you the moment we open the doors.`}
               </p>
               <button 
                onClick={closeCheckout}
                className="w-full py-6 border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
               >
                 Close
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
