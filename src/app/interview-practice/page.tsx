"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Play,
  Pause,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Send,
  User,
  Briefcase,
  FileText,
  Star,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  History,
  BarChart3,
  Zap,
  Brain,
  MessageCircle,
  Timer,
  TrendingDown,
  Users,
  DollarSign,
  Settings,
  Info,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAutoInterview } from "@/hooks/useAutoInterview";
import { getUserProfile, getUserExperiences, getUserEducation, getUserSkills, getUserInterviewSessions, getInterviewInsights } from "@/lib/database";

interface Question {
  id: number;
  question: string;
  type: string;
  expectedDuration: number;
  keyPoints: string[];
}

interface QuestionResponse {
  question: string;
  response: string;
  score: number;
  type: string;
  duration: number;
  analysis?: {
    strengths: string[];
    improvements: string[];
    feedback: string;
    speechMetrics?: any;
    speechCoaching?: string[];
    detailedFeedback?: any;
  };
}

interface InterviewSetup {
  sessionType: string;
  role: string;
  experienceYears: number;
  context: string;
  questionCount: number;
}

interface PastSession {
  id: string;
  role: string;
  overall_score: number;
  created_at: string;
  insights: any;
}

interface SessionTypeConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  tips: string[];
  bestPractices: string[];
  duration: string;
  questionCount: number;
}

const sessionTypes: SessionTypeConfig[] = [
  {
    id: 'introduction',
    title: 'Introducing Yourself',
    description: 'Master your elevator pitch and personal branding',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    duration: '10-15 minutes',
    questionCount: 4,
    tips: [
      'Keep your introduction to 60-90 seconds',
      'Follow the Present-Past-Future structure',
      'Highlight your unique value proposition',
      'Practice your elevator pitch until it feels natural'
    ],
    bestPractices: [
      'Start with your current role and key strengths',
      'Briefly mention relevant past experience',
      'Connect your background to the role you want',
      'End with enthusiasm about the opportunity',
      'Avoid personal details unrelated to work',
      'Practice different versions for different audiences'
    ]
  },
  {
    id: 'experience',
    title: 'Highlighting Experience',
    description: 'Showcase your achievements using the STAR method',
    icon: Briefcase,
    color: 'from-green-500 to-emerald-500',
    duration: '15-20 minutes',
    questionCount: 5,
    tips: [
      'Use the STAR method: Situation, Task, Action, Result',
      'Quantify your achievements with specific numbers',
      'Choose examples that show progression and growth',
      'Prepare 3-5 detailed stories covering different skills'
    ],
    bestPractices: [
      'Set the scene clearly but concisely',
      'Focus more on your actions than the situation',
      'Highlight the impact and results you achieved',
      'Show what you learned from each experience',
      'Choose examples relevant to the target role',
      'Practice timing - aim for 2-3 minutes per story'
    ]
  },
  {
    id: 'strengths-weaknesses',
    title: 'Strengths & Weaknesses',
    description: 'Demonstrate self-awareness and growth mindset',
    icon: Target,
    color: 'from-purple-500 to-pink-500',
    duration: '10-15 minutes',
    questionCount: 4,
    tips: [
      'Choose genuine strengths relevant to the role',
      'Support strengths with specific examples',
      'For weaknesses, show how you\'re improving',
      'Avoid cliché weaknesses like "perfectionist"'
    ],
    bestPractices: [
      'Pick 2-3 core strengths that differentiate you',
      'Use the CAR method: Context, Action, Result',
      'For weaknesses, choose real areas for improvement',
      'Show concrete steps you\'re taking to improve',
      'Demonstrate self-reflection and learning',
      'Turn weaknesses into development opportunities'
    ]
  },
  {
    id: 'salary',
    title: 'Discussing Salary',
    description: 'Navigate compensation conversations confidently',
    icon: DollarSign,
    color: 'from-orange-500 to-red-500',
    duration: '10-15 minutes',
    questionCount: 4,
    tips: [
      'Research market rates for your role and location',
      'Consider total compensation, not just salary',
      'Be prepared to justify your expectations',
      'Know when to negotiate and when to accept'
    ],
    bestPractices: [
      'Let the employer bring up salary first if possible',
      'Provide a range based on market research',
      'Emphasize your value and unique contributions',
      'Consider benefits, growth opportunities, and culture',
      'Be flexible but know your minimum acceptable offer',
      'Practice discussing compensation confidently'
    ]
  },
  {
    id: 'job-specific',
    title: 'Job-Specific Interview',
    description: 'Technical and role-specific competency questions',
    icon: Settings,
    color: 'from-indigo-500 to-purple-500',
    duration: '15-25 minutes',
    questionCount: 6,
    tips: [
      'Review the job description thoroughly',
      'Prepare examples that match required skills',
      'Research industry trends and best practices',
      'Be ready to discuss technical challenges'
    ],
    bestPractices: [
      'Study the company and role requirements',
      'Prepare specific examples for each key skill',
      'Show continuous learning and adaptation',
      'Discuss how you solve problems in your field',
      'Demonstrate knowledge of industry standards',
      'Connect your experience to their needs'
    ]
  },
  {
    id: 'mock-interview',
    title: 'Full Mock Interview',
    description: 'Complete interview simulation with comprehensive feedback',
    icon: MessageSquare,
    color: 'from-slate-600 to-slate-800',
    duration: '25-35 minutes',
    questionCount: 8,
    tips: [
      'Treat this like a real interview',
      'Prepare questions to ask the interviewer',
      'Practice your body language and tone',
      'Review common interview questions beforehand'
    ],
    bestPractices: [
      'Arrive mentally prepared and confident',
      'Listen carefully to each question',
      'Take a moment to think before answering',
      'Maintain good eye contact and posture',
      'Ask thoughtful questions about the role',
      'Follow up with a thank you message'
    ]
  }
];

const InterviewPracticePage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'selection' | 'tips' | 'setup' | 'interview' | 'results'>('selection');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionTypeConfig | null>(null);
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup>({
    sessionType: '',
    role: '',
    experienceYears: 1,
    context: '',
    questionCount: 6
  });
  
  // Interview state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null);
  
  // Audio state
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Speech recognition with auto-detection
  const {
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
    isSupported: speechSupported,
    confidence
  } = useSpeechToText();

  // Auto interview management
  const {
    isWaitingForResponse,
    silenceDetected,
    startWaitingForResponse,
    stopWaitingForResponse,
    resetSilenceDetection,
    onSilenceDetected,
    detectSilence
  } = useAutoInterview(2000, 15); // Reduced to 2 seconds silence, min 15 chars
  
  // Timing
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const [currentQuestionDuration, setCurrentQuestionDuration] = useState(0);
  
  // Results
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  
  // Past sessions
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [loadingPastSessions, setLoadingPastSessions] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for current question
  useEffect(() => {
    if (currentStep === 'interview' && questionStartTime > 0) {
      timerRef.current = setInterval(() => {
        setCurrentQuestionDuration(Date.now() - questionStartTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentStep, questionStartTime]);

  // Auto-detect silence and move to next question
  useEffect(() => {
    if (isWaitingForResponse && isListening) {
      detectSilence(transcript, isListening);
    }
  }, [transcript, isListening, isWaitingForResponse, detectSilence]);

  // Set up silence detection callback
  useEffect(() => {
    onSilenceDetected(() => {
      if (transcript.trim().length > 15) {
        submitResponse();
      }
    });
  }, [transcript]);

  // Load past sessions on component mount
  useEffect(() => {
    if (user) {
      loadPastSessions();
    }
  }, [user]);

  const loadPastSessions = async () => {
    if (!user) return;
    
    setLoadingPastSessions(true);
    try {
      const sessions = await getUserInterviewSessions(user.id);
      setPastSessions(sessions.slice(0, 5)); // Show last 5 sessions
    } catch (error) {
      console.error('Error loading past sessions:', error);
    } finally {
      setLoadingPastSessions(false);
    }
  };

  // Load user CV data
  const loadUserCVData = async () => {
    if (!user) return null;
    
    try {
      const [profile, experiences, education, skills] = await Promise.all([
        getUserProfile(user.id),
        getUserExperiences(user.id),
        getUserEducation(user.id),
        getUserSkills(user.id)
      ]);
      
      return {
        personalInfo: {
          fullName: profile?.full_name,
          professionalSummary: profile?.professional_summary
        },
        experiences,
        education,
        skills
      };
    } catch (error) {
      console.error('Error loading CV data:', error);
      return null;
    }
  };

  // Generate interview questions
  const generateQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const cvData = await loadUserCVData();
      
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: interviewSetup.role,
          experienceYears: interviewSetup.experienceYears,
          context: interviewSetup.context,
          cvData,
          sessionType: interviewSetup.sessionType,
          questionCount: interviewSetup.questionCount
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate questions');
      
      const data = await response.json();
      setQuestions(data.questions);
      setCurrentStep('interview');
      setInterviewStartTime(Date.now());
      setQuestionStartTime(Date.now());
      
      // Auto-start the interview flow with reduced delay
      setTimeout(() => {
        if (audioEnabled && data.questions.length > 0) {
          playQuestionAndStartListening(data.questions[0].question);
        } else {
          startListeningFlow();
        }
      }, 500); // Reduced from 1000ms to 500ms
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Play question and automatically start listening with South African voice
  const playQuestionAndStartListening = async (questionText: string) => {
    if (!audioEnabled) {
      startListeningFlow();
      return;
    }
    
    try {
      setIsPlayingQuestion(true);
      
      const response = await fetch('/api/interview/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: questionText,
          voiceId: 'onwK4e9ZLuTAKqWW03F9' // South African English voice
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate speech');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsPlayingQuestion(false);
        URL.revokeObjectURL(audioUrl);
        // Reduced delay before starting to listen
        setTimeout(() => {
          startListeningFlow();
        }, 300); // Reduced from 500ms to 300ms
      };
      
      audio.onerror = () => {
        setIsPlayingQuestion(false);
        URL.revokeObjectURL(audioUrl);
        startListeningFlow();
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing question:', error);
      setIsPlayingQuestion(false);
      startListeningFlow();
    }
  };

  // Start the listening flow automatically
  const startListeningFlow = () => {
    if (speechSupported) {
      // Small delay to ensure audio has stopped
      setTimeout(() => {
        startListening();
        startWaitingForResponse();
      }, 100);
    }
  };

  // Stop current audio and allow interruption
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingQuestion(false);
      // Start listening immediately when interrupted
      startListeningFlow();
    }
  };

  // Detect if user starts speaking while audio is playing
  useEffect(() => {
    if (isPlayingQuestion && transcript.length > 5) {
      stopAudio();
    }
  }, [transcript, isPlayingQuestion]);

  // Submit response and move to next question with faster processing
  const submitResponse = async () => {
    if (!finalTranscript.trim() && !interimTranscript.trim()) return;
    
    const responseText = (finalTranscript + ' ' + interimTranscript).trim();
    const currentQuestion = questions[currentQuestionIndex];
    const duration = Date.now() - questionStartTime;
    
    // Stop listening and waiting
    stopListening();
    stopWaitingForResponse();
    resetSilenceDetection();
    
    setIsAnalyzing(true);
    
    try {
      // Analyze the response with session type context
      const analysisResponse = await fetch('/api/interview/analyze-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          response: responseText,
          questionType: currentQuestion.type,
          keyPoints: currentQuestion.keyPoints,
          role: interviewSetup.role,
          experienceYears: interviewSetup.experienceYears,
          duration,
          sessionType: interviewSetup.sessionType,
          isFollowUp: false
        })
      });
      
      if (!analysisResponse.ok) throw new Error('Failed to analyze response');
      
      const analysis = await analysisResponse.json();
      
      // Save the response
      const newResponse: QuestionResponse = {
        question: currentQuestion.question,
        response: responseText,
        score: analysis.score,
        type: currentQuestion.type,
        duration,
        analysis: {
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          feedback: analysis.feedback,
          speechMetrics: analysis.speechMetrics,
          speechCoaching: analysis.speechCoaching,
          detailedFeedback: analysis.detailedFeedback
        }
      };
      
      setResponses(prev => [...prev, newResponse]);
      
      // Decide next action based on session type and response quality
      const shouldFollowUp = interviewSetup.sessionType !== 'mock-interview' && 
                            analysis.score < 75 && 
                            Math.random() > 0.4; // 60% chance for follow-up on low scores
      
      if (shouldFollowUp && currentQuestionIndex < questions.length - 1) {
        // Generate and ask follow-up question
        generateFollowUpQuestion(currentQuestion.question, responseText, analysis);
      } else {
        // Move to next question or finish
        proceedToNext();
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      alert('Failed to analyze response. Please try again.');
      proceedToNext();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate follow-up question
  const generateFollowUpQuestion = async (originalQuestion: string, response: string, analysis: any) => {
    setIsGeneratingFollowUp(true);
    
    try {
      const followUpResponse = await fetch('/api/interview/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion,
          response,
          analysis,
          role: interviewSetup.role
        })
      });
      
      if (!followUpResponse.ok) throw new Error('Failed to generate follow-up');
      
      const { followUpQuestion } = await followUpResponse.json();
      setPendingFollowUp(followUpQuestion);
      
      // Provide quick feedback and ask follow-up
      const feedbackText = `${analysis.feedback.split('.')[0]}. Let me ask you this:`;
      
      setTimeout(() => {
        if (audioEnabled) {
          playQuestionAndStartListening(`${feedbackText} ${followUpQuestion}`);
        } else {
          startListeningFlow();
        }
        setPendingFollowUp(null);
        setQuestionStartTime(Date.now());
        resetTranscript();
      }, 800); // Reduced delay
      
    } catch (error) {
      console.error('Error generating follow-up:', error);
      proceedToNext();
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  // Proceed to next question or finish
  const proceedToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      resetTranscript();
      
      // Reduced pause between questions
      setTimeout(() => {
        if (audioEnabled) {
          playQuestionAndStartListening(questions[currentQuestionIndex + 1].question);
        } else {
          startListeningFlow();
        }
      }, 1000); // Reduced from 2000ms to 1000ms
    } else {
      // Interview complete
      finishInterview(responses);
    }
  };

  // Finish interview and generate final analysis
  const finishInterview = async (allResponses: QuestionResponse[]) => {
    setIsGeneratingAnalysis(true);
    
    try {
      const overallDuration = Date.now() - interviewStartTime;
      
      const analysisResponse = await fetch('/api/interview/final-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: interviewSetup.role,
          experienceYears: interviewSetup.experienceYears,
          responses: allResponses,
          overallDuration,
          sessionType: interviewSetup.sessionType
        })
      });
      
      if (!analysisResponse.ok) throw new Error('Failed to generate final analysis');
      
      const analysis = await analysisResponse.json();
      setFinalAnalysis(analysis);
      
      // Save session to database
      if (user) {
        try {
          await fetch('/api/interview/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              role: interviewSetup.role,
              experienceYears: interviewSetup.experienceYears,
              context: interviewSetup.context,
              overallScore: analysis.overallScore,
              durationMinutes: Math.round(overallDuration / 60000),
              questionsCount: questions.length,
              sessionData: {
                questions,
                responses: allResponses,
                setup: interviewSetup
              },
              insights: analysis
            })
          });
        } catch (error) {
          console.error('Error saving session:', error);
          // Don't fail the interview if saving fails
        }
      }
      
      setCurrentStep('results');
    } catch (error) {
      console.error('Error generating final analysis:', error);
      alert('Failed to generate final analysis. Please try again.');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Reset interview
  const resetInterview = () => {
    setCurrentStep('selection');
    setSelectedSessionType(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setFinalAnalysis(null);
    setPendingFollowUp(null);
    resetTranscript();
    stopAudio();
    stopListening();
    stopWaitingForResponse();
    setCurrentQuestionDuration(0);
  };

  // Handle session type selection
  const handleSessionTypeSelect = (sessionType: SessionTypeConfig) => {
    setSelectedSessionType(sessionType);
    setInterviewSetup(prev => ({
      ...prev,
      sessionType: sessionType.id,
      questionCount: sessionType.questionCount
    }));
    setCurrentStep('tips');
  };

  // Handle proceeding from tips to setup
  const proceedToSetup = () => {
    setCurrentStep('setup');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-8 h-8 text-sky-500" />
                <span className="text-2xl font-bold text-slate-900">JobSpark</span>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-4" />
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-8 h-8 text-purple-500" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    AI Interview Practice
                  </h1>
                  <p className="text-sm text-slate-600">
                    {currentStep === 'selection' && 'Choose your practice session'}
                    {currentStep === 'tips' && 'Tips & Best Practices'}
                    {currentStep === 'setup' && 'Set up your session'}
                    {currentStep === 'interview' && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                    {currentStep === 'results' && 'Session Complete'}
                  </p>
                </div>
              </div>
            </div>

            {currentStep === 'interview' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {Math.floor(currentQuestionDuration / 60000)}:
                    {Math.floor((currentQuestionDuration % 60000) / 1000).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  onClick={resetInterview}
                  className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Session Type Selection */}
          {currentStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Choose Your Practice Session
                </h2>
                <p className="text-lg text-slate-600">
                  Select the type of interview practice you'd like to focus on
                </p>
              </div>

              {/* Past Sessions */}
              {pastSessions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <History className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Recent Practice Sessions</h3>
                    </div>
                    <button
                      onClick={() => setShowPastSessions(!showPastSessions)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      {showPastSessions ? 'Hide' : 'View All'}
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {pastSessions.slice(0, showPastSessions ? pastSessions.length : 3).map((session) => (
                      <div key={session.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900 text-sm">{session.role}</span>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-bold text-purple-600">{session.overall_score}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                        {session.insights?.readinessLevel && (
                          <p className="text-xs text-slate-500 mt-1">{session.insights.readinessLevel}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Type Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessionTypes.map((sessionType) => (
                  <motion.div
                    key={sessionType.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSessionTypeSelect(sessionType)}
                    className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${sessionType.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <sessionType.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{sessionType.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{sessionType.description}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{sessionType.duration}</span>
                      <span>{sessionType.questionCount} questions</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tips and Best Practices */}
          {currentStep === 'tips' && selectedSessionType && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${selectedSessionType.color} mb-4`}>
                  <selectedSessionType.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  {selectedSessionType.title}
                </h2>
                <p className="text-lg text-slate-600">
                  {selectedSessionType.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Tips */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-slate-900">Key Tips</h3>
                  </div>
                  <ul className="space-y-3">
                    {selectedSessionType.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-yellow-600 text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className="text-slate-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best Practices */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Award className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-bold text-slate-900">Best Practices</h3>
                  </div>
                  <ul className="space-y-3">
                    {selectedSessionType.bestPractices.map((practice, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">What to Expect</p>
                    <ul className="space-y-1">
                      <li>• Duration: {selectedSessionType.duration}</li>
                      <li>• Questions: {selectedSessionType.questionCount} focused questions</li>
                      <li>• Format: Conversational with real-time feedback</li>
                      <li>• Voice: South African AI coach</li>
                      <li>• Analysis: Detailed performance insights</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('selection')}
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back to Selection
                </button>
                <button
                  onClick={proceedToSetup}
                  className="flex items-center space-x-2 px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <span>Continue to Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Setup Step */}
          {currentStep === 'setup' && selectedSessionType && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Set Up Your {selectedSessionType.title} Session
                </h2>
                <p className="text-lg text-slate-600">
                  Tell us about the role you're preparing for
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What role are you interviewing for? *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        value={interviewSetup.role}
                        onChange={(e) => setInterviewSetup(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer, Product Manager, Data Analyst"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Years of experience required *
                    </label>
                    <select
                      value={interviewSetup.experienceYears}
                      onChange={(e) => setInterviewSetup(prev => ({ ...prev, experienceYears: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={0}>Entry Level (0-1 years)</option>
                      <option value={2}>Junior (2-3 years)</option>
                      <option value={4}>Mid-Level (4-6 years)</option>
                      <option value={7}>Senior (7-10 years)</option>
                      <option value={11}>Lead/Principal (10+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Additional context (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={interviewSetup.context}
                      onChange={(e) => setInterviewSetup(prev => ({ ...prev, context: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Any specific company, industry, or role details that might help customize the questions..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Natural Conversation Experience</p>
                        <p>This session will feel like talking to a real interview coach:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Questions read by South African AI voice</li>
                          <li>Speak naturally - we'll detect when you're done</li>
                          <li>No clicking required during the session</li>
                          <li>Real-time feedback and follow-up questions</li>
                          <li>Detailed speech and content analysis</li>
                        </ul>
                        <label className="flex items-center space-x-2 mt-3">
                          <input
                            type="checkbox"
                            checked={audioEnabled}
                            onChange={(e) => setAudioEnabled(e.target.checked)}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Enable audio features</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {!speechSupported && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">Speech Recognition Not Supported</p>
                          <p>Your browser doesn't support speech recognition. You can still type your responses.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentStep('tips')}
                    className="px-6 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Back to Tips
                  </button>
                  <button
                    onClick={generateQuestions}
                    disabled={!interviewSetup.role.trim() || isLoadingQuestions}
                    className="flex items-center space-x-2 px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingQuestions ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    <span>{isLoadingQuestions ? 'Preparing Session...' : 'Start Practice'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Interview Step */}
          {currentStep === 'interview' && currentQuestion && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-200 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <MessageSquare className="w-4 h-4" />
                    <span>{currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)} Question</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-lg text-slate-800 leading-relaxed flex-1">
                      {pendingFollowUp || currentQuestion.question}
                    </p>
                    <div className="flex items-center space-x-2 ml-4">
                      {audioEnabled && (
                        <button
                          onClick={() => isPlayingQuestion ? stopAudio() : playQuestionAndStartListening(pendingFollowUp || currentQuestion.question)}
                          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          {isPlayingQuestion ? (
                            <VolumeX className="w-5 h-5 text-slate-600" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-slate-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!pendingFollowUp && currentQuestion.keyPoints.length > 0 && (
                    <div className="text-sm text-slate-600">
                      <p className="font-medium mb-2">Key points to consider:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {currentQuestion.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Response Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Your Response</h3>
                    <div className="flex items-center space-x-2">
                      {isAnalyzing && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Analyzing...</span>
                        </div>
                      )}
                      
                      {isGeneratingFollowUp && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Preparing follow-up...</span>
                        </div>
                      )}
                      
                      {isListening && !isAnalyzing && !isGeneratingFollowUp && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Listening...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={6}
                      value={transcript}
                      readOnly
                      placeholder={speechSupported ? "Start speaking to see your response here..." : "Type your response here..."}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-slate-50"
                    />
                  </div>

                  {speechError && (
                    <div className="text-red-600 text-sm flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{speechError}</span>
                    </div>
                  )}

                  {isWaitingForResponse && isListening && !isAnalyzing && (
                    <div className="text-blue-600 text-sm flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>I'll automatically move to the next question when you finish speaking...</span>
                    </div>
                  )}

                  {confidence > 0 && (
                    <div className="text-xs text-slate-500">
                      Speech confidence: {Math.round(confidence * 100)}%
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-slate-500">
                    Expected duration: ~{Math.floor(currentQuestion.expectedDuration / 60)} minutes
                  </div>
                  <div className="text-sm text-slate-600">
                    {currentQuestionIndex === questions.length - 1 ? 'Final question' : `${questions.length - currentQuestionIndex - 1} questions remaining`}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Step */}
          {currentStep === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {isGeneratingAnalysis ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Session</h2>
                  <p className="text-slate-600">Please wait while we generate your personalized feedback...</p>
                </div>
              ) : finalAnalysis ? (
                <>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h2>
                    <p className="text-lg text-slate-600">Here's your comprehensive feedback</p>
                  </div>

                  {/* Overall Score */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <div className="text-6xl font-bold text-purple-600 mb-2">
                      {finalAnalysis.overallScore}%
                    </div>
                    <div className="text-xl font-semibold text-slate-900 mb-4">Overall Score</div>
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full">
                      <Award className="w-5 h-5" />
                      <span className="font-medium">{finalAnalysis.readinessLevel}</span>
                    </div>
                  </div>

                  {/* Speech Coaching Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <Brain className="w-6 h-6 text-blue-500" />
                      <h3 className="text-xl font-bold text-slate-900">Speech Coaching Summary</h3>
                    </div>
                    
                    {responses.length > 0 && responses[0].analysis?.speechMetrics && (
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(responses.reduce((sum, r) => sum + (r.analysis?.speechMetrics?.pace || 0), 0) / responses.length)}
                          </div>
                          <div className="text-sm text-blue-800">Words per minute</div>
                        </div>
                        
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <MessageCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round(responses.reduce((sum, r) => sum + (r.analysis?.speechMetrics?.fillerPercentage || 0), 0) / responses.length * 10) / 10}%
                          </div>
                          <div className="text-sm text-orange-800">Filler words</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(responses.reduce((sum, r) => sum + (r.analysis?.speechMetrics?.overallSpeechScore || 0), 0) / responses.length)}%
                          </div>
                          <div className="text-sm text-green-800">Speech quality</div>
                        </div>
                      </div>
                    )}

                    {/* Individual Question Speech Coaching */}
                    <div className="space-y-4">
                      {responses.map((response, index) => (
                        response.analysis?.speechCoaching && (
                          <div key={index} className="border border-slate-200 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-900 mb-3">
                              Question {index + 1}: Speech Analysis
                            </h4>
                            <div className="space-y-2">
                              {response.analysis.speechCoaching.map((coaching: string, coachIndex: number) => (
                                <div key={coachIndex} className="text-sm">
                                  {coaching.startsWith('✅') ? (
                                    <div className="flex items-start space-x-2 text-green-700">
                                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span>{coaching.replace('✅ ', '')}</span>
                                    </div>
                                  ) : coaching.startsWith('🎯') ? (
                                    <div className="flex items-start space-x-2 text-red-700">
                                      <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span>{coaching.replace('🎯 ', '')}</span>
                                    </div>
                                  ) : coaching.startsWith('⚠️') ? (
                                    <div className="flex items-start space-x-2 text-orange-700">
                                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span>{coaching.replace('⚠️ ', '')}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-start space-x-2 text-slate-700">
                                      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span>{coaching}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Category Scores */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Performance Breakdown</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(finalAnalysis.categoryScores).map(([category, score]: [string, any]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-700 capitalize">
                              {category.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-bold text-slate-900">{score}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Sections */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Star className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {finalAnalysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Areas for Improvement</h3>
                      </div>
                      <ul className="space-y-2">
                        {finalAnalysis.areasForImprovement.map((area: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <Lightbulb className="w-6 h-6 text-yellow-500" />
                      <h3 className="text-xl font-bold text-slate-900">Recommendations</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Action Items</h4>
                        <ul className="space-y-2">
                          {finalAnalysis.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Next Steps</h4>
                        <ul className="space-y-2">
                          {finalAnalysis.nextSteps.map((step: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <ArrowLeft className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0 rotate-180" />
                              <span className="text-slate-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Overall Feedback */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Overall Feedback</h3>
                    <p className="text-slate-700 leading-relaxed">{finalAnalysis.overallFeedback}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={resetInterview}
                      className="px-6 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Practice Again
                    </button>
                    <Link href="/dashboard">
                      <button className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        Back to Dashboard
                      </button>
                    </Link>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewPracticePage;