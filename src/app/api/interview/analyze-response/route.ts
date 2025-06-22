import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper function to analyze sentiment
function analyzeSentiment(text: string): { sentiment: string; confidence: number } {
  const positiveWords = ['excellent', 'great', 'good', 'positive', 'successful', 'achieved', 'accomplished', 'improved', 'effective', 'efficient'];
  const negativeWords = ['difficult', 'challenging', 'failed', 'problem', 'issue', 'struggle', 'hard', 'tough', 'negative'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return { sentiment: 'neutral', confidence: 0.5 };
  
  const positiveRatio = positiveCount / total;
  if (positiveRatio > 0.6) return { sentiment: 'positive', confidence: positiveRatio };
  if (positiveRatio < 0.4) return { sentiment: 'negative', confidence: 1 - positiveRatio };
  return { sentiment: 'neutral', confidence: 0.5 };
}

// Helper function to calculate speaking pace (words per minute)
function calculateSpeakingPace(text: string, durationMs: number): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = durationMs / 60000;
  return minutes > 0 ? Math.round(words / minutes) : 0;
}

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
      experienceYears,
      duration
    }: {
      question: string;
      response: string;
      questionType: string;
      keyPoints: string[];
      role: string;
      experienceYears: number;
      duration: number;
    } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Calculate additional metrics
    const sentiment = analyzeSentiment(userResponse);
    const speakingPace = calculateSpeakingPace(userResponse, duration);
    const responseLength = userResponse.trim().split(/\s+/).length;
    const durationSeconds = Math.round(duration / 1000);

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

**Response Metrics:**
- Duration: ${durationSeconds} seconds
- Word Count: ${responseLength} words
- Speaking Pace: ${speakingPace} words per minute
- Sentiment: ${sentiment.sentiment} (confidence: ${(sentiment.confidence * 100).toFixed(1)}%)

Analyze this response and provide feedback in the following JSON format:

{
  "score": 85,
  "strengths": ["Clear communication", "Relevant examples"],
  "improvements": ["Could provide more specific metrics", "Should elaborate on outcomes"],
  "feedback": "Your response demonstrated good understanding of the role requirements...",
  "metrics": {
    "clarity": 85,
    "relevance": 90,
    "structure": 80,
    "confidence": 85,
    "pace": "appropriate",
    "sentiment": "positive"
  },
  "timeAnalysis": {
    "duration": ${durationSeconds},
    "pacing": "${speakingPace < 120 ? 'slow' : speakingPace > 180 ? 'fast' : 'appropriate'}",
    "recommendation": "Consider speaking slightly faster to show confidence"
  }
}

**Scoring Guidelines:**
- 90-100: Exceptional response with clear examples, strong communication, perfect alignment
- 80-89: Strong response with good examples and communication
- 70-79: Good response but missing some key elements
- 60-69: Adequate response but needs improvement
- Below 60: Poor response requiring significant improvement

**Pacing Guidelines:**
- Ideal speaking pace: 120-180 words per minute
- Below 120: Too slow, may indicate nervousness or lack of preparation
- Above 180: Too fast, may indicate nervousness or rushing

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
      
      // Generate fallback analysis with metrics
      analysisData = {
        score: Math.max(60, Math.min(85, 70 + (responseLength > 50 ? 10 : 0) + (sentiment.sentiment === 'positive' ? 5 : 0))),
        strengths: ["Provided a response", "Stayed on topic"],
        improvements: ["Could provide more specific examples", "Consider structuring response better"],
        feedback: "Thank you for your response. While you addressed the question, consider providing more specific examples and details to strengthen your answer.",
        metrics: {
          clarity: Math.max(60, 80 - (speakingPace < 120 || speakingPace > 180 ? 10 : 0)),
          relevance: 75,
          structure: responseLength > 30 ? 80 : 65,
          confidence: sentiment.sentiment === 'positive' ? 85 : sentiment.sentiment === 'negative' ? 65 : 75,
          pace: speakingPace < 120 ? 'slow' : speakingPace > 180 ? 'fast' : 'appropriate',
          sentiment: sentiment.sentiment
        },
        timeAnalysis: {
          duration: durationSeconds,
          pacing: speakingPace < 120 ? 'slow' : speakingPace > 180 ? 'fast' : 'appropriate',
          recommendation: speakingPace < 120 ? 'Consider speaking slightly faster to show confidence' :
                         speakingPace > 180 ? 'Try to slow down and speak more deliberately' :
                         'Good pacing - maintain this rhythm'
        }
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