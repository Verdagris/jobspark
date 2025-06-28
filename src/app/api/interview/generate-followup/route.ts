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
      originalQuestion, 
      response, 
      analysis,
      role 
    }: {
      originalQuestion: string;
      response: string;
      analysis: any;
      role: string;
    } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an experienced interviewer conducting a follow-up question based on the candidate's response.

**Original Question:** "${originalQuestion}"

**Candidate's Response:** "${response}"

**Analysis of Response:** 
- Score: ${analysis.score}/100
- Strengths: ${analysis.strengths?.join(', ') || 'None identified'}
- Areas for improvement: ${analysis.improvements?.join(', ') || 'None identified'}

**Role:** ${role}

Generate a natural, conversational follow-up question that:
1. Builds on their response naturally
2. Probes deeper into their experience or thought process
3. Helps them elaborate on vague points or provide more specific examples
4. Feels like a natural conversation flow
5. Is appropriate for the role they're interviewing for

The follow-up should feel like what a real interviewer would ask to better understand the candidate's experience or to clarify something they mentioned.

**CRITICAL: Return ONLY the follow-up question text. No explanations, no formatting, no additional commentary. Just the question.**

Follow-up question:
`;

    const result = await model.generateContent(prompt);
    const response_text = await result.response;
    let followUpQuestion = response_text.text().trim();

    // Clean up any unwanted formatting
    followUpQuestion = followUpQuestion
      .replace(/^(Follow-up question:|Question:|Here's a follow-up:).*?:/i, '')
      .replace(/^\*\*.*?\*\*:?\s*/i, '')
      .replace(/^"(.*)"$/, '$1') // Remove surrounding quotes if present
      .trim();

    return NextResponse.json({ followUpQuestion });
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up question. Please try again.' },
      { status: 500 }
    );
  }
}