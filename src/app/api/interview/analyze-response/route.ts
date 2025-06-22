import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Enhanced speech analysis functions
function analyzeSentiment(text: string): { sentiment: string; confidence: number } {
  const positiveWords = ['excellent', 'great', 'good', 'positive', 'successful', 'achieved', 'accomplished', 'improved', 'effective', 'efficient', 'excited', 'passionate', 'confident'];
  const negativeWords = ['difficult', 'challenging', 'failed', 'problem', 'issue', 'struggle', 'hard', 'tough', 'negative', 'worried', 'concerned', 'frustrated'];
  
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

function calculateSpeakingPace(text: string, durationMs: number): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = durationMs / 60000;
  return minutes > 0 ? Math.round(words / minutes) : 0;
}

function detectFillerWords(text: string): { count: number; percentage: number; fillers: string[] } {
  const fillerPatterns = [
    /\b(um|uh|er|ah|like|you know|sort of|kind of|basically|actually|literally|obviously|definitely|totally|really|very|just|so|well|okay|right|yeah|yes|no|hmm|mmm)\b/gi,
    /\b(I mean|you see|let me think|how do I put this|what I'm trying to say|if that makes sense)\b/gi
  ];
  
  const words = text.trim().split(/\s+/);
  const totalWords = words.length;
  let fillerCount = 0;
  const foundFillers: string[] = [];
  
  fillerPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      fillerCount += matches.length;
      foundFillers.push(...matches.map(m => m.toLowerCase()));
    }
  });
  
  const percentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;
  
  return {
    count: fillerCount,
    percentage: Math.round(percentage * 10) / 10,
    fillers: [...new Set(foundFillers)] // Remove duplicates
  };
}

function analyzeGrammar(text: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  
  // Check for common grammar issues
  const grammarChecks = [
    {
      pattern: /\b(me and|between you and I|could of|would of|should of)\b/gi,
      issue: "Common grammar mistakes detected",
      penalty: 10
    },
    {
      pattern: /\b(ain't|gonna|wanna|gotta)\b/gi,
      issue: "Informal contractions used",
      penalty: 5
    },
    {
      pattern: /[.!?]\s*[a-z]/g,
      issue: "Sentences not properly capitalized",
      penalty: 5
    },
    {
      pattern: /\b(this|that|these|those)\s+(kind|type|sort)\s+of\s+(thing|stuff)\b/gi,
      issue: "Vague language - be more specific",
      penalty: 3
    }
  ];
  
  grammarChecks.forEach(check => {
    const matches = text.match(check.pattern);
    if (matches && matches.length > 0) {
      issues.push(check.issue);
      score -= check.penalty * matches.length;
    }
  });
  
  // Check sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;
  
  if (avgWordsPerSentence > 25) {
    issues.push("Sentences are too long - aim for 15-20 words per sentence");
    score -= 10;
  } else if (avgWordsPerSentence < 8) {
    issues.push("Sentences are too short - try to elaborate more");
    score -= 5;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues
  };
}

function analyzeClarity(text: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  
  // Check for clarity issues
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Repetitive words
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 3) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  const repetitiveWords = Object.entries(wordFreq).filter(([_, count]) => count > 3);
  if (repetitiveWords.length > 0) {
    issues.push(`Repetitive words detected: ${repetitiveWords.map(([word]) => word).join(', ')}`);
    score -= repetitiveWords.length * 5;
  }
  
  // Check for unclear transitions
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently'];
  const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
  
  if (sentences.length > 3 && !hasTransitions) {
    issues.push("Consider using transition words to connect your ideas");
    score -= 10;
  }
  
  // Check for passive voice overuse
  const passivePatterns = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
  const passiveMatches = text.match(passivePatterns);
  if (passiveMatches && passiveMatches.length > sentences.length * 0.3) {
    issues.push("Too much passive voice - use active voice for stronger impact");
    score -= 15;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues
  };
}

function analyzeConfidence(text: string, speakingPace: number): { score: number; indicators: string[] } {
  const indicators: string[] = [];
  let score = 80; // Start with neutral confidence
  
  // Positive confidence indicators
  const confidentPhrases = [
    /\b(I'm confident|I believe|I know|I'm certain|definitely|absolutely|clearly|obviously)\b/gi,
    /\b(I led|I managed|I achieved|I accomplished|I delivered|I created|I developed)\b/gi
  ];
  
  confidentPhrases.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 5;
      indicators.push("Uses confident language");
    }
  });
  
  // Negative confidence indicators
  const uncertainPhrases = [
    /\b(I think maybe|I'm not sure|I guess|perhaps|possibly|I don't know|I'm not certain)\b/gi,
    /\b(sort of|kind of|maybe|probably|I suppose)\b/gi
  ];
  
  uncertainPhrases.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      score -= matches.length * 8;
      indicators.push("Uses uncertain language");
    }
  });
  
  // Speaking pace confidence indicators
  if (speakingPace < 100) {
    score -= 15;
    indicators.push("Speaking too slowly may indicate nervousness");
  } else if (speakingPace > 200) {
    score -= 10;
    indicators.push("Speaking too quickly may indicate nervousness");
  } else {
    indicators.push("Good speaking pace");
  }
  
  // Question marks in statements (uptalk)
  const uptalkPattern = /[^?]\?\s/g;
  const uptalkMatches = text.match(uptalkPattern);
  if (uptalkMatches && uptalkMatches.length > 0) {
    score -= uptalkMatches.length * 5;
    indicators.push("Avoid uptalk - make statements sound definitive");
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    indicators
  };
}

function generateSpeechCoaching(
  fillerAnalysis: any,
  grammarAnalysis: any,
  clarityAnalysis: any,
  confidenceAnalysis: any,
  speakingPace: number,
  duration: number
): string[] {
  const coaching: string[] = [];
  
  // Speaking pace coaching
  if (speakingPace < 120) {
    coaching.push("🎯 **Speaking Pace**: You're speaking quite slowly (${speakingPace} WPM). Try to increase your pace to 120-150 WPM to sound more confident and engaging.");
  } else if (speakingPace > 180) {
    coaching.push("🎯 **Speaking Pace**: You're speaking very quickly (${speakingPace} WPM). Slow down to 120-150 WPM to ensure clarity and give the interviewer time to process your points.");
  } else {
    coaching.push("✅ **Speaking Pace**: Excellent pace (${speakingPace} WPM) - you're speaking at an ideal rate for interviews.");
  }
  
  // Filler words coaching
  if (fillerAnalysis.percentage > 5) {
    coaching.push(`🎯 **Filler Words**: You used ${fillerAnalysis.count} filler words (${fillerAnalysis.percentage}% of your speech). Common fillers: "${fillerAnalysis.fillers.join('", "')}". Practice pausing instead of using fillers.`);
  } else if (fillerAnalysis.percentage > 2) {
    coaching.push(`⚠️ **Filler Words**: Moderate use of fillers (${fillerAnalysis.percentage}%). Try to reduce words like "${fillerAnalysis.fillers.join('", "')}" by pausing briefly instead.`);
  } else {
    coaching.push("✅ **Filler Words**: Great job minimizing filler words! Your speech sounds professional and polished.");
  }
  
  // Grammar coaching
  if (grammarAnalysis.score < 80) {
    coaching.push(`🎯 **Grammar**: Grammar score: ${grammarAnalysis.score}/100. Issues: ${grammarAnalysis.issues.join('; ')}. Practice speaking in complete, grammatically correct sentences.`);
  } else if (grammarAnalysis.score < 95) {
    coaching.push(`⚠️ **Grammar**: Good grammar overall (${grammarAnalysis.score}/100), but watch for: ${grammarAnalysis.issues.join('; ')}.`);
  } else {
    coaching.push("✅ **Grammar**: Excellent grammar and sentence structure!");
  }
  
  // Clarity coaching
  if (clarityAnalysis.score < 80) {
    coaching.push(`🎯 **Clarity**: Clarity score: ${clarityAnalysis.score}/100. Areas to improve: ${clarityAnalysis.issues.join('; ')}. Focus on clear, concise communication.`);
  } else if (clarityAnalysis.score < 95) {
    coaching.push(`⚠️ **Clarity**: Good clarity (${clarityAnalysis.score}/100). Minor improvements: ${clarityAnalysis.issues.join('; ')}.`);
  } else {
    coaching.push("✅ **Clarity**: Your message was very clear and well-structured!");
  }
  
  // Confidence coaching
  if (confidenceAnalysis.score < 70) {
    coaching.push(`🎯 **Confidence**: Confidence score: ${confidenceAnalysis.score}/100. ${confidenceAnalysis.indicators.join('; ')}. Use more definitive language and avoid uncertain phrases.`);
  } else if (confidenceAnalysis.score < 85) {
    coaching.push(`⚠️ **Confidence**: Moderate confidence (${confidenceAnalysis.score}/100). ${confidenceAnalysis.indicators.join('; ')}.`);
  } else {
    coaching.push("✅ **Confidence**: You sound confident and self-assured!");
  }
  
  // Duration coaching
  if (duration < 30000) { // Less than 30 seconds
    coaching.push("🎯 **Response Length**: Your response was quite brief. Aim for 1-2 minutes to fully demonstrate your knowledge and experience.");
  } else if (duration > 180000) { // More than 3 minutes
    coaching.push("🎯 **Response Length**: Your response was quite long. Try to be more concise and focus on the most relevant points (aim for 1-2 minutes).");
  } else {
    coaching.push("✅ **Response Length**: Perfect timing for your response!");
  }
  
  return coaching;
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

    // Perform comprehensive speech analysis
    const sentiment = analyzeSentiment(userResponse);
    const speakingPace = calculateSpeakingPace(userResponse, duration);
    const fillerAnalysis = detectFillerWords(userResponse);
    const grammarAnalysis = analyzeGrammar(userResponse);
    const clarityAnalysis = analyzeClarity(userResponse);
    const confidenceAnalysis = analyzeConfidence(userResponse, speakingPace);
    
    const responseLength = userResponse.trim().split(/\s+/).length;
    const durationSeconds = Math.round(duration / 1000);
    
    // Generate speech coaching
    const speechCoaching = generateSpeechCoaching(
      fillerAnalysis,
      grammarAnalysis,
      clarityAnalysis,
      confidenceAnalysis,
      speakingPace,
      duration
    );

    const prompt = `
You are an expert interview coach analyzing a candidate's response to an interview question. Focus on content quality, relevance, and structure.

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

**Speech Analysis Results:**
- Duration: ${durationSeconds} seconds
- Word Count: ${responseLength} words
- Speaking Pace: ${speakingPace} words per minute
- Filler Words: ${fillerAnalysis.count} (${fillerAnalysis.percentage}% of speech)
- Grammar Score: ${grammarAnalysis.score}/100
- Clarity Score: ${clarityAnalysis.score}/100
- Confidence Score: ${confidenceAnalysis.score}/100
- Sentiment: ${sentiment.sentiment}

Analyze this response and provide feedback in the following JSON format:

{
  "score": 85,
  "strengths": ["Clear communication", "Relevant examples"],
  "improvements": ["Could provide more specific metrics", "Should elaborate on outcomes"],
  "feedback": "Your response demonstrated good understanding of the role requirements...",
  "contentAnalysis": {
    "relevance": 90,
    "structure": 85,
    "examples": 80,
    "depth": 75
  },
  "speechMetrics": {
    "pace": ${speakingPace},
    "paceRating": "${speakingPace < 120 ? 'slow' : speakingPace > 180 ? 'fast' : 'optimal'}",
    "fillerWords": ${fillerAnalysis.count},
    "fillerPercentage": ${fillerAnalysis.percentage},
    "grammarScore": ${grammarAnalysis.score},
    "clarityScore": ${clarityAnalysis.score},
    "confidenceScore": ${confidenceAnalysis.score},
    "overallSpeechScore": ${Math.round((grammarAnalysis.score + clarityAnalysis.score + confidenceAnalysis.score) / 3)}
  },
  "speechCoaching": ${JSON.stringify(speechCoaching)},
  "detailedFeedback": {
    "fillerWords": "${fillerAnalysis.fillers.join(', ')}",
    "grammarIssues": ${JSON.stringify(grammarAnalysis.issues)},
    "clarityIssues": ${JSON.stringify(clarityAnalysis.issues)},
    "confidenceIndicators": ${JSON.stringify(confidenceAnalysis.indicators)}
  }
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
      
      // Generate fallback analysis with comprehensive speech metrics
      const overallSpeechScore = Math.round((grammarAnalysis.score + clarityAnalysis.score + confidenceAnalysis.score) / 3);
      
      analysisData = {
        score: Math.max(60, Math.min(85, 70 + (responseLength > 50 ? 10 : 0) + (sentiment.sentiment === 'positive' ? 5 : 0))),
        strengths: ["Provided a response", "Stayed on topic"],
        improvements: ["Could provide more specific examples", "Consider structuring response better"],
        feedback: "Thank you for your response. While you addressed the question, consider providing more specific examples and details to strengthen your answer.",
        contentAnalysis: {
          relevance: 75,
          structure: responseLength > 30 ? 80 : 65,
          examples: 70,
          depth: responseLength > 50 ? 75 : 60
        },
        speechMetrics: {
          pace: speakingPace,
          paceRating: speakingPace < 120 ? 'slow' : speakingPace > 180 ? 'fast' : 'optimal',
          fillerWords: fillerAnalysis.count,
          fillerPercentage: fillerAnalysis.percentage,
          grammarScore: grammarAnalysis.score,
          clarityScore: clarityAnalysis.score,
          confidenceScore: confidenceAnalysis.score,
          overallSpeechScore
        },
        speechCoaching,
        detailedFeedback: {
          fillerWords: fillerAnalysis.fillers.join(', '),
          grammarIssues: grammarAnalysis.issues,
          clarityIssues: clarityAnalysis.issues,
          confidenceIndicators: confidenceAnalysis.indicators
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