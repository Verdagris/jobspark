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
      responses,
      overallDuration
    }: {
      role: string;
      experienceYears: number;
      responses: Array<{
        question: string;
        response: string;
        score: number;
        type: string;
      }>;
      overallDuration: number;
    } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const averageScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    const responsesByType = responses.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    }, {} as Record<string, typeof responses>);

    const prompt = `
You are an expert interview coach providing comprehensive feedback on a mock interview.

**Interview Summary:**
- Role: ${role}
- Experience Level: ${experienceYears} years
- Total Duration: ${Math.round(overallDuration / 60)} minutes
- Questions Answered: ${responses.length}
- Average Score: ${averageScore.toFixed(1)}/100

**Response Breakdown by Type:**
${Object.entries(responsesByType).map(([type, typeResponses]) => `
${type.toUpperCase()} Questions (${typeResponses.length}):
${typeResponses.map(r => `- Q: "${r.question.substring(0, 60)}..." | Score: ${r.score}/100`).join('\n')}
`).join('\n')}

Provide a comprehensive interview analysis in the following JSON format:

{
  "overallScore": 85,
  "overallFeedback": "You demonstrated strong communication skills throughout the interview...",
  "strengths": [
    "Excellent communication skills",
    "Strong technical knowledge",
    "Good use of specific examples"
  ],
  "areasForImprovement": [
    "Could provide more quantified results",
    "Should prepare more behavioral examples",
    "Consider practicing concise responses"
  ],
  "categoryScores": {
    "communication": 88,
    "technicalKnowledge": 82,
    "problemSolving": 85,
    "culturalFit": 80,
    "leadership": 75
  },
  "recommendations": [
    "Practice the STAR method for behavioral questions",
    "Prepare 3-5 specific examples with quantified results",
    "Research the company culture and values more thoroughly"
  ],
  "nextSteps": [
    "Schedule follow-up practice sessions",
    "Focus on technical skill development",
    "Prepare thoughtful questions for the interviewer"
  ],
  "readinessLevel": "Strong candidate - ready for interviews with minor improvements"
}

**Scoring Guidelines:**
- 90-100: Exceptional candidate, ready for senior roles
- 80-89: Strong candidate, ready for most interviews
- 70-79: Good candidate, needs some preparation
- 60-69: Adequate candidate, requires focused improvement
- Below 60: Needs significant preparation before interviewing

**CRITICAL: Return ONLY valid JSON. No explanations, no markdown formatting, no additional text.**
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisData;
    
    try {
      // Clean the response to ensure it's valid JSON
      let responseText = response.text().trim();
      
      // Remove any markdown formatting
      responseText = responseText.replace(/```json\n?|\n?```/g, '');
      
      // Remove any explanatory text before the JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      analysisData = JSON.parse(responseText);
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Generate fallback analysis
      analysisData = {
        overallScore: Math.round(averageScore),
        overallFeedback: `You completed the interview with an average score of ${averageScore.toFixed(1)}/100. This shows ${averageScore >= 80 ? 'strong' : averageScore >= 70 ? 'good' : 'developing'} interview skills.`,
        strengths: [
          "Completed all interview questions",
          "Maintained engagement throughout",
          "Provided relevant responses"
        ],
        areasForImprovement: [
          "Practice providing more specific examples",
          "Work on structuring responses clearly",
          "Consider preparing more detailed stories"
        ],
        categoryScores: {
          communication: Math.round(averageScore * 0.9),
          technicalKnowledge: Math.round(averageScore * 1.1),
          problemSolving: Math.round(averageScore),
          culturalFit: Math.round(averageScore * 0.95),
          leadership: Math.round(averageScore * 0.85)
        },
        recommendations: [
          "Practice the STAR method for behavioral questions",
          "Prepare specific examples with quantified results",
          "Research common interview questions for your role"
        ],
        nextSteps: [
          "Schedule additional practice sessions",
          "Focus on areas with lower scores",
          "Prepare questions to ask the interviewer"
        ],
        readinessLevel: averageScore >= 80 ? "Strong candidate - ready for interviews" : 
                       averageScore >= 70 ? "Good candidate - minor improvements needed" :
                       "Developing candidate - focused preparation recommended"
      };
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error generating final analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate final analysis. Please try again.' },
      { status: 500 }
    );
  }
}