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
      question, 
      response: userResponse, 
      questionType,
      keyPoints,
      role,
      experienceYears
    }: {
      question: string;
      response: string;
      questionType: string;
      keyPoints: string[];
      role: string;
      experienceYears: number;
    } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an expert interview coach analyzing a candidate's response to an interview question.

**Interview Context:**
- Role: ${role}
- Experience Level: ${experienceYears} years
- Question Type: ${questionType}

**Question Asked:**
"${question}"

**Key Points to Assess:**
${keyPoints.map(point => `- ${point}`).join('\n')}

**Candidate's Response:**
"${userResponse}"

Analyze this response and provide feedback in the following JSON format:

{
  "score": 85,
  "strengths": ["Clear communication", "Relevant examples"],
  "improvements": ["Could provide more specific metrics", "Should elaborate on outcomes"],
  "feedback": "Your response demonstrated good understanding of the role requirements...",
  "followUpSuggestion": "Can you tell me more about the specific challenges you faced in that project?"
}

**Scoring Guidelines:**
- 90-100: Exceptional response with clear examples, strong communication, perfect alignment
- 80-89: Strong response with good examples and communication
- 70-79: Good response but missing some key elements
- 60-69: Adequate response but needs improvement
- Below 60: Poor response requiring significant improvement

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
      
      // Validate the structure
      if (!analysisData.score || !analysisData.feedback) {
        throw new Error('Invalid analysis structure');
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Generate fallback analysis
      analysisData = {
        score: 75,
        strengths: ["Provided a response", "Stayed on topic"],
        improvements: ["Could provide more specific examples", "Consider structuring response better"],
        feedback: "Thank you for your response. While you addressed the question, consider providing more specific examples and details to strengthen your answer.",
        followUpSuggestion: "Can you elaborate on any specific challenges or outcomes from your experience?"
      };
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error analyzing response:', error);
    return NextResponse.json(
      { error: 'Failed to analyze response. Please try again.' },
      { status: 500 }
    );
  }
}