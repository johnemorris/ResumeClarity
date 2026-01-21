
import { GoogleGenAI, Type } from "@google/genai";

const truncate = (text: string, max: number = 3000) => text.length > max ? text.substring(0, max) + "..." : text;

export const getExecutiveSummary = async (resume: string, jd: string, score: number) => {
  const prompt = `
    Resume: ${truncate(resume)}
    JD: ${truncate(jd)}
    Match Score: ${score}%
    
    Provide a 2-sentence "Recruiter Perspective". 
    Sentence 1: The honest truth about why this candidate would or wouldn't get an interview based on the JD.
    Sentence 2: The single most impactful change they should make.
    Keep it blunt and professional.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Recruiter summary currently unavailable.";
  }
};

export const getSignalAudit = async (resume: string) => {
  const prompt = `
    Perform a "Professional Signal Audit" on this resume. 
    Identify PII risks (emails, phones, locations), legacy technical markers (tech over 10 years old not used in modern stacks), and professional polish issues.
    
    Return JSON:
    {
      "score": number,
      "signals": [{ "signal": string, "type": string, "riskLevel": string, "suggestion": string, "standardEquivalent": string }],
      "generalAdvice": string
    }
    Resume: ${truncate(resume)}
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  signal: { type: Type.STRING },
                  type: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  standardEquivalent: { type: Type.STRING }
                }
              }
            },
            generalAdvice: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
};

export const getLearningPathway = async (skill: string) => {
  const prompt = `Create a detailed learning plan to master the missing skill: "${skill}". Focus on creating a practical project that can be added to a resume.`;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["skill", "projectTitle", "projectIdea", "timeEstimate", "difficulty", "futureResumeBullet", "valueProposition", "interviewTalkingPoints", "resources", "fieldGuide"],
          properties: {
            skill: { type: Type.STRING },
            projectTitle: { type: Type.STRING },
            projectIdea: { type: Type.STRING },
            timeEstimate: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            futureResumeBullet: { type: Type.STRING },
            valueProposition: { type: Type.STRING },
            interviewTalkingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  url: { type: Type.STRING },
                  type: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  investmentLevel: { type: Type.STRING }
                }
              }
            },
            fieldGuide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                whyItWorks: { type: Type.STRING },
                amazonUrl: { type: Type.STRING }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { 
    console.error("Pathway generation failed", error);
    return null; 
  }
};

export const getInterviewTraps = async (missing: string[], jd: string) => {
  const prompt = `Predict 2 trap questions for missing skills: ${missing.join(', ')}. JD: ${truncate(jd)}. Return JSON.`;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const rewriteBulletPoint = async (bullet: string, keyword: string, jd: string) => {
  const prompt = `Rewrite "${bullet}" to include "${keyword}" based on this JD: ${truncate(jd)}. Under 25 words.`;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) { return "Rewrite failed."; }
};
