
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';
  width?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', width = 'w-64' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    'bottom-right': 'top-full right-0 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-950',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-950',
    'bottom-right': 'bottom-full right-4 border-b-slate-950',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-950',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-950',
  };

  return (
    <div 
      className="relative inline-block group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[999] ${positionClasses[position]} ${width} animate-in fade-in zoom-in-95 duration-200`}>
          <div className="bg-slate-950 text-white text-[11px] font-medium leading-relaxed p-4 rounded-2xl shadow-2xl border border-white/10 text-center relative">
            {content}
            <div className={`absolute border-8 border-transparent ${arrowClasses[position]}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
