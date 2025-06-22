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
      cvData 
    }: {
      role: string;
      experienceYears: number;
      context?: string;
      cvData?: any;
    } = await request.json();

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

    const prompt = `
You are an experienced interviewer conducting a mock interview for a ${role} position requiring ${experienceYears} years of experience.

${cvContext}

${context ? `**Additional Context:** ${context}` : ''}

Generate exactly 8 interview questions that are:
1. Appropriate for the role and experience level
2. Mix of behavioral, technical, and situational questions
3. Progressively challenging (start easier, get more complex)
4. Relevant to the candidate's background if CV data is provided
5. Designed to assess key competencies for the role

**CRITICAL: Return ONLY a valid JSON array of question objects. No explanations, no markdown formatting, no additional text.**

Format: [
  {
    "id": 1,
    "question": "Tell me about yourself and why you're interested in this ${role} position.",
    "type": "introduction",
    "expectedDuration": 120,
    "keyPoints": ["Background summary", "Career motivation", "Role alignment"]
  },
  {
    "id": 2,
    "question": "Describe a challenging project you worked on recently.",
    "type": "behavioral",
    "expectedDuration": 180,
    "keyPoints": ["Problem-solving", "Technical skills", "Results achieved"]
  }
]

Question types should include: introduction, behavioral, technical, situational, and closing.
Expected duration is in seconds.
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
      
      // Ensure each question has required fields
      questionsData = questionsData.filter(q => 
        q && typeof q === 'object' && q.question && q.type
      ).map((q, index) => ({
        id: q.id || index + 1,
        question: q.question,
        type: q.type || 'general',
        expectedDuration: q.expectedDuration || 120,
        keyPoints: q.keyPoints || []
      }));
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Generate fallback questions based on role
      questionsData = [
        {
          id: 1,
          question: `Tell me about yourself and why you're interested in this ${role} position.`,
          type: "introduction",
          expectedDuration: 120,
          keyPoints: ["Background summary", "Career motivation", "Role alignment"]
        },
        {
          id: 2,
          question: "What are your greatest strengths and how do they apply to this role?",
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
        },
        {
          id: 4,
          question: `What technical skills do you have that make you suitable for this ${role} position?`,
          type: "technical",
          expectedDuration: 120,
          keyPoints: ["Technical competency", "Relevant experience", "Continuous learning"]
        },
        {
          id: 5,
          question: "How do you handle working under pressure and tight deadlines?",
          type: "situational",
          expectedDuration: 120,
          keyPoints: ["Stress management", "Time management", "Quality maintenance"]
        },
        {
          id: 6,
          question: "Where do you see yourself in 5 years?",
          type: "behavioral",
          expectedDuration: 90,
          keyPoints: ["Career goals", "Ambition", "Company alignment"]
        },
        {
          id: 7,
          question: "Why are you leaving your current position?",
          type: "behavioral",
          expectedDuration: 90,
          keyPoints: ["Professional motivation", "Positive framing", "Growth mindset"]
        },
        {
          id: 8,
          question: "Do you have any questions for me about the role or company?",
          type: "closing",
          expectedDuration: 120,
          keyPoints: ["Engagement", "Research", "Interest level"]
        }
      ];
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