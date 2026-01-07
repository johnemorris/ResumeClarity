
import React from 'react';
import { KeywordCategory, MatchStatus, SignificanceLevel } from '../types';

interface BadgeProps {
  type: KeywordCategory | MatchStatus | SignificanceLevel;
  size?: 'sm' | 'md';
}

const KeywordBadge: React.FC<BadgeProps> = ({ type, size = 'md' }) => {
  const baseStyles = "px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center";
  
  const stylesMap: Record<string, string> = {
    [KeywordCategory.HARD_SKILL]: "bg-blue-50 text-blue-600 border border-blue-100",
    [KeywordCategory.SOFT_SIGNAL]: "bg-purple-50 text-purple-600 border border-purple-100",
    [KeywordCategory.PHRASE]: "bg-slate-50 text-slate-600 border border-slate-100",
    [KeywordCategory.UNKNOWN]: "bg-slate-50 text-slate-400",
    [MatchStatus.PRESENT]: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    [MatchStatus.MISSING]: "bg-rose-50 text-rose-600 border border-rose-100",
    [SignificanceLevel.CRITICAL]: "bg-rose-600 text-white shadow-sm",
    [SignificanceLevel.HIGH]: "bg-amber-400 text-amber-900 shadow-sm",
    [SignificanceLevel.NORMAL]: "bg-slate-100 text-slate-400",
  };

  return (
    <span className={`${baseStyles} ${stylesMap[type] || stylesMap[KeywordCategory.UNKNOWN]} ${size === 'sm' ? 'scale-[0.85]' : ''}`}>
      {type}
    </span>
  );
};

export default KeywordBadge;
