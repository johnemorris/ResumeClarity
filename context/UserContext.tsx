
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTier, Plan } from '../types';

interface UserContextType {
  tier: UserTier;
  isPro: boolean;
  isPaymentEnabled: boolean; // Master switch for billing vs interest
  expiry: number | null;
  checkoutPlan: Plan | null;
  triggerCheckout: (planId: 'pro_24h' | 'pro_unlimited') => void;
  closeCheckout: () => void;
  finalizePurchase: (email: string) => Promise<void>;
}

const PLANS: Record<string, Plan> = {
  pro_24h: { id: 'pro_24h', name: '24-Hour Forensic Pass', price: 5, durationHours: 24 },
  pro_unlimited: { id: 'pro_unlimited', name: 'Professional Lifetime', price: 49, durationHours: 99999 }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tier, setTier] = useState<UserTier>('free');
  const [expiry, setExpiry] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  // MASTER SWITCH: Change this to true when Stripe/LemonSqueezy is ready
  const isPaymentEnabled = false;

  useEffect(() => {
    const savedExpiry = localStorage.getItem('clarify_pro_expiry');
    if (savedExpiry) {
      const exp = parseInt(savedExpiry);
      if (exp > Date.now()) {
        setTier('pro');
        setExpiry(exp);
      }
    }
  }, []);

  const triggerCheckout = (planId: keyof typeof PLANS) => {
    setCheckoutPlan(PLANS[planId]);
  };

  const closeCheckout = () => {
    setCheckoutPlan(null);
  };

  const finalizePurchase = async (email: string) => {
    console.log(`Processing ${isPaymentEnabled ? 'Payment' : 'Interest'} for ${email} on plan ${checkoutPlan?.name}`);
    
    const response = await fetch("https://formspree.io/f/xdanpqdj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        intent: isPaymentEnabled ? "purchase" : "interest",
        plan: checkoutPlan?.id,
        price: checkoutPlan?.price,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) throw new Error("Service currently unavailable. Please try again later.");
  };

  return (
    <UserContext.Provider value={{ 
      tier, 
      isPro: tier === 'pro', 
      isPaymentEnabled,
      expiry, 
      checkoutPlan, 
      triggerCheckout, 
      closeCheckout,
      finalizePurchase 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
