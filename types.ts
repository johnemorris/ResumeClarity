
export enum KeywordCategory {
  HARD_SKILL = 'Core Competency',
  SOFT_SIGNAL = 'Work Style',
  PHRASE = 'Industry Term',
  UNKNOWN = 'Other'
}

export enum MatchStatus {
  PRESENT = 'Found',
  MISSING = 'Missing'
}

export enum SignificanceLevel {
  CRITICAL = 'Required',
  HIGH = 'Preferred',
  NORMAL = 'Mentioned'
}

export type UserTier = 'free' | 'pro';

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationHours: number;
}

export interface ResumeProfile {
  id: string;
  name: string;
  content: string;
  lastUpdated: number;
}

export interface RecruiterSignal {
  signal: string;
  type: 'PII/Privacy' | 'Technical Signal' | 'Professional Polish';
  riskLevel: 'High' | 'Medium' | 'Low';
  suggestion: string;
  standardEquivalent: string;
}

export interface AnalysisSummary {
  score: number;
  totalJDKeywords: number;
  matchedKeywords: number;
  results: KeywordResult[];
  removedTokens: string[];
  impactScore: number;
  weakWordsFound: ImpactMetric[];
  executiveSummary?: string;
  calculationBreakdown: {
    hardSkillsScore: number;
    softSignalsScore: number;
    phrasesScore: number;
  };
}

export interface KeywordResult {
  text: string;
  category: KeywordCategory;
  countInJD: number;
  countInResume: number;
  status: MatchStatus;
  significance: SignificanceLevel;
  significanceReason: string;
}

export interface ImpactMetric {
  found: string;
  suggested: string;
}

export interface InterviewTrap {
  question: string;
  reason: string;
  suggestedAnswer: string;
}

export interface LearningPathway {
  id?: string;
  skill: string;
  projectTitle: string;
  projectIdea: string;
  timeEstimate: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  futureResumeBullet: string;
  valueProposition: string;
  interviewTalkingPoints: string[];
  resources: any[];
  fieldGuide?: any;
}

export interface AppState {
  resume: string;
  jobDescription: string;
  isAnalyzing: boolean;
  analysis: AnalysisSummary | null;
  error: string | null;
}
