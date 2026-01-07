
import { 
  HARD_SKILLS_SET, 
  SOFT_SIGNALS_SET, 
  JUNK_TOKENS_SET, 
  PHRASES_LIST,
  POWER_WORDS_MAP
} from '../constants';
import { 
  KeywordCategory, 
  KeywordResult, 
  MatchStatus, 
  AnalysisSummary,
  ImpactMetric,
  SignificanceLevel
} from '../types';

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#. -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractPhrases = (text: string): { phrases: string[], remainingText: string } => {
  let modifiedText = text;
  const foundPhrases: string[] = [];

  PHRASES_LIST.forEach(phrase => {
    const normalizedPhrase = phrase.toLowerCase();
    const regex = new RegExp(`\\b${normalizedPhrase}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) {
      foundPhrases.push(...matches);
      modifiedText = modifiedText.replace(regex, ' ');
    }
  });

  return { phrases: foundPhrases, remainingText: modifiedText };
};

export const analyzeTexts = (resumeText: string, jdText: string): AnalysisSummary => {
  const normResume = normalizeText(resumeText);
  const normJD = normalizeText(jdText);
  
  const jdSentences = jdText.toLowerCase().split(/[.!?\n]/);
  const requirementKeywords = ['required', 'must have', 'essential', 'expert', 'proficiency', 'minimum', 'at least'];

  const weakWordsFound: ImpactMetric[] = [];
  Object.entries(POWER_WORDS_MAP).forEach(([weak, strong]) => {
    const regex = new RegExp(`\\b${weak}\\b`, 'gi');
    if (resumeText.match(regex)) {
      weakWordsFound.push({ found: weak, suggested: strong });
    }
  });
  
  const impactScore = Math.max(0, 100 - (weakWordsFound.length * 8));

  const { phrases: jdPhrases, remainingText: jdBody } = extractPhrases(normJD);
  const { phrases: resumePhrases } = extractPhrases(normResume);

  const jdTokens = jdBody.split(' ').filter(t => t && !JUNK_TOKENS_SET.has(t));
  const resumeTokens = normResume.split(' ').filter(t => t && !JUNK_TOKENS_SET.has(t));

  const keywordMap = new Map<string, KeywordResult>();

  const trackKeyword = (text: string, category: KeywordCategory, source: 'jd' | 'resume') => {
    const key = text.toLowerCase();
    const existing = keywordMap.get(key);
    
    if (existing) {
      if (source === 'jd') existing.countInJD++;
      if (source === 'resume') existing.countInResume++;
    } else {
      keywordMap.set(key, {
        text,
        category,
        countInJD: source === 'jd' ? 1 : 0,
        countInResume: source === 'resume' ? 1 : 0,
        status: MatchStatus.MISSING,
        significance: SignificanceLevel.NORMAL,
        significanceReason: ''
      });
    }
  };

  jdPhrases.forEach(p => trackKeyword(p, KeywordCategory.PHRASE, 'jd'));
  resumePhrases.forEach(p => trackKeyword(p, KeywordCategory.PHRASE, 'resume'));
  jdTokens.forEach(token => {
    if (HARD_SKILLS_SET.has(token)) trackKeyword(token, KeywordCategory.HARD_SKILL, 'jd');
    else if (SOFT_SIGNALS_SET.has(token)) trackKeyword(token, KeywordCategory.SOFT_SIGNAL, 'jd');
  });
  resumeTokens.forEach(token => {
    if (HARD_SKILLS_SET.has(token)) trackKeyword(token, KeywordCategory.HARD_SKILL, 'resume');
    else if (SOFT_SIGNALS_SET.has(token)) trackKeyword(token, KeywordCategory.SOFT_SIGNAL, 'resume');
  });

  const results: KeywordResult[] = Array.from(keywordMap.values())
    .filter(res => res.countInJD > 0)
    .map(res => {
      let sig = SignificanceLevel.NORMAL;
      let reason = "Appears in description.";

      const isRequiredInText = jdSentences.some(s => 
        s.includes(res.text.toLowerCase()) && requirementKeywords.some(rk => s.includes(rk))
      );

      if (isRequiredInText || res.countInJD >= 3) {
        sig = SignificanceLevel.CRITICAL;
        reason = isRequiredInText ? "Hard requirement." : "High frequency.";
      } else if (res.countInJD === 2 || res.category === KeywordCategory.PHRASE) {
        sig = SignificanceLevel.HIGH;
        reason = res.category === KeywordCategory.PHRASE ? "Technical Term" : "Strongly preferred.";
      }

      return {
        ...res,
        status: res.countInResume > 0 ? MatchStatus.PRESENT : MatchStatus.MISSING,
        significance: sig,
        significanceReason: reason
      };
    });

  const hardResults = results.filter(r => r.category === KeywordCategory.HARD_SKILL);
  const softResults = results.filter(r => r.category === KeywordCategory.SOFT_SIGNAL);
  const phraseResults = results.filter(r => r.category === KeywordCategory.PHRASE);

  const getCatScore = (list: KeywordResult[]) => 
    list.length === 0 ? 100 : Math.round((list.filter(r => r.status === MatchStatus.PRESENT).length / list.length) * 100);

  const hardScore = getCatScore(hardResults);
  const softScore = getCatScore(softResults);
  const phraseScore = getCatScore(phraseResults);

  const finalScore = Math.round((hardScore * 0.7) + (softScore * 0.2) + (phraseScore * 0.1));

  return {
    score: finalScore,
    totalJDKeywords: results.length,
    matchedKeywords: results.filter(r => r.status === MatchStatus.PRESENT).length,
    results: results.sort((a, b) => {
      const sigOrder = { [SignificanceLevel.CRITICAL]: 0, [SignificanceLevel.HIGH]: 1, [SignificanceLevel.NORMAL]: 2 };
      if (sigOrder[a.significance] !== sigOrder[b.significance]) {
        return sigOrder[a.significance] - sigOrder[b.significance];
      }
      if (a.status !== b.status) return a.status === MatchStatus.MISSING ? -1 : 1;
      return a.text.localeCompare(b.text);
    }),
    removedTokens: [],
    impactScore,
    weakWordsFound,
    calculationBreakdown: {
      hardSkillsScore: hardScore,
      softSignalsScore: softScore,
      phrasesScore: phraseScore
    }
  };
};
