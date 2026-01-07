
export const HARD_SKILLS_SET = new Set([
  // Technical
  'react', 'react.js', 'node.js', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
  'graphql', 'rest', 'api', 'microservices', 'cicd', 'git', 'terraform', 'ansible', 'linux',
  'rdbms', 'oop', 'redux', 'tailwind', 'sass', 'css', 'html', 'testing', 'jest', 'cypress',
  'machine learning', 'ai', 'data science', 'security', 'cybersecurity', 'agile', 'scrum',
  
  // Marketing & Sales
  'seo', 'sem', 'google analytics', 'crm', 'salesforce', 'hubspot', 'copywriting', 'content strategy',
  'market research', 'lead generation', 'social media marketing', 'branding', 'public relations',
  
  // Business & Finance
  'budgeting', 'p&l', 'financial modeling', 'operations', 'supply chain', 'strategic planning',
  'compliance', 'risk management', 'project planning', 'resource allocation', 'accounting',
  'procurement', 'vendor management', 'forecasting'
]);

export const SOFT_SIGNALS_SET = new Set([
  'leadership', 'communication', 'mentorship', 'collaboration', 'teamwork', 'problem solving',
  'critical thinking', 'empathy', 'adaptability', 'initiative', 'project management',
  'stakeholder management', 'client facing', 'conflict resolution', 'presentation',
  'negotiation', 'emotional intelligence', 'time management', 'delegation'
]);

export const JUNK_TOKENS_SET = new Set([
  'the', 'and', 'with', 'for', 'from', 'this', 'that', 'with', 'they', 'them', 'these', 'those',
  'their', 'about', 'around', 'above', 'below', 'between', 'during', 'before', 'after', 'since',
  'until', 'years', 'experience', 'work', 'job', 'highly', 'strong', 'excellent', 'preferred',
  'plus', 'required', 'etc', 'etc.', 'i.e.', 'e.g.'
]);

export const POWER_WORDS_MAP: Record<string, string> = {
  'helped': 'orchestrated',
  'worked on': 'pioneered',
  'handled': 'managed',
  'responsible for': 'spearheaded',
  'did': 'executed',
  'made': 'developed',
  'used': 'leveraged',
  'assisted': 'collaborated',
  'tried': 'implemented',
  'looked at': 'analyzed'
};

export const PHRASES_LIST = [
  'react testing library',
  'ci/cd',
  'event-driven architecture',
  'test driven development',
  'domain driven design',
  'distributed systems',
  'continuous integration',
  'continuous deployment',
  'serverless architecture',
  'cloud computing',
  'full stack development',
  'frontend engineering',
  'backend engineering',
  'go-to-market strategy',
  'customer acquisition cost',
  'return on investment',
  'cross-functional collaboration'
];

export const SAMPLE_RESUME = `
John Doe
Senior Frontend Engineer

Experience:
- Led a team of 5 engineers to build a React and TypeScript dashboard for data visualization.
- Implemented CI/CD pipelines using GitHub Actions and Docker.
- Spearheaded the transition to a microservices architecture.
- Proficient in SQL, Node.js, and AWS.
- Strong communication and mentorship skills.
- Worked on the migration of legacy code to modern standards.
- Responsible for ensuring high code quality.
`;

export const SAMPLE_JD = `
We are looking for a Senior Software Engineer with:
- Expertise in React.js, TypeScript, and Node.js.
- Experience with CI/CD and Docker.
- Knowledge of Event-driven architecture and Redux.
- Required: PostgreSQL or any RDBMS experience.
- Leadership skills and a track record of mentorship.
- Must have: Experience with React Testing Library.
`;
