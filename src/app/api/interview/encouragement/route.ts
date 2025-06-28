import { NextRequest, NextResponse } from 'next/server';
import { getEncouragementMessage, getPostSessionEncouragement, getSessionRecommendations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId,
      type,
      sessionType,
      currentScore
    }: {
      userId: string;
      type: 'pre-session' | 'post-session' | 'recommendations';
      sessionType?: string;
      currentScore?: number;
    } = await request.json();

    let result;

    switch (type) {
      case 'pre-session':
        const encouragement = await getEncouragementMessage(userId, sessionType);
        result = { message: encouragement };
        break;
        
      case 'post-session':
        if (currentScore === undefined || !sessionType) {
          throw new Error('currentScore and sessionType are required for post-session encouragement');
        }
        const postMessage = await getPostSessionEncouragement(userId, currentScore, sessionType);
        result = { message: postMessage };
        break;
        
      case 'recommendations':
        const recommendations = await getSessionRecommendations(userId);
        result = recommendations;
        break;
        
      default:
        throw new Error('Invalid encouragement type');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting encouragement:', error);
    return NextResponse.json(
      { error: 'Failed to get encouragement message. Please try again.' },
      { status: 500 }
    );
  }
}