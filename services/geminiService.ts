
import { GoogleGenAI, Type } from "@google/genai";

const truncateForTokenSafety = (text: string, maxChars: number = 5000) => {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "... [truncated]";
};

export const getGeminiInsights = async (resume: string, jd: string, missingKeywords: string[]) => {
  const safeResume = truncateForTokenSafety(resume);
  const safeJD = truncateForTokenSafety(jd);
  
  const prompt = `
    Resume: ${safeResume}
    JD: ${safeJD}
    Missing Keywords: ${missingKeywords.join(', ')}
    
    Provide 3 actionable tips (bullet points) to better align this resume with the JD. 
    Focus on how to naturally incorporate missing keywords.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "Could not generate AI insights.";
  }
};

export const getInterviewTraps = async (missingKeywords: string[], jd: string) => {
  const prompt = `
    Job Description Context: ${truncateForTokenSafety(jd, 2000)}
    The candidate is MISSING these critical keywords: ${missingKeywords.slice(0, 5).join(', ')}.

    Predict 2 "Trap Questions" a recruiter might ask to expose these gaps.
    Return a JSON array of objects with: "question", "reason" (why they ask it), and "suggestedAnswer" (how to pivot even without the skill).
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              reason: { type: Type.STRING },
              suggestedAnswer: { type: Type.STRING }
            },
            required: ["question", "reason", "suggestedAnswer"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Interview Traps Error:", error);
    return [];
  }
};

export const getLearningPathway = async (skill: string) => {
  const prompt = `
    The user is missing the skill: "${skill}". 
    Create a "High-Velocity Edge Plan". 
    
    CRITICAL MANDATE: 
    1. Project Ideas must be FUN, BOOTCAMP-STYLE, and HIGHLY DEMONSTRABLE. NO DRY ENTERPRISE FILLER.
    2. Users do not have time for long courses. All recommended resources MUST be under 5 hours.
    3. Conservative "timeEstimate" (e.g., "4-6 Hours").

    Requirements:
    1. "projectTitle": A professional, technical name for this project (e.g., "Distributed Ledger Simulation", "Automated Sentiment Engine").
    2. A "Weekend Sprint" project idea (under 15 words).
    3. "timeEstimate": A conservative range for a focused session.
    4. "futureResumeBullet": The power bullet they can use after.
    5. "resources": A list of 4 items (2 Free, 2 Paid):
       - Items must be high-impact (crash courses, masterclasses).
       - For Paid items, include "investmentLevel": "$" (cheap), "$$" (mid), or "$$$" (premium).
       - Include "duration": e.g. "45m", "2h".
    6. "fieldGuide": Recommend a short, practical "Field Guide" (book or digital guide) that focused on interview terminology.
    7. "valueProposition": Why recruiters care.
    8. "interviewTalkingPoints": 2-3 specific "Ammunition" scripts.

    Return JSON: { 
      "skill": string, 
      "projectTitle": string,
      "projectIdea": string, 
      "timeEstimate": string,
      "difficulty": string, 
      "futureResumeBullet": string, 
      "valueProposition": string, 
      "interviewTalkingPoints": string[],
      "resources": [{ "name": string, "url": string, "type": "Free" | "Paid", "platform": string, "description": string, "duration": string, "investmentLevel": string }],
      "fieldGuide": { "title": string, "author": string, "amazonUrl": string, "whyItWorks": string }
    }
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
                  platform: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  investmentLevel: { type: Type.STRING }
                },
                required: ["name", "url", "type", "platform", "description", "duration"]
              }
            },
            fieldGuide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                amazonUrl: { type: Type.STRING },
                whyItWorks: { type: Type.STRING }
              },
              required: ["title", "author", "amazonUrl", "whyItWorks"]
            }
          },
          required: ["skill", "projectTitle", "projectIdea", "timeEstimate", "difficulty", "futureResumeBullet", "valueProposition", "interviewTalkingPoints", "resources"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Learning Pathway Error:", error);
    return null;
  }
};

export const rewriteBulletPoint = async (bullet: string, targetKeyword: string, contextJD: string) => {
  const prompt = `
    Rewrite this resume bullet to naturally include "${targetKeyword}".
    Original: "${bullet}"
    JD Context: "${truncateForTokenSafety(contextJD, 1000)}"
    Keep it professional, action-oriented, and under 25 words. Focus on achievement.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Failed to rewrite.";
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return "AI Rewrite failed.";
  }
};
