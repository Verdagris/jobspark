import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  if (!genAI) {
    return NextResponse.json(
      { error: 'Gemini AI is not configured. Please check your GEMINI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const { 
      role, 
      experienceYears, 
      context, 
      cvData,
      sessionType,
      questionCount = 3 // Default to 3 questions, allow 2-5
    }: {
      role: string;
      experienceYears: number;
      context?: string;
      cvData?: any;
      sessionType: string;
      questionCount: number;
    } = await request.json();

    // Validate question count
    const validQuestionCount = Math.min(Math.max(questionCount, 2), 5);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const cvContext = cvData ? `
**Candidate's CV Summary:**
- Name: ${cvData.personalInfo?.fullName || 'Not provided'}
- Professional Summary: ${cvData.personalInfo?.professionalSummary || 'Not provided'}
- Recent Experience: ${cvData.experiences?.slice(0, 2).map((exp: any) => 
  `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate})`
).join(', ') || 'Not provided'}
- Education: ${cvData.education?.map((edu: any) => 
  `${edu.degree} from ${edu.institution} (${edu.graduationYear})`
).join(', ') || 'Not provided'}
- Key Skills: ${cvData.skills?.map((skill: any) => skill.name).join(', ') || 'Not provided'}
` : '';

    // Define session-specific question types and focus areas
    const sessionConfigs = {
      'introduction': {
        types: ['introduction', 'personal-brand', 'career-overview'],
        focus: 'self-introduction, personal branding, career summary, and value proposition'
      },
      'experience': {
        types: ['behavioral', 'experience-based', 'achievement'],
        focus: 'work experience, achievements, STAR method responses, and career progression'
      },
      'strengths-weaknesses': {
        types: ['self-assessment', 'behavioral', 'growth-mindset'],
        focus: 'strengths, weaknesses, self-awareness, and professional development'
      },
      'salary': {
        types: ['negotiation', 'compensation', 'value-proposition'],
        focus: 'salary expectations, compensation negotiation, and value justification'
      },
      'job-specific': {
        types: ['technical', 'role-specific', 'industry-knowledge'],
        focus: 'technical skills, role-specific competencies, and industry knowledge'
      },
      'mock-interview': {
        types: ['introduction', 'behavioral', 'technical', 'situational', 'closing'],
        focus: 'comprehensive interview simulation with all question types'
      }
    };

    const sessionConfig = sessionConfigs[sessionType as keyof typeof sessionConfigs] || sessionConfigs['mock-interview'];

    const prompt = `
You are an experienced interviewer conducting a ${sessionType === 'mock-interview' ? 'full mock interview' : `focused coaching session on ${sessionType.replace('-', ' ')}`} for a ${role} position requiring ${experienceYears} years of experience.

${cvContext}

${context ? `**Additional Context:** ${context}` : ''}

**Session Type:** ${sessionType}
**Session Focus:** ${sessionConfig.focus}
**Question Types to Include:** ${sessionConfig.types.join(', ')}
**Number of Questions Required:** ${validQuestionCount}

Generate exactly ${validQuestionCount} interview questions that are:
1. Specifically focused on ${sessionConfig.focus}
2. Appropriate for the role and experience level
3. Relevant to the candidate's background if CV data is provided
4. Designed to assess key competencies for ${sessionType === 'mock-interview' ? 'overall interview performance' : sessionType.replace('-', ' ')}
5. Progressively challenging but appropriate for the session focus
6. Concise and clear (not overly long or complex)

For ${sessionType} sessions, ensure questions are:
${sessionType === 'introduction' ? '- Focused on self-presentation and personal branding\n- About career journey and value proposition\n- Designed to help practice elevator pitches' : ''}
${sessionType === 'experience' ? '- Behavioral questions using STAR method\n- About specific achievements and challenges\n- Focused on quantifiable results and impact' : ''}
${sessionType === 'strengths-weaknesses' ? '- About self-awareness and growth mindset\n- Exploring authentic strengths and genuine areas for improvement\n- Focused on professional development' : ''}
${sessionType === 'salary' ? '- About compensation expectations and negotiation\n- Exploring value proposition and market research\n- Focused on professional worth and benefits' : ''}
${sessionType === 'job-specific' ? '- Technical and role-specific competencies\n- Industry knowledge and best practices\n- Problem-solving and domain expertise' : ''}
${sessionType === 'mock-interview' ? '- Comprehensive mix of all question types\n- Realistic interview flow and progression\n- Complete interview simulation' : ''}

**CRITICAL: Return ONLY a valid JSON array of exactly ${validQuestionCount} question objects. No explanations, no markdown formatting, no additional text.**

Format: [
  {
    "id": 1,
    "question": "Tell me about yourself and what makes you a strong candidate for this ${role} position.",
    "type": "introduction",
    "expectedDuration": 120,
    "keyPoints": ["Background summary", "Career motivation", "Role alignment"]
  }
]

Question types should include: ${sessionConfig.types.join(', ')}.
Expected duration is in seconds (90-180 seconds per question).
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let questionsData;
    
    try {
      // Clean the response to ensure it's valid JSON
      let responseText = response.text().trim();
      
      // Remove any markdown formatting
      responseText = responseText.replace(/```json\n?|\n?```/g, '');
      
      // Remove any explanatory text before the JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      questionsData = JSON.parse(responseText);
      
      // Validate the structure
      if (!Array.isArray(questionsData)) {
        throw new Error('Response is not an array');
      }
      
      // Ensure each question has required fields and limit to requested count
      questionsData = questionsData.filter(q => 
        q && typeof q === 'object' && q.question && q.type
      ).slice(0, validQuestionCount).map((q, index) => ({
        id: q.id || index + 1,
        question: q.question,
        type: q.type || 'general',
        expectedDuration: q.expectedDuration || 120,
        keyPoints: q.keyPoints || []
      }));
      
      // Ensure we have the requested number of questions
      if (questionsData.length < validQuestionCount) {
        // Add fallback questions if needed
        const fallbackQuestions = generateFallbackQuestions(sessionType, role, validQuestionCount - questionsData.length);
        questionsData = [...questionsData, ...fallbackQuestions];
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Generate fallback questions based on session type
      questionsData = generateFallbackQuestions(sessionType, role, validQuestionCount);
    }

    return NextResponse.json({ questions: questionsData });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview questions. Please try again.' },
      { status: 500 }
    );
  }
}

function generateFallbackQuestions(sessionType: string, role: string, count: number) {
  const fallbackQuestions: { [key: string]: any[] } = {
    'introduction': [
      {
        id: 1,
        question: `Tell me about yourself and why you're interested in this ${role} position.`,
        type: "introduction",
        expectedDuration: 120,
        keyPoints: ["Background summary", "Career motivation", "Role alignment"]
      },
      {
        id: 2,
        question: "What makes you unique as a candidate?",
        type: "personal-brand",
        expectedDuration: 90,
        keyPoints: ["Unique value proposition", "Differentiators", "Personal brand"]
      },
      {
        id: 3,
        question: "Walk me through your career journey so far.",
        type: "career-overview",
        expectedDuration: 150,
        keyPoints: ["Career progression", "Key decisions", "Growth trajectory"]
      }
    ],
    'experience': [
      {
        id: 1,
        question: "Tell me about a challenging project you worked on recently.",
        type: "behavioral",
        expectedDuration: 180,
        keyPoints: ["Problem-solving", "Technical skills", "Results achieved"]
      },
      {
        id: 2,
        question: "Describe a time when you had to work under pressure.",
        type: "behavioral",
        expectedDuration: 150,
        keyPoints: ["Stress management", "Time management", "Quality delivery"]
      },
      {
        id: 3,
        question: "What's your greatest professional achievement?",
        type: "achievement",
        expectedDuration: 120,
        keyPoints: ["Impact", "Recognition", "Personal growth"]
      }
    ],
    'strengths-weaknesses': [
      {
        id: 1,
        question: "What are your greatest strengths?",
        type: "self-assessment",
        expectedDuration: 90,
        keyPoints: ["Self-awareness", "Relevant strengths", "Examples"]
      },
      {
        id: 2,
        question: "What's an area you're working to improve?",
        type: "self-assessment",
        expectedDuration: 120,
        keyPoints: ["Growth mindset", "Self-improvement", "Action plan"]
      },
      {
        id: 3,
        question: "How do you handle feedback and criticism?",
        type: "growth-mindset",
        expectedDuration: 100,
        keyPoints: ["Receptiveness", "Learning attitude", "Professional development"]
      }
    ],
    'salary': [
      {
        id: 1,
        question: "What are your salary expectations for this role?",
        type: "negotiation",
        expectedDuration: 120,
        keyPoints: ["Market research", "Value proposition", "Flexibility"]
      },
      {
        id: 2,
        question: "How do you determine your worth in the market?",
        type: "value-proposition",
        expectedDuration: 100,
        keyPoints: ["Skills assessment", "Market analysis", "Unique value"]
      },
      {
        id: 3,
        question: "What factors are most important to you in a compensation package?",
        type: "compensation",
        expectedDuration: 90,
        keyPoints: ["Priorities", "Total compensation", "Benefits"]
      }
    ],
    'job-specific': [
      {
        id: 1,
        question: `What technical skills make you suitable for this ${role} position?`,
        type: "technical",
        expectedDuration: 120,
        keyPoints: ["Technical competency", "Relevant experience", "Continuous learning"]
      },
      {
        id: 2,
        question: "How do you stay current with industry trends?",
        type: "industry-knowledge",
        expectedDuration: 100,
        keyPoints: ["Learning methods", "Industry awareness", "Professional development"]
      },
      {
        id: 3,
        question: `Describe a technical challenge you've solved in your ${role} work.`,
        type: "role-specific",
        expectedDuration: 180,
        keyPoints: ["Problem-solving", "Technical approach", "Results"]
      }
    ]
  };

  const defaultQuestions = [
    {
      id: 1,
      question: `Tell me about yourself and why you're interested in this ${role} position.`,
      type: "introduction",
      expectedDuration: 120,
      keyPoints: ["Background summary", "Career motivation", "Role alignment"]
    },
    {
      id: 2,
      question: "What are your greatest strengths?",
      type: "behavioral",
      expectedDuration: 90,
      keyPoints: ["Self-awareness", "Relevant strengths", "Role connection"]
    },
    {
      id: 3,
      question: "Describe a challenging situation you faced at work and how you handled it.",
      type: "behavioral",
      expectedDuration: 180,
      keyPoints: ["Problem-solving", "Resilience", "Learning"]
    }
  ];

  const questions = fallbackQuestions[sessionType] || defaultQuestions;
  return questions.slice(0, count);
}