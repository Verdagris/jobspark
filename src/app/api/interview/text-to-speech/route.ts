import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('ELEVENLABS_API_KEY is not set in environment variables');
}

export async function POST(request: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API is not configured. Please check your ELEVENLABS_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const { text, voiceId = 'gsm4lUH9bnZ3pjR1Pw7w', messageType = 'question' }: { 
      text: string; 
      voiceId?: string;
      messageType?: 'question' | 'encouragement' | 'feedback' | 'summary';
    } = await request.json();

    // Adjust voice settings based on message type
    let voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true,
    };

    // Customize voice for different message types
    switch (messageType) {
      case 'encouragement':
        voiceSettings = {
          stability: 0.6,
          similarity_boost: 0.7,
          style: 0.2, // More expressive for encouragement
          use_speaker_boost: true,
        };
        break;
      case 'feedback':
        voiceSettings = {
          stability: 0.7,
          similarity_boost: 0.6,
          style: 0.1, // Slightly more professional
          use_speaker_boost: true,
        };
        break;
      case 'summary':
        voiceSettings = {
          stability: 0.8,
          similarity_boost: 0.5,
          style: 0.0, // Very stable for longer content
          use_speaker_boost: true,
        };
        break;
      default: // question
        voiceSettings = {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true,
        };
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voiceSettings,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech. Please try again.' },
      { status: 500 }
    );
  }
}