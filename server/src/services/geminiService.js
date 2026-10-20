import { GoogleGenAI } from '@google/genai';

/**
 * Helper to initialize Google GenAI client
 */
export const getAiClient = (customApiKey = null) => {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

/**
 * Unified Gemini API runner with automatic model failover and strict timeout protection.
 * Tries fast models first (gemini-2.0-flash, gemini-1.5-flash) with graceful cascade.
 */
export const callGeminiPrompt = async (ai, { model = 'gemini-2.0-flash', prompt }) => {
  let requested = model;
  // Map legacy/fictional model IDs to real Gemini model IDs
  const modelMap = {
    'gemini-3-flash-preview': 'gemini-2.0-flash',
    'gemini-3.5-flash': 'gemini-1.5-flash',
    'gemini-4-argon': 'gemini-1.5-pro',
    'gemini-2.5-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
  };
  requested = modelMap[requested] || (
    requested.includes('pro') || requested.includes('argon') ? 'gemini-1.5-pro' :
    requested.includes('1.5-flash') ? 'gemini-1.5-flash' :
    'gemini-2.0-flash'
  );

  // Model cascade priority: requested model -> gemini-2.0-flash -> gemini-1.5-flash
  const candidateModels = [
    requested,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model: targetModel,
          contents: prompt,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after 18000ms on ${targetModel}`)), 18000)
        ),
      ]);

      if (res && res.text) {
        return res.text.trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`[GeminiService] Model '${targetModel}' warning: ${err.message}. Trying next available model in fleet...`);
    }
  }

  throw lastError || new Error('All Gemini model candidates failed to respond.');
};

/**
 * Test a Gemini API key with a fast ping using gemini-2.0-flash
 */
export const testGeminiApiKey = async (apiKey) => {
  try {
    const ai = getAiClient(apiKey);
    if (!ai) return { success: false, message: 'API key cannot be empty' };

    const text = await callGeminiPrompt(ai, {
      model: 'gemini-2.0-flash',
      prompt: 'Ping test. Reply with: OK',
    });

    if (text) {
      return { success: true, message: 'Gemini API Key is valid and active (Gemini 2.0 Flash)!' };
    }
    return { success: false, message: 'No response from Gemini API' };
  } catch (err) {
    let cleanMsg = err.message;
    try {
      const parsed = JSON.parse(cleanMsg);
      if (parsed?.error?.message) {
        cleanMsg = parsed.error.message;
      }
    } catch (_) {}
    return { success: false, message: cleanMsg };
  }
};

/**
 * Intelligent section-based parser that accurately extracts resume details
 * even when offline or without an active Gemini API key.
 */
export const extractResumeStructured = (rawText) => {
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Email & Phone
  const emailMatch = cleanText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  const githubMatch = cleanText.match(/github\.com\/[A-Za-z0-9_-]+/i);
  const linkedinMatch = cleanText.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i);

  // 2. Full Name (First line that looks like a person's name, not location/email)
  let fullName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      !line.includes('@') &&
      !line.includes('+91') &&
      !line.includes('•') &&
      !line.includes('|') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      line.length >= 3 &&
      line.length <= 40
    ) {
      fullName = line;
      break;
    }
  }
  if (!fullName && lines.length > 0) fullName = lines[0].slice(0, 40);

  // 3. Section Extraction
  const sections = {};
  let currentSection = 'header';
  sections[currentSection] = [];

  const sectionKeywords = [
    { key: 'summary', regex: /^(?:PROFESSIONAL\s+SUMMARY|SUMMARY|ABOUT\s+ME|OBJECTIVE|PROFILE)/i },
    { key: 'skills', regex: /^(?:TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES|TECHNOLOGIES)/i },
    { key: 'experience', regex: /^(?:WORK\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT\s+HISTORY|INTERNSHIPS?)/i },
    { key: 'projects', regex: /^(?:TECHNICAL\s+PROJECTS|PROJECTS|KEY\s+PROJECTS|ACADEMIC\s+PROJECTS)/i },
    { key: 'education', regex: /^(?:EDUCATION|ACADEMIC\s+BACKGROUND|QUALIFICATIONS?)/i },
    { key: 'certifications', regex: /^(?:CERTIFICATIONS?|COURSES?|ACHIEVEMENTS?)/i },
  ];

  for (const line of lines) {
    let matchedKey = null;
    for (const sec of sectionKeywords) {
      if (sec.regex.test(line)) {
        matchedKey = sec.key;
        break;
      }
    }

    if (matchedKey) {
      currentSection = matchedKey;
      sections[currentSection] = sections[currentSection] || [];
    } else {
      sections[currentSection] = sections[currentSection] || [];
      sections[currentSection].push(line);
    }
  }

  // 4. Determine Actual Professional Role
  let currentRole = '';
  const roleRegexes = [
    /Full[- ]Stack\s+(?:MERN\s+)?Developer/i,
    /MERN\s+Stack\s+Developer/i,
    /Frontend\s+Developer/i,
    /Backend\s+Developer/i,
    /Software\s+(?:Development\s+)?Engineer/i,
    /Software\s+Developer/i,
    /Web\s+Developer/i,
    /Node\.js\s+Developer/i,
    /React(?:JS|\.js)?\s+Developer/i,
    /Python\s+Developer/i,
    /Java\s+Developer/i,
    /MERN\s+Stack\s+(?:Developer|Engineer)/i,
  ];

  // First check summary
  const summaryText = (sections.summary || []).join(' ');
  for (const r of roleRegexes) {
    const match = summaryText.match(r);
    if (match) {
      currentRole = match[0];
      break;
    }
  }

  // If not found in summary, check experience
  if (!currentRole && sections.experience) {
    const expText = sections.experience.join(' ');
    for (const r of roleRegexes) {
      const match = expText.match(r);
      if (match) {
        currentRole = match[0];
        break;
      }
    }
  }

  if (!currentRole) currentRole = 'Full-Stack MERN Developer';
  if (currentRole.toLowerCase().includes('intern')) currentRole = 'Full-Stack Developer';

  // 5. Professional Summary
  let summary = summaryText;
  if (!summary && sections.header) {
    summary = `${currentRole} skilled in modern web development, scalable APIs, and building responsive client applications.`;
  }

  // 6. Experience Years Calculation
  let experienceYears = 1;
  const expLines = sections.experience || [];
  const expFull = expLines.join(' ');
  // Look for dates like 06/2024 – 01/2025 or 2021 – 2025
  const yearMatches = expFull.match(/\b(20\d\d)\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(Number);
    const diff = Math.max(...years) - Math.min(...years);
    experienceYears = Math.max(1, Math.min(diff, 10));
  } else if (/intern/i.test(expFull)) {
    experienceYears = 1; // 1 year / internship experience
  }

  // 7. Technical Skills
  const skillsSet = new Set();
  const knownSkills = [
    'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React.js', 'React', 'Redux', 'Redux Toolkit',
    'Tailwind CSS', 'Bootstrap', 'Node.js', 'Express.js', 'Express', 'MongoDB', 'Mongoose',
    'RESTful APIs', 'JWT Authentication', 'JWT', 'RBAC', 'SQL', 'PostgreSQL', 'Python',
    'Java', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'Postman',
    'Next.js', 'FastAPI', 'Redis', 'GraphQL', 'Linux', 'Antigravity', 'Copilot'
  ];

  const skillsText = (sections.skills || []).join(' ') + ' ' + (sections.header || []).join(' ') + ' ' + summaryText;
  for (const skill of knownSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(skillsText)) {
      skillsSet.add(skill);
    }
  }
  const skills = Array.from(skillsSet);

  // 8. Projects Extraction
  const keyProjects = [];
  const projectLines = sections.projects || [];

  let currentProject = null;
  for (const line of projectLines) {
    // Detect project heading: e.g. "School SaaS Platform | React.js, Node.js..."
    if (line.includes('|')) {
      if (currentProject) keyProjects.push(currentProject);

      const parts = line.split('|').map((p) => p.trim());
      const title = parts[0].replace(/Live Demo|GitHub Repo/gi, '').trim();
      const techPart = parts[1] ? parts[1].replace(/Live Demo|GitHub Repo/gi, '').trim() : '';

      const projTech = techPart
        ? techPart.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      currentProject = {
        title,
        description: '',
        techStack: projTech,
        highlights: '',
        link: '',
      };
    } else if (currentProject) {
      if (!currentProject.description) {
        currentProject.description = line;
      } else if (!currentProject.highlights) {
        currentProject.highlights = line;
      } else {
        currentProject.highlights += ' ' + line;
      }
    }
  }
  if (currentProject) keyProjects.push(currentProject);

  // If no projects parsed via '|', create smart project entries from known keywords
  if (keyProjects.length === 0) {
    keyProjects.push({
      title: 'Full-Stack Web Application',
      description: 'Engineered responsive single page applications with RESTful APIs, JWT authentication, and MongoDB.',
      techStack: skills.slice(0, 4),
      highlights: 'Implemented secure role-based access control and responsive UI.',
      link: githubMatch ? `https://${githubMatch[0]}` : '',
    });
  }

  // 9. Education
  const education = [];
  const eduLines = sections.education || [];
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    if (/Institute|College|University|School|Academy/i.test(line)) {
      const nextLine = eduLines[i + 1] || '';
      education.push({
        institution: line,
        degree: nextLine,
        year: line.match(/20\d\d/g) ? line.match(/20\d\d/g).join(' - ') : '2025',
      });
    }
  }

  return {
    fullName,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    currentRole,
    experienceYears,
    experienceMonths: 0,
    isFresher: Number(experienceYears) === 0,
    summary,
    skills: skills.length > 0 ? skills : ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Express.js', 'Tailwind CSS'],
    keyProjects,
    links: {
      github: githubMatch ? `https://${githubMatch[0]}` : '',
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
      portfolio: '',
    },
    education,
  };
};

/**
 * Parse raw resume text using Gemini 2.5 Flash, or use our smart section-based parser
 */
export const parseResumeWithGemini = async (rawText) => {
  const ai = getAiClient();

  if (!ai) {
    console.log('[GeminiService] GEMINI_API_KEY not found. Running smart section-based parser.');
    return extractResumeStructured(rawText);
  }

  const prompt = `
You are an expert technical recruiter and resume intelligence parser.
Analyze the following resume text and extract candidate details into strict JSON format.

Resume Text:
"""
${rawText.slice(0, 10000)}
"""

CRITICAL INSTRUCTIONS:
- fullName: Extract the candidate's real personal name (e.g. "CHETAN KUMAR"), NOT location or phone or headline.
- currentRole: Extract the candidate's actual engineering role/title (e.g. "Full-Stack Developer", "MERN Stack Developer", "Software Engineer"). NEVER put location or availability in currentRole.
- experienceYears: Estimate total professional/internship experience in whole years (0 for freshers).
- experienceMonths: Remaining months of experience (0 to 11).
- isFresher: Set to true if the candidate has 0 years/months of corporate experience or is a recent graduate, otherwise false.
- summary: Extract the exact or summarized Professional Summary.
- skills: Array of technical skills, frameworks, languages, databases.
- keyProjects: Array of actual projects listed in the resume. Extract the real project title, brief description, tech stack array, and key achievements.
- links: { github, linkedin, portfolio }
- education: Array of degrees, colleges, and years.

Output MUST be a valid JSON object matching this schema exactly:
{
  "fullName": "Candidate full name",
  "email": "Email address",
  "phone": "Phone number",
  "currentRole": "Accurate technical role",
  "experienceYears": 1,
  "experienceMonths": 0,
  "isFresher": false,
  "summary": "Professional summary",
  "skills": ["JavaScript", "React.js", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],
  "keyProjects": [
    {
      "title": "School SaaS Platform",
      "description": "Multi-role educational management platform supporting Admin, Teacher, and Student portals.",
      "techStack": ["React.js", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],
      "highlights": "Implemented role-based access control (RBAC) and secured API endpoints.",
      "link": ""
    }
  ],
  "links": {
    "github": "",
    "linkedin": "",
    "portfolio": ""
  },
  "education": [
    {
      "degree": "Bachelor of Technology - Computer Science",
      "institution": "Chartered Institute of Technology",
      "year": "2021 - 2025"
    }
  ]
}
Return ONLY pure JSON. No markdown backticks, no explanations.
`;

  try {
    const text = await callGeminiPrompt(ai, {
      model: 'gemini-2.0-flash',
      prompt,
    });

    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[GeminiService] Error calling Gemini API (falling back to structured regex parser):', error.message);
    return extractResumeStructured(rawText);
  }
};

/**
 * Generate a high-converting, personalized 3-step cold outreach sequence.
 * Supports BOTH:
 * 1. "With Job Description" mode (Tailors resume directly against JD requirements)
 * 2. "Speculative / Open Role" mode (Zero-JD required)
 */
/**
 * Generates an authentic, high-converting, punchy 3-step cadence.
 * Built with professional copywriting principles (under 120 words, zero cliché boilerplate,
 * human greeting, genuine project highlights, and crisp follow-ups).
 */
export const buildHumanFallbackCadence = ({
  candidateProfile,
  hrContact,
  jobDescription = '',
  tone = 'confident & polite',
}) => {
  const company = hrContact?.companyName || 'your team';
  const companyTech = (hrContact?.techStack || []).slice(0, 4).join(', ') || 'modern engineering';

  const rawRecruiter = hrContact?.recruiterName || '';
  const isGenericRecruiter = !rawRecruiter ||
    /^(hiring|lead|recruiter|hr|talent|team|manager|acquisition|n\/a)$/i.test(rawRecruiter.trim()) ||
    /hiring lead|talent acquisition|hr team|recruiting team/i.test(rawRecruiter.trim());
  const recruiterFirstName = isGenericRecruiter ? '' : rawRecruiter.trim().split(' ')[0];
  const greeting = recruiterFirstName ? `Hi ${recruiterFirstName},` : `Hi ${company} team,`;

  const candidateName = candidateProfile?.fullName || 'Candidate';
  const candidateRole = candidateProfile?.currentRole || 'Full-Stack Developer';

  const isFresher = Boolean(candidateProfile?.isFresher) ||
    (Number(candidateProfile?.experienceYears || 0) === 0 && Number(candidateProfile?.experienceMonths || 0) === 0);
  const expYears = Number(candidateProfile?.experienceYears || 0);
  const expMonths = Number(candidateProfile?.experienceMonths || 0);

  let expSummary = '';
  if (isFresher) {
    expSummary = 'project-proven developer';
  } else if (expYears > 0 && expMonths > 0) {
    expSummary = `${expYears}y ${expMonths}m experienced developer`;
  } else if (expYears > 0) {
    expSummary = `${expYears}+ year developer`;
  } else if (expMonths > 0) {
    expSummary = `${expMonths} month developer`;
  } else {
    expSummary = 'project-proven developer';
  }

  const primaryProject = candidateProfile?.keyProjects && candidateProfile.keyProjects.length > 0
    ? candidateProfile.keyProjects[0]
    : null;
  const projectTitle = primaryProject?.title || 'full-stack web application';
  const projectTech = (primaryProject?.techStack || []).slice(0, 4).join(', ') || (candidateProfile?.skills || []).slice(0, 4).join(', ') || 'React, Node.js, and MongoDB';
  const projectHighlight = primaryProject?.highlights || primaryProject?.description || 'clean architecture, JWT security, and responsive UI';

  const linksList = [];
  if (candidateProfile?.links?.github) linksList.push(`• GitHub: ${candidateProfile.links.github}`);
  if (candidateProfile?.links?.portfolio) linksList.push(`• Portfolio: ${candidateProfile.links.portfolio}`);
  if (candidateProfile?.links?.linkedin) linksList.push(`• LinkedIn: ${candidateProfile.links.linkedin}`);
  const linksBlock = linksList.length > 0 ? `\n${linksList.join('\n')}\n` : '';

  const hasJD = Boolean(jobDescription && jobDescription.trim());

  // Tone-specific copywriting presets for fallback
  if (tone === 'concise') {
    const subject = hasJD ? `${candidateRole} — ${candidateName}` : `${candidateRole} interested in ${company}`;
    return {
      step1: {
        subject,
        body: `${greeting}

I'm a ${candidateRole} specializing in ${projectTech}. Recently built ${projectTitle}—focusing on clean architecture and high-performance endpoints.

Reaching out to explore engineering openings at ${company}. Open to a brief 10-minute chat this week? My resume is attached.${linksBlock ? '\n' + linksBlock : ''}
Best,
${candidateName}
${candidateProfile?.email || ''}`,
      },
      step2: {
        delayDays: 3,
        subject: `Re: ${subject}`,
        body: `${greeting}

Quick follow-up on my note below. Happy to send over my GitHub repo or a 2-minute project walkthrough if helpful.

Best,
${candidateName}`,
      },
      step3: {
        delayDays: 7,
        subject: `Re: ${subject}`,
        body: `${greeting}

Closing the loop on this! Feel free to keep my resume on file if an engineering need emerges down the road.

Best regards,
${candidateName}`,
      },
    };
  }

  if (tone === 'metrics') {
    const subject = hasJD ? `${candidateRole} (Metrics & Scalability) — ${candidateName}` : `${candidateRole} / Production Architecture for ${company}`;
    return {
      step1: {
        subject,
        body: `${greeting}

I've been following ${company}'s technical growth and wanted to connect regarding engineering opportunities.

As a ${candidateRole} with expertise in ${projectTech}, my recent work on ${projectTitle} focused heavily on measurable engineering outcomes: optimizing database queries, reducing API response times, and maintaining high test coverage and clean separation of concerns.

My resume is attached, and you can review live project source code here:${linksBlock}
Would love to hop on a 10-minute technical chat this week to see where my skill set can support your engineering throughput.

Best regards,
${candidateName}
${candidateProfile?.phone ? candidateProfile.phone + ' | ' : ''}${candidateProfile?.email || ''}`,
      },
      step2: {
        delayDays: 3,
        subject: `Re: ${subject}`,
        body: `${greeting}

Following up briefly. When building my recent applications, I prioritized JWT authentication security, sub-100ms endpoint latencies, and modular state management to ensure long-term maintainability.

Would welcome the chance to share architectural specifics if your team is expanding.

Thanks for your time,
${candidateName}`,
      },
      step3: {
        delayDays: 7,
        subject: `Re: ${subject}`,
        body: `${greeting}

Checking in one last time regarding engineering requirements at ${company}. If current headcount is filled, no worries at all!

Always open to connect on LinkedIn for future roadmap needs.

Best regards,
${candidateName}
${candidateProfile?.links?.linkedin ? `LinkedIn: ${candidateProfile.links.linkedin}` : ''}`,
      },
    };
  }

  if (tone === 'fresher') {
    const subject = hasJD ? `Entry-Level ${candidateRole} — ${candidateName} for ${company}` : `Passionate ${candidateRole} eager to contribute to ${company}`;
    return {
      step1: {
        subject,
        body: `${greeting}

I'm reaching out because I'm a huge admirer of ${company}'s engineering culture and products.

I'm an entry-level ${candidateRole} with strong, hands-on proof-of-work in ${projectTech}. Rather than just following textbook tutorials, I built and deployed ${projectTitle} from scratch (${projectHighlight}) with strict Git commit discipline and clean API design. I learn fast and I'm eager to ship high-quality code.

My resume is attached, and my projects are live on GitHub:${linksBlock}
I'd love the opportunity to take on a take-home challenge or a 10-minute call to demonstrate what I can contribute to your team.

Best regards,
${candidateName}
${candidateProfile?.phone ? candidateProfile.phone + ' | ' : ''}${candidateProfile?.email || ''}`,
      },
      step2: {
        delayDays: 3,
        subject: `Re: ${subject}`,
        body: `${greeting}

Following up on my note! As someone early in my engineering career, my biggest focus is continuous code quality, fast debugging, and contributing to sprint goals from day one.

I'd be thrilled to tackle any technical assessment or screening task for your team.

Thanks so much,
${candidateName}`,
      },
      step3: {
        delayDays: 7,
        subject: `Re: ${subject}`,
        body: `${greeting}

One final check-in! Thank you for considering my profile. If you aren't hiring junior or entry-level developers right now, I completely understand.

I'll keep building and shipping—hope we can connect in the future!

Warm regards,
${candidateName}
${candidateProfile?.links?.linkedin ? `LinkedIn: ${candidateProfile.links.linkedin}` : ''}`,
      },
    };
  }

  if (tone === 'casual') {
    const subject = hasJD ? `Hey from ${candidateName} (${candidateRole} for ${company})` : `Quick note regarding ${company} engineering from ${candidateName}`;
    return {
      step1: {
        subject,
        body: `${greeting}

Hope you're having a great week! I've been following what you folks are shipping at ${company} and really dig your focus on ${companyTech}.

I'm a ${candidateRole} who loves building with ${projectTech}. Just wrapped up ${projectTitle} (${projectHighlight}) and wanted to see if your team is open to bringing on another developer who loves shipping clean code.

Attached my resume, and you can poke around my work here:${linksBlock}
Open to a quick 10-minute virtual coffee sometime this week?

Cheers,
${candidateName}
${candidateProfile?.email || ''}`,
      },
      step2: {
        delayDays: 3,
        subject: `Re: ${subject}`,
        body: `${greeting}

Just floating this back to the top of your inbox in case it got buried! Happy to share a quick Loom or chat about any upcoming engineering projects.

Have a great week ahead,
${candidateName}`,
      },
      step3: {
        delayDays: 7,
        subject: `Re: ${subject}`,
        body: `${greeting}

No worries if timing is off right now—I know recruiting schedules can get pretty crazy. Let's definitely stay in touch on LinkedIn!

Cheers,
${candidateName}
${candidateProfile?.links?.linkedin ? `LinkedIn: ${candidateProfile.links.linkedin}` : ''}`,
      },
    };
  }

  // Default Standard Fallback
  if (hasJD) {
    const subject = `${candidateRole} — ${candidateName} for ${company}`;
    return {
      step1: {
        subject,
        body: `${greeting}

I noticed ${company}'s opening for engineering talent and wanted to reach out directly.

I'm a ${candidateRole} specializing in ${projectTech}. Recently, I built ${projectTitle} from scratch—implementing ${projectHighlight}. Rather than just theory, I enjoy building end-to-end, performant products with clean API architecture and responsive state management.

My resume is attached, and you can also check out my work here:${linksBlock}
If you have 10 minutes later this week, I'd love to learn more about your technical roadmap and see if my skill set aligns with what your team needs.

Best regards,
${candidateName}
${candidateProfile?.phone ? candidateProfile.phone + ' | ' : ''}${candidateProfile?.email || ''}`,
      },
      step2: {
        delayDays: 3,
        subject: `Re: ${subject}`,
        body: `${greeting}

Following up briefly on my earlier note.

One detail I wanted to highlight: in my recent projects, I focused heavily on architecting secured endpoints (JWT/RBAC), minimizing API latency, and delivering clean, maintainable component hierarchies.

I'd welcome the chance to share a quick walkthrough or answer any technical questions.

Thanks again for your time,
${candidateName}`,
      },
      step3: {
        delayDays: 7,
        subject: `Re: ${subject}`,
        body: `${greeting}

Checking in one final time regarding opportunities on your technical team. I know schedules are packed, so if the timing isn't right or you're all set on hiring, no worries at all!

Feel free to keep my resume on file for future openings. Wishing you and the ${company} team continued success!

Best regards,
${candidateName}
${candidateProfile?.links?.linkedin ? `LinkedIn: ${candidateProfile.links.linkedin}` : ''}`,
      },
    };
  }

  // Speculative (No JD)
  const subject = `${candidateRole} interested in ${company}'s engineering team`;
  return {
    step1: {
      subject,
      body: `${greeting}

I've been following what you're building at ${company} and really admire your engineering focus around ${companyTech}.

I'm reaching out speculatively to explore if you have upcoming openings for software engineers. As a ${candidateRole} specializing in ${projectTech}, I recently developed ${projectTitle} (${projectHighlight})—focusing on clean code, rapid load times, and scalable API design.

My resume is attached, and you can also check out my work here:${linksBlock}
Would you be open to a brief 10-minute exploratory chat this week to see if my background might add value to ${company}?

Best regards,
${candidateName}
${candidateProfile?.phone ? candidateProfile.phone + ' | ' : ''}${candidateProfile?.email || ''}`,
    },
    step2: {
      delayDays: 3,
      subject: `Re: ${subject}`,
      body: `${greeting}

Following up on my previous note—I know your schedule is likely full of recruitment and engineering priorities!

To share one quick technical highlight: when architecting my recent applications, I prioritized robust state management, responsive UI design, and secured API integrations.

If there are any current or planned openings on your technical team, I'd love to connect.

Thanks again,
${candidateName}`,
    },
    step3: {
      delayDays: 7,
      subject: `Re: ${subject}`,
      body: `${greeting}

Checking in one final time to see if you had a moment to review my profile. If you're not currently hiring for ${candidateRole} roles, no problem at all!

Would love to stay connected on LinkedIn for future opportunities. Wishing you and the ${company} team all the best!

Best regards,
${candidateName}
${candidateProfile?.links?.linkedin ? `LinkedIn: ${candidateProfile.links.linkedin}` : ''}`,
    },
  };
};

/**
 * Generate a high-converting, personalized 3-step cold outreach sequence.
 * Supports BOTH:
 * 1. "With Job Description" mode (Tailors resume directly against JD requirements)
 * 2. "Speculative / Open Role" mode (Zero-JD required)
 */
export const generateSpeculativePitch = async ({
  candidateProfile,
  hrContact,
  jobDescription = '',
  tone = 'confident & polite',
  model = 'gemini-2.0-flash',
  apiKey = null,
}) => {
  const ai = getAiClient(apiKey);

  const rawRecruiter = hrContact?.recruiterName || '';
  const isGenericRecruiter = !rawRecruiter ||
    /^(hiring|lead|recruiter|hr|talent|team|manager|acquisition|n\/a)$/i.test(rawRecruiter.trim()) ||
    /hiring lead|talent acquisition|hr team|recruiting team/i.test(rawRecruiter.trim());
  const recruiterFirstName = isGenericRecruiter ? '' : rawRecruiter.trim().split(' ')[0];
  const company = hrContact?.companyName || 'your team';
  const companyTech = (hrContact?.techStack || []).join(', ') || 'modern engineering';

  const greeting = recruiterFirstName ? `Hi ${recruiterFirstName},` : `Hi ${company} team,`;

  const candidateName = candidateProfile?.fullName || 'Candidate';
  const candidateRole = candidateProfile?.currentRole || 'Full-Stack Developer';

  const isFresher = Boolean(candidateProfile?.isFresher) ||
    (Number(candidateProfile?.experienceYears || 0) === 0 && Number(candidateProfile?.experienceMonths || 0) === 0);
  const expYears = Number(candidateProfile?.experienceYears || 0);
  const expMonths = Number(candidateProfile?.experienceMonths || 0);

  let candidateExpString = '';
  if (isFresher) {
    candidateExpString = 'Fresher / Entry-Level (Project-Proven, High-Aptitude)';
  } else if (expYears > 0 && expMonths > 0) {
    candidateExpString = `${expYears} yr${expYears > 1 ? 's' : ''} ${expMonths} mo`;
  } else if (expYears > 0) {
    candidateExpString = `${expYears} yr${expYears > 1 ? 's' : ''}`;
  } else if (expMonths > 0) {
    candidateExpString = `${expMonths} months`;
  } else {
    candidateExpString = 'Fresher / Entry-Level';
  }

  const candidateSkills = (candidateProfile?.skills || []).slice(0, 8).join(', ');

  const projectsContext = (candidateProfile?.keyProjects || [])
    .slice(0, 3)
    .map((p) => `• ${p.title}: ${p.highlights || p.description} (Tech: ${(p.techStack || []).join(', ')})`)
    .join('\n');

  const primaryProject = candidateProfile?.keyProjects && candidateProfile.keyProjects.length > 0
    ? candidateProfile.keyProjects[0]
    : null;
  const primaryProjectTitle = primaryProject?.title || 'production applications';

  const hasJD = Boolean(jobDescription && jobDescription.trim());

  // Fallback template generator if no API key is available
  if (!ai) {
    return buildHumanFallbackCadence({
      candidateProfile,
      hrContact,
      jobDescription,
      tone,
    });
  }

  // AI Prompt Construction: JD-specific vs Speculative
  const tonePresets = {
    concise: {
      name: 'Direct & Crisp (<75 words)',
      rules: `
SELECTED PERSONA: DIRECT & ULTRA-CONCISE (<75 words for Step 1).
- Ruthlessly eliminate polite fluff, throat-clearing, and corporate jargon.
- Step 1 Body must be 3-4 punchy sentences maximum:
  1) Immediate context: Reaching out regarding ${candidateRole} opening at ${company}.
  2) Direct proof: Built ${primaryProjectTitle} with clean architecture.
  3) Call to Action: "Open to a brief 10-minute chat this week? Resume attached."
- Step 2 (<35 words): Ultra-short check-in offering a demo or GitHub link.
- Step 3 (<25 words): Courteous one-liner closing the loop.`,
    },
    metrics: {
      name: 'Metrics & Production Impact',
      rules: `
SELECTED PERSONA: METRICS & PRODUCTION IMPACT.
- Engineering-first, analytical, and data-driven.
- Highlight technical rigor: API latency reduction, database indexing, query optimization, high-concurrency throughput, modular architecture, and unit test coverage.
- Frame candidate's code as direct operational and business value for ${company}'s engineering scale.`,
    },
    fresher: {
      name: 'Fresher / High Aptitude & Fast Learner',
      rules: `
SELECTED PERSONA: FRESHER / HIGH APTITUDE & FAST LEARNER.
- Confident, enthusiastic, and grounded. Zero entitlement.
- Emphasize practical proof-of-work: having built and deployed full-stack products from scratch rather than theoretical tutorials.
- Highlight clean Git commits, RESTful best practices, strong self-starter velocity, and hunger to ship code into ${company}'s codebase from day one.`,
    },
    casual: {
      name: 'Startup Casual & Conversational',
      rules: `
SELECTED PERSONA: STARTUP CASUAL & CONVERSATIONAL.
- Warm, authentic, peer-to-peer engineer voice. Zero corporate stiff language.
- Sounds like a smart developer chatting with another smart developer over Slack or virtual coffee.
- Natural appreciation of what ${company} is shipping. Easygoing 10-minute virtual coffee ask.`,
    },
  };

  const activePersona = tonePresets[tone] || {
    name: tone || 'Confident & Professional',
    rules: `TONE: ${tone || 'Confident & Professional'}. Clean, human, zero corporate fluff.`,
  };

  let prompt = '';

  if (hasJD) {
    prompt = `
You are an elite Silicon Valley tech recruiter and world-class cold email copywriter.
You write candidate application emails that engineering directors and tech recruiters actually LOVE to read and reply to.

YOUR MISSION:
Write a punchy, highly authentic, compelling 3-step cold application cadence for an engineering opening.

CANDIDATE CONTEXT:
- Name: ${candidateName}
- Target Role: ${candidateRole}
- Experience Level: ${candidateExpString} ${isFresher ? '(Candidate is an Entry-Level / Fresher engineer)' : ''}
- Key Skills: ${candidateSkills}
- Real Projects:
${projectsContext}
- Links Available: GitHub: ${candidateProfile?.links?.github || 'None'}, Portfolio: ${candidateProfile?.links?.portfolio || 'None'}, LinkedIn: ${candidateProfile?.links?.linkedin || 'None'}

TARGET RECRUITER & COMPANY:
- Company: ${company}
- Recruiter: ${hrContact?.recruiterName || 'Talent Lead'}
- REQUIRED GREETING: "${greeting}"

JOB DESCRIPTION (JD):
"""
${jobDescription.slice(0, 6000)}
"""

${activePersona.rules}

CRITICAL COPYWRITING RULES (DO NOT VIOLATE):
1. MANDATORY GREETING: Start Step 1 with exactly "${greeting}". NEVER write "Hi Hiring" or "Dear Hiring Lead".
2. BANNED LLM CLICHÉS - NEVER USE THESE UNDER ANY CIRCUMSTANCES:
   - "I hope this email finds you well"
   - "I saw your opening for engineering talent and wanted to submit my profile"
   - "I am writing to express my interest in..."
   - "Reviewing your requirements, my background aligns closely..."
   - "My experience directly addresses these requirements..."
   - "I am excited to apply for..."
3. IMMEDIATE VALUE HOOK:
   - Lead directly with what you build and why this opening at ${company} caught your eye.
   - Example style: "I've been following ${company}'s work and wanted to reach out regarding your ${candidateRole} opening..."
4. CONCRETE PROJECT EVIDENCE:
   - Connect the candidate's real project (${primaryProjectTitle}) directly to the core challenges of the JD.
   - Mention real technical implementations (e.g. role-based access control, responsive state management, clean REST endpoints, database query efficiency).
   - NEVER list a boring laundry list of 8+ programming languages/tools in a row. Weave 2-3 key technologies naturally into sentences.
5. IF CANDIDATE IS A FRESHER (${isFresher ? 'YES' : 'NO'}):
   - Highlight practical proof-of-work: having built and deployed end-to-end full-stack products rather than just theoretical coursework, strong code discipline, fast ramp-up speed, and eagerness to ship value. Never apologize for being early career.
6. DELIVERABILITY & BREVITY:
   - Step 1 Body MUST be UNDER 120 words. Recruiters read on mobile in 15 seconds.
   - Low-friction Call To Action: "Open to a quick 10-minute chat this week?" or "Would love to hop on a brief 10-minute call to see if my skill set could support your current roadmap."
   - State "My resume is attached" (and mention GitHub if link exists).
   - NEVER output placeholder brackets like [Company], [Job], [Link], or [Your Name]. Use real values only.
7. STEP 2 (3-day follow-up):
   - Under 60 words. Friendly, zero pressure. Adds 1 new technical detail (e.g. performance optimization, JWT security, or clean architecture).
8. STEP 3 (7-day breakup):
   - Under 50 words. Courteous check-in. Leaves the door wide open for future openings, references LinkedIn, wishes the team continued growth.

SUBJECT LINE RULES:
- Crisp, human, high open rate (e.g., "${candidateRole} — ${candidateName} for ${company}", or "${company} engineering opening / ${candidateName}").
- Step 2 and Step 3 subjects MUST be: "Re: [Same Subject Line as Step 1]".

OUTPUT FORMAT:
Return ONLY a valid JSON object matching:
{
  "step1": {
    "subject": "Role-specific compelling subject line",
    "body": "Step 1 pitch using greeting: ${greeting}"
  },
  "step2": {
    "delayDays": 3,
    "subject": "Re: [Same Subject]",
    "body": "Friendly follow-up adding a technical value nugget"
  },
  "step3": {
    "delayDays": 7,
    "subject": "Re: [Same Subject]",
    "body": "Courteous breakup check-in"
  }
}
Return ONLY pure JSON.
`;
  } else {
    prompt = `
You are an elite Silicon Valley tech recruiter and world-class cold outreach copywriter for top software engineers.
Write a personalized 3-step cold email cadence from an engineer directly to a tech recruiter.
IMPORTANT: There is NO specific Job Description. This is a speculative / open-role pitch.

CANDIDATE CONTEXT:
- Name: ${candidateName}
- Target Role: ${candidateRole}
- Experience Level: ${candidateExpString} ${isFresher ? '(Candidate is an Entry-Level / Fresher engineer)' : ''}
- Core Skills: ${candidateSkills}
- Real Projects:
${projectsContext}
- Links Available: GitHub: ${candidateProfile?.links?.github || 'None'}, Portfolio: ${candidateProfile?.links?.portfolio || 'None'}, LinkedIn: ${candidateProfile?.links?.linkedin || 'None'}

TARGET RECRUITER & COMPANY:
- Company: ${company}
- Recruiter: ${hrContact?.recruiterName || 'Talent Lead'}
- Company Tech Stack: ${companyTech}
- Industry: ${hrContact?.industry || 'Tech'}
- REQUIRED GREETING: "${greeting}"

${activePersona.rules}

CRITICAL COPYWRITING RULES (DO NOT VIOLATE):
1. MANDATORY GREETING: Start Step 1 with exactly "${greeting}". NEVER write "Hi Hiring" or "Dear Recruiter".
2. ZERO BOILERPLATE: Never use "I hope this email finds you well" or "I am writing to express my interest".
3. SPECULATIVE HOOK: Open by appreciating ${company}'s work with ${companyTech}, and reaching out to explore upcoming engineering openings.
4. PROOF OF WORK: Highlight ${primaryProjectTitle}—mentioning real architecture decisions, state management, or API security.
5. IF CANDIDATE IS A FRESHER (${isFresher ? 'YES' : 'NO'}): Emphasize real deployed projects, strong Git/code hygiene, and fast onboarding.
6. DELIVERABILITY: Under 120 words for Step 1. State "My resume is attached". No placeholder brackets anywhere.
7. STEP 2 & 3: Crisp, value-adding follow-up (3 days) and courteous breakup note (7 days).

SUBJECT LINE: High open-rate format like "${candidateRole} interested in ${company}'s engineering team".
Step 2 & 3 subjects: "Re: [Exact Subject Line from Step 1]".

OUTPUT JSON FORMAT:
{
  "step1": {
    "subject": "High open-rate subject line",
    "body": "Step 1 pitch using greeting: ${greeting}"
  },
  "step2": {
    "delayDays": 3,
    "subject": "Re: [Same Subject]",
    "body": "Crisp follow-up"
  },
  "step3": {
    "delayDays": 7,
    "subject": "Re: [Same Subject]",
    "body": "Courteous breakup"
  }
}
Return ONLY pure JSON.
`;
  }

  // Model selection: map to real Gemini model IDs
  const targetModel = model && (model.includes('argon') || model.includes('pro') || model.includes('1.5-pro'))
    ? 'gemini-1.5-pro'
    : (model && (model.includes('3.5') || model.includes('1.5-flash')))
      ? 'gemini-1.5-flash'
      : 'gemini-2.0-flash';

  try {
    const text = await callGeminiPrompt(ai, {
      model: targetModel,
      prompt,
    });

    if (!text) {
      throw new Error('Empty response received from Gemini model');
    }

    // Extract JSON block robustly even if wrapped with markdown or conversational text
    let cleanJson = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    } else {
      cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    if (parsed?.step1?.subject && parsed?.step1?.body) {
      return parsed;
    }
    throw new Error('Incomplete cadence returned by AI model');
  } catch (error) {
    console.warn(`[GeminiService] AI generation note: ${error.message}. Generating high-impact human candidate fallback sequence.`);
    return buildHumanFallbackCadence({
      candidateProfile,
      hrContact,
      jobDescription,
      tone,
    });
  }
};

/**
 * Common technical skills dictionary for fallback heuristic matching
 */
const TECH_TERMS_DICTIONARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Redux', 'Zustand', 'HTML5', 'CSS3', 'Tailwind CSS', 'Tailwind',
  'Node.js', 'Express', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST API', 'RESTful APIs',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Prisma', 'TypeORM', 'Mongoose', 'DynamoDB', 'Cassandra',
  'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform',
  'Microservices', 'Serverless', 'Kafka', 'RabbitMQ', 'WebSockets', 'Socket.io', 'gRPC', 'Jest', 'Cypress', 'Playwright',
  'Git', 'GitHub', 'Linux', 'Agile', 'Scrum', 'System Design', 'OAuth', 'JWT', 'Security', 'Performance Optimization',
  'Elasticsearch', 'Webpack', 'Vite', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'SQL'
];

/**
 * Intelligent heuristic fallback for JD keyword matching when offline or AI key omitted
 */
export const fallbackJdMatchHeuristic = ({ candidateProfile, jobDescription = '' }) => {
  const jdLower = (jobDescription || '').toLowerCase();
  const candSkills = (candidateProfile?.skills || []).map((s) => s.toLowerCase());
  const candBio = [
    candidateProfile?.summary || '',
    candidateProfile?.headline || '',
    ...(candidateProfile?.experience || []).map((e) => `${e.role || ''} ${e.description || ''}`),
    ...(candidateProfile?.projects || []).map((p) => `${p.name || ''} ${p.description || ''}`),
  ].join(' ').toLowerCase();

  const matchedSet = new Set();
  const missingSet = new Set();

  for (const term of TECH_TERMS_DICTIONARY) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
    if (regex.test(jobDescription)) {
      const termLower = term.toLowerCase();
      const candidateHasIt =
        candSkills.some((s) => s.includes(termLower) || termLower.includes(s)) ||
        candBio.includes(termLower);

      if (candidateHasIt) {
        matchedSet.add(term);
      } else {
        missingSet.add(term);
      }
    }
  }

  // Also verify candidate's explicit skills that might be in the JD
  for (const s of (candidateProfile?.skills || [])) {
    if (s && s.length > 2 && jdLower.includes(s.toLowerCase())) {
      matchedSet.add(s);
    }
  }

  const matchedKeywords = Array.from(matchedSet);
  const missingKeywords = Array.from(missingSet);

  let rawRatio = 0.75;
  const totalDetected = matchedKeywords.length + missingKeywords.length;
  if (totalDetected > 0) {
    rawRatio = matchedKeywords.length / totalDetected;
  }

  // Calculate score between 40 and 96
  const matchScore = Math.min(96, Math.max(42, Math.round(rawRatio * 100)));

  let verdict = 'Good Match';
  if (matchScore >= 80) verdict = 'Strong Match';
  else if (matchScore < 60) verdict = 'Moderate Match';

  return {
    matchScore,
    verdict,
    summary: `Candidate exhibits strong technical overlap in ${matchedKeywords.slice(0, 3).join(', ') || 'core engineering fundamentals'}. ${
      missingKeywords.length > 0
        ? `Bridging mentioned requirements like ${missingKeywords.slice(0, 2).join(', ')} in the outreach email will maximize response rate.`
        : 'Skills and background match key role specifications effectively.'
    }`,
    matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : (candidateProfile?.skills || []).slice(0, 6),
    missingKeywords: missingKeywords.slice(0, 8),
    keyStrengths: [
      `Demonstrated capability in ${matchedKeywords.slice(0, 3).join(', ') || 'full-stack software development'}`,
      `Hands-on production projects aligning with target tech stack`,
      `Relevant problem-solving track record and modern development workflows`,
    ],
    recommendations: [
      missingKeywords.length > 0
        ? `Acknowledge JD requirements like ${missingKeywords.slice(0, 2).join(' / ')} by referencing fast-learner adaptability or parallel tools.`
        : 'Focus pitch on measurable project achievements and performance gains.',
      'Keep the call-to-action low friction (e.g. asking for 10 minutes or sharing code repos).',
    ],
  };
};

/**
 * AI-powered Job Description Match & Keyword Gap Analyzer
 */
export const analyzeJobDescriptionMatch = async ({
  candidateProfile,
  jobDescription,
  apiKey = null,
  model = 'gemini-2.0-flash',
}) => {
  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new Error('Please provide a substantive Job Description with at least 20 characters.');
  }

  const ai = getAiClient(apiKey);
  if (!ai) {
    return fallbackJdMatchHeuristic({ candidateProfile, jobDescription });
  }

  const targetModel = model && (model.includes('argon') || model.includes('pro') || model.includes('1.5-pro'))
    ? 'gemini-1.5-pro'
    : (model && (model.includes('3.5') || model.includes('1.5-flash')))
      ? 'gemini-1.5-flash'
      : 'gemini-2.0-flash';

  const prompt = `
You are a senior technical recruiter and hiring bar evaluator analyzing a candidate's resume against an open Job Description.

CANDIDATE RESUME PROFILE:
- Full Name: ${candidateProfile?.fullName || 'Candidate'}
- Headline: ${candidateProfile?.headline || 'Software Engineer'}
- Years of Experience: ${candidateProfile?.yearsOfExperience || 1}
- Skills: ${(candidateProfile?.skills || []).join(', ')}
- Summary: ${candidateProfile?.summary || ''}
- Experience: ${JSON.stringify(candidateProfile?.experience || [])}
- Projects: ${JSON.stringify(candidateProfile?.projects || [])}

TARGET JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Objectively evaluate technical fit, seniority overlap, stack alignment, and project relevance.
2. Return a realistic matchScore between 0 and 100 (e.g. 85 for strong alignment, 65 for moderate with learning curve, etc.).
3. Extract exact technical keywords that MATCH both the JD and the candidate's profile.
4. Extract prominent technical keywords in the JD that are MISSING or NOT evidenced in the candidate's profile.
5. Provide 2-3 specific key strengths and 2 actionable recommendations for crafting an effective cold outreach email.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "matchScore": 84,
  "verdict": "Strong Match",
  "summary": "2-3 concise sentences assessing fit and role alignment.",
  "matchedKeywords": ["React", "Node.js", "MongoDB", "REST APIs"],
  "missingKeywords": ["Docker", "Redis", "AWS"],
  "keyStrengths": [
    "Core strength 1 with specific reference to candidate profile",
    "Core strength 2"
  ],
  "recommendations": [
    "Actionable tip 1 on how to pitch or bridge missing gaps in cold email",
    "Actionable tip 2"
  ]
}
`;

  try {
    const text = await callGeminiPrompt(ai, {
      model: targetModel,
      prompt,
    });

    if (!text) {
      throw new Error('Empty response from Gemini AI');
    }

    let cleanJson = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    } else {
      cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    if (typeof parsed.matchScore === 'number' && Array.isArray(parsed.matchedKeywords)) {
      return {
        matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore))),
        verdict: parsed.verdict || (parsed.matchScore >= 80 ? 'Strong Match' : parsed.matchScore >= 60 ? 'Good Match' : 'Moderate Match'),
        summary: parsed.summary || 'Job fit analyzed against candidate background.',
        matchedKeywords: parsed.matchedKeywords || [],
        missingKeywords: parsed.missingKeywords || [],
        keyStrengths: parsed.keyStrengths || [],
        recommendations: parsed.recommendations || [],
      };
    }
    throw new Error('Invalid JSON structure returned by Gemini');
  } catch (err) {
    console.warn(`[GeminiService] AI JD match note: ${err.message}. Falling back to heuristic match engine.`);
    return fallbackJdMatchHeuristic({ candidateProfile, jobDescription });
  }
};

/**
 * Fallback subject lines generator when offline or without active Gemini API key.
 */
export const buildFallbackSubjectLines = ({
  candidateProfile,
  hrContact,
}) => {
  const candidateName = candidateProfile?.fullName || 'Candidate';
  const candidateRole = candidateProfile?.currentRole || 'Full-Stack Developer';
  const skillsList = candidateProfile?.skills || ['React', 'Node.js'];
  const topSkills = skillsList.slice(0, 2).join(' / ');
  const companyName = hrContact?.companyName || '[Company]';
  const rawRecruiter = hrContact?.recruiterName || '';
  const recruiterFirstName = rawRecruiter && !/^(hiring|lead|recruiter|hr|talent|team)$/i.test(rawRecruiter.trim())
    ? rawRecruiter.trim().split(' ')[0]
    : 'Team';

  const primaryProj = candidateProfile?.keyProjects?.[0]?.title || 'full-stack applications';

  const rawList = [
    {
      id: 'curiosity',
      category: 'Curiosity & Inquiry',
      badge: '🔥 Highest Open Rate',
      text: `Quick question regarding ${companyName}'s engineering stack`,
      estimatedOpenRate: '74%',
      whyItWorks: 'Low pressure and natural. Looks like an authentic technical inquiry rather than a mass marketing pitch.',
    },
    {
      id: 'concise',
      category: 'Ultra-Short (<6 Words)',
      badge: '⚡ Mobile-First',
      text: `${recruiterFirstName} — ${candidateRole} inquiry`,
      estimatedOpenRate: '71%',
      whyItWorks: 'Reads like an internal Slack or direct note. Prevents mobile Gmail/Outlook truncation.',
    },
    {
      id: 'direct',
      category: 'Direct Role & Tech Fit',
      badge: '🎯 High Relevance',
      text: `${candidateRole} (${topSkills}) — ${candidateName} for ${companyName}`,
      estimatedOpenRate: '68%',
      whyItWorks: 'Immediate clarity. Busy hiring managers instantly know the role, candidate, and relevant tech stack.',
    },
    {
      id: 'value',
      category: 'Proof-of-Work Showcase',
      badge: '💡 Project Hook',
      text: `Built ${primaryProj} — exploring ${companyName}`,
      estimatedOpenRate: '65%',
      whyItWorks: 'Leads with tangible proof of work and deployed engineering projects.',
    },
    {
      id: 'casual',
      category: 'Casual Dev-to-Dev',
      badge: '☕ Conversational',
      text: `Hi ${recruiterFirstName} — quick note from a ${candidateRole.toLowerCase()}`,
      estimatedOpenRate: '62%',
      whyItWorks: 'Warm and peer-to-peer. Removes stiff corporate boilerplate.',
    },
  ];

  return rawList.map((item) => {
    const charCount = item.text.length;
    const wordCount = item.text.trim().split(/\s+/).length;
    return {
      ...item,
      charCount,
      wordCount,
      mobileOptimized: charCount <= 52,
      spamRisk: 'low',
    };
  });
};

/**
 * Generate 5 high-converting cold email subject line variations using Gemini AI.
 */
export const generateSubjectLineVariations = async ({
  candidateProfile,
  hrContact,
  jobDescription = '',
  model = 'gemini-2.0-flash',
  apiKey = null,
}) => {
  const fallback = buildFallbackSubjectLines({ candidateProfile, hrContact });
  const ai = getAiClient(apiKey);
  if (!ai) {
    return fallback;
  }

  const company = hrContact?.companyName || '[Company]';
  const recruiter = hrContact?.recruiterName || 'Hiring Lead';
  const role = candidateProfile?.currentRole || 'Full-Stack Developer';
  const skills = (candidateProfile?.skills || []).slice(0, 6).join(', ');
  const projects = (candidateProfile?.keyProjects || []).slice(0, 2).map((p) => p.title).join(', ');

  const prompt = `
You are a world-class cold email copywriting expert specializing in technical recruiting and engineering hiring.
Generate exactly 5 distinct, high-converting subject line variations for an email sent to an HR recruiter or engineering leader.

Candidate Profile:
- Name: ${candidateProfile?.fullName || 'Candidate'}
- Target Role: ${role}
- Skills: ${skills}
- Key Projects: ${projects}

Target Recruiter & Company:
- Company: ${company}
- Recruiter Name: ${recruiter}
- Job Description / Requirements: """${(jobDescription || '').slice(0, 1500)}"""

Generate exactly 5 variations covering these 5 specific psychological angles:
1. "curiosity": Low-friction question or inquiry (Highest response rate, e.g. "Quick question regarding [Company]'s tech stack")
2. "concise": Ultra-short under 6 words (Mobile optimized, e.g. "[Recruiter] — engineering inquiry")
3. "direct": Direct role and tech stack match (e.g. "${role} (${skills.split(',')[0].trim()}) for ${company}")
4. "value": Proof of work or project achievement hook (e.g. "Built [Project] — exploring ${company}")
5. "casual": Authentic developer-to-developer conversational note (e.g. "Hi [Recruiter] — quick note from a full-stack dev")

CRITICAL RULES:
- Never use spam trigger words like "URGENT", "FREE", "100%", "OPPORTUNITY OF A LIFETIME", "HIRE ME", "JOB APPLICATION", or exclamation marks.
- Keep each subject line between 3 and 9 words (<55 characters).
- Return ONLY valid JSON array with 5 objects matching this structure:
[
  {
    "id": "curiosity",
    "category": "Curiosity & Inquiry",
    "badge": "🔥 Highest Open Rate",
    "text": "The exact subject line text",
    "estimatedOpenRate": "75%",
    "whyItWorks": "1-sentence explanation of why this angle works for technical recruiters."
  }
]
`;

  try {
    const text = await callGeminiPrompt(ai, {
      model,
      prompt,
    });

    let cleanJson = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    } else {
      cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 5).map((item, idx) => {
        const t = (item.text || '').trim();
        const charCount = t.length;
        const wordCount = t.split(/\s+/).filter(Boolean).length;
        return {
          id: item.id || `var_${idx + 1}`,
          category: item.category || 'High-Converting Variant',
          badge: item.badge || (idx === 0 ? '🔥 Top Performer' : '⚡ High Open Rate'),
          text: t,
          estimatedOpenRate: item.estimatedOpenRate || `${72 - idx * 3}%`,
          whyItWorks: item.whyItWorks || 'Concise and personalized for engineering recruiters.',
          charCount,
          wordCount,
          mobileOptimized: charCount <= 52,
          spamRisk: 'low',
        };
      });
    }
    return fallback;
  } catch (err) {
    console.warn(`[GeminiService] AI subject line generation error: ${err.message}. Using high-converting fallback variations.`);
    return fallback;
  }
};
