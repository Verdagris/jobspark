import { NextRequest, NextResponse } from 'next/server';
import { createInterviewSession } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId,
      role,
      experienceYears,
      context,
      overallScore,
      durationMinutes,
      questionsCount,
      sessionData,
      insights
    }: {
      userId: string;
      role: string;
      experienceYears: number;
      context?: string;
      overallScore: number;
      durationMinutes: number;
      questionsCount: number;
      sessionData: any;
      insights: any;
    } = await request.json();

    const session = await createInterviewSession({
      user_id: userId,
      role,
      experience_years: experienceYears,
      context: context || null,
      overall_score: overallScore,
      duration_minutes: durationMinutes,
      questions_count: questionsCount,
      session_data: sessionData,
      insights
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error saving interview session:', error);
    return NextResponse.json(
      { error: 'Failed to save interview session. Please try again.' },
      { status: 500 }
    );
  }
}