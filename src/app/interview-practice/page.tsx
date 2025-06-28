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
  Settings,
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

interface CoachingSession {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  focus: string;
  questionTypes: string[];
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

const InterviewCoachPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'selection' | 'setup' | 'interview' | 'results'>('selection');
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
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
  
  // Audio state
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [canInterrupt, setCanInterrupt] = useState(false);
  
  // Conversational state
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isWaitingForFollowUp, setIsWaitingForFollowUp] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  
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
  } = useAutoInterview(3000, 20); // 3 seconds silence, min 20 chars
  
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

  // Coaching session options
  const coachingSessions: CoachingSession[] = [
    {
      id: 'introduction',
      title: 'Introducing Yourself',
      description: 'Master your elevator pitch and personal brand presentation',
      icon: User,
      color: 'from-blue-500 to-cyan-500',
      focus: 'Self-introduction, personal branding, and value proposition',
      questionTypes: ['introduction', 'personal-brand', 'career-overview']
    },
    {
      id: 'experience',
      title: 'Highlighting Experience',
      description: 'Practice discussing your work history and achievements',
      icon: Briefcase,
      color: 'from-green-500 to-emerald-500',
      focus: 'Work experience, achievements, and STAR method responses',
      questionTypes: ['behavioral', 'experience-based', 'achievement']
    },
    {
      id: 'strengths-weaknesses',
      title: 'Strengths & Weaknesses',
      description: 'Navigate self-assessment questions with confidence',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      focus: 'Self-awareness, growth mindset, and professional development',
      questionTypes: ['self-assessment', 'behavioral', 'growth-mindset']
    },
    {
      id: 'salary',
      title: 'Discussing Salary',
      description: 'Handle compensation conversations professionally',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      focus: 'Salary expectations, negotiation, and value justification',
      questionTypes: ['negotiation', 'compensation', 'value-proposition']
    },
    {
      id: 'job-specific',
      title: 'Job-Specific Interview',
      description: 'Practice technical and role-specific questions',
      icon: Settings,
      color: 'from-indigo-500 to-blue-500',
      focus: 'Technical skills, role competencies, and industry knowledge',
      questionTypes: ['technical', 'role-specific', 'industry-knowledge']
    },
    {
      id: 'mock-interview',
      title: 'Full Mock Interview',
      description: 'Complete interview simulation with all question types',
      icon: Award,
      color: 'from-slate-700 to-slate-900',
      focus: 'Comprehensive interview practice with realistic flow',
      questionTypes: ['introduction', 'behavioral', 'technical', 'situational', 'closing']
    }
  ];

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

  // Auto-detect silence and handle response
  useEffect(() => {
    if (isWaitingForResponse && isListening) {
      detectSilence(transcript, isListening);
    }
  }, [transcript, isListening, isWaitingForResponse, detectSilence]);

  // Set up silence detection callback
  useEffect(() => {
    onSilenceDetected(() => {
      if (transcript.trim().length > 20) {
        handleResponseComplete();
      }
    });
  }, [transcript]);

  // Load past sessions on component mount
  useEffect(() => {
    if (user) {
      loadPastSessions();
    }
  }, [user]);

  // Handle interruption when user starts speaking during audio playback
  useEffect(() => {
    if (isListening && transcript.length > 5 && isPlayingQuestion && canInterrupt) {
      stopAudio();
      setCanInterrupt(false);
    }
  }, [transcript, isListening, isPlayingQuestion, canInterrupt]);

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
      
      // Auto-start the interview flow
      setTimeout(() => {
        if (audioEnabled && data.questions.length > 0) {
          playQuestionAndStartListening(data.questions[0].question);
        } else {
          startListeningFlow();
        }
      }, 1000);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Play question and automatically start listening
  const playQuestionAndStartListening = async (questionText: string) => {
    if (!audioEnabled) {
      startListeningFlow();
      return;
    }
    
    try {
      setIsPlayingQuestion(true);
      setCanInterrupt(true);
      
      const response = await fetch('/api/interview/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: questionText })
      });
      
      if (!response.ok) throw new Error('Failed to generate speech');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsPlayingQuestion(false);
        setCanInterrupt(false);
        URL.revokeObjectURL(audioUrl);
        // Automatically start listening after question finishes
        setTimeout(() => {
          startListeningFlow();
        }, 500);
      };
      
      audio.onerror = () => {
        setIsPlayingQuestion(false);
        setCanInterrupt(false);
        URL.revokeObjectURL(audioUrl);
        startListeningFlow();
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing question:', error);
      setIsPlayingQuestion(false);
      setCanInterrupt(false);
      startListeningFlow();
    }
  };

  // Start the listening flow
  const startListeningFlow = () => {
    if (speechSupported) {
      startListening();
      startWaitingForResponse();
    }
  };

  // Stop current audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingQuestion(false);
      setCanInterrupt(false);
    }
  };

  // Handle when user completes their response
  const handleResponseComplete = async () => {
    if (!finalTranscript.trim() && !interimTranscript.trim()) return;
    
    const responseText = (finalTranscript + ' ' + interimTranscript).trim();
    const currentQuestion = isWaitingForFollowUp && currentFollowUp 
      ? { question: currentFollowUp, type: 'follow-up', keyPoints: [] }
      : questions[currentQuestionIndex];
    const duration = Date.now() - questionStartTime;
    
    // Stop listening and waiting
    stopListening();
    stopWaitingForResponse();
    resetSilenceDetection();
    
    setIsAnalyzing(true);
    
    try {
      // Analyze the response
      const analysisResponse = await fetch('/api/interview/analyze-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          response: responseText,
          questionType: currentQuestion.type,
          keyPoints: currentQuestion.keyPoints || [],
          role: interviewSetup.role,
          experienceYears: interviewSetup.experienceYears,
          duration,
          sessionType: interviewSetup.sessionType,
          isFollowUp: isWaitingForFollowUp
        })
      });
      
      if (!analysisResponse.ok) throw new Error('Failed to analyze response');
      
      const analysis = await analysisResponse.json();
      setLastAnalysis(analysis);
      
      // For coaching sessions (not mock interview), provide immediate feedback
      if (interviewSetup.sessionType !== 'mock-interview' && !isWaitingForFollowUp) {
        await provideFeedback(analysis);
      }
      
      // Save the response if it's not a follow-up
      if (!isWaitingForFollowUp) {
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
      }
      
      // Decide next action: follow-up, feedback, or next question
      await decideNextAction(analysis, responseText);
      
    } catch (error) {
      console.error('Error analyzing response:', error);
      alert('Failed to analyze response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Provide immediate feedback for coaching sessions
  const provideFeedback = async (analysis: any) => {
    const feedbackText = generateFeedbackText(analysis);
    
    if (audioEnabled) {
      try {
        const response = await fetch('/api/interview/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: feedbackText })
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          await new Promise((resolve) => {
            audio.onended = resolve;
            audio.onerror = resolve;
            audio.play();
          });
          
          URL.revokeObjectURL(audioUrl);
        }
      } catch (error) {
        console.error('Error playing feedback:', error);
      }
    }
    
    // Small pause before continuing
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Generate feedback text based on analysis
  const generateFeedbackText = (analysis: any): string => {
    if (analysis.score >= 85) {
      return `Excellent response! ${analysis.strengths[0] || 'You demonstrated strong communication skills.'}`;
    } else if (analysis.score >= 70) {
      return `Good answer. ${analysis.improvements[0] ? `To strengthen it further, ${analysis.improvements[0].toLowerCase()}.` : 'Consider adding more specific examples.'}`;
    } else {
      return `That's a good start. ${analysis.improvements[0] ? `Try to ${analysis.improvements[0].toLowerCase()}.` : 'Consider providing more detailed examples.'}`;
    }
  };

  // Decide whether to ask follow-up, give feedback, or move to next question
  const decideNextAction = async (analysis: any, responseText: string) => {
    // For follow-up responses, always move to next question
    if (isWaitingForFollowUp) {
      setIsWaitingForFollowUp(false);
      setCurrentFollowUp(null);
      setFollowUpCount(0);
      await moveToNextQuestion();
      return;
    }
    
    // Decide if we should ask a follow-up question
    const shouldAskFollowUp = 
      followUpCount < 1 && // Max 1 follow-up per question
      (analysis.score < 75 || responseText.length < 100) && // Low score or short response
      Math.random() > 0.3; // 70% chance to ask follow-up
    
    if (shouldAskFollowUp) {
      await generateAndAskFollowUp(analysis, responseText);
    } else {
      await moveToNextQuestion();
    }
  };

  // Generate and ask a follow-up question
  const generateAndAskFollowUp = async (analysis: any, responseText: string) => {
    setIsGeneratingFollowUp(true);
    
    try {
      const response = await fetch('/api/interview/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: questions[currentQuestionIndex].question,
          response: responseText,
          analysis,
          role: interviewSetup.role
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate follow-up');
      
      const data = await response.json();
      setCurrentFollowUp(data.followUpQuestion);
      setFollowUpCount(prev => prev + 1);
      setIsWaitingForFollowUp(true);
      
      resetTranscript();
      setQuestionStartTime(Date.now());
      
      // Play the follow-up question
      setTimeout(() => {
        if (audioEnabled) {
          playQuestionAndStartListening(data.followUpQuestion);
        } else {
          startListeningFlow();
        }
      }, 1500); // Pause before follow-up
      
    } catch (error) {
      console.error('Error generating follow-up:', error);
      // If follow-up fails, just move to next question
      await moveToNextQuestion();
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  // Move to next question or finish interview
  const moveToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      setFollowUpCount(0);
      resetTranscript();
      
      // Auto-play next question and start listening
      setTimeout(() => {
        if (audioEnabled) {
          playQuestionAndStartListening(questions[currentQuestionIndex + 1].question);
        } else {
          startListeningFlow();
        }
      }, 2000); // 2 second pause between questions
    } else {
      // Interview complete
      finishInterview();
    }
  };

  // Finish interview and generate final analysis
  const finishInterview = async () => {
    setIsGeneratingAnalysis(true);
    
    try {
      const overallDuration = Date.now() - interviewStartTime;
      
      const analysisResponse = await fetch('/api/interview/final-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: interviewSetup.role,
          experienceYears: interviewSetup.experienceYears,
          responses: responses,
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
                responses: responses,
                setup: interviewSetup,
                sessionType: interviewSetup.sessionType
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
    setSelectedSession(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setFinalAnalysis(null);
    setCurrentFollowUp(null);
    setFollowUpCount(0);
    setIsWaitingForFollowUp(false);
    resetTranscript();
    stopAudio();
    stopListening();
    stopWaitingForResponse();
    setCurrentQuestionDuration(0);
  };

  const currentQuestion = isWaitingForFollowUp && currentFollowUp 
    ? { question: currentFollowUp, type: 'follow-up' }
    : questions[currentQuestionIndex];
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
                    AI Interview Coach
                  </h1>
                  <p className="text-sm text-slate-600">
                    {currentStep === 'selection' && 'Choose your coaching session'}
                    {currentStep === 'setup' && 'Set up your practice session'}
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
          {/* Session Selection Step */}
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
                  Choose Your Coaching Session
                </h2>
                <p className="text-lg text-slate-600">
                  Select the area you'd like to practice and improve
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

              <div className="grid md:grid-cols-2 gap-6">
                {coachingSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedSession(session);
                      setInterviewSetup(prev => ({ ...prev, sessionType: session.id }));
                      setCurrentStep('setup');
                    }}
                    className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${session.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <session.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {session.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-3 leading-relaxed">
                          {session.description}
                        </p>
                        <div className="text-xs text-slate-500">
                          <span className="font-medium">Focus:</span> {session.focus}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Setup Step */}
          {currentStep === 'setup' && selectedSession && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${selectedSession.color}`}>
                    <selectedSession.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {selectedSession.title}
                  </h2>
                </div>
                <p className="text-lg text-slate-600">
                  {selectedSession.description}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What role are you practicing for? *
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
                      Number of questions
                    </label>
                    <select
                      value={interviewSetup.questionCount}
                      onChange={(e) => setInterviewSetup(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={4}>4 questions (Quick practice)</option>
                      <option value={6}>6 questions (Standard)</option>
                      <option value={8}>8 questions (Comprehensive)</option>
                      <option value={10}>10 questions (Thorough)</option>
                      <option value={12}>12 questions (Extensive)</option>
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
                        <p className="font-semibold mb-1">Conversational Experience</p>
                        <p>This session will feel like talking to a real interviewer:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Questions are spoken aloud using AI voice</li>
                          <li>Speak naturally - we automatically detect when you're done</li>
                          <li>The coach may ask follow-up questions for deeper insights</li>
                          <li>You can interrupt the coach by simply starting to speak</li>
                          <li>Get real-time feedback and coaching tips</li>
                        </ul>
                        <label className="flex items-center space-x-2 mt-3">
                          <input
                            type="checkbox"
                            checked={audioEnabled}
                            onChange={(e) => setAudioEnabled(e.target.checked)}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Enable voice features</span>
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
                          <p>Your browser doesn't support speech recognition. The session will still work, but you'll need to manually indicate when you're done speaking.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep('selection')}
                    className="flex items-center space-x-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  
                  <button
                    onClick={generateQuestions}
                    disabled={!interviewSetup.role.trim() || isLoadingQuestions}
                    className="flex items-center space-x-2 px-8 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingQuestions ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    <span>{isLoadingQuestions ? 'Preparing Session...' : 'Start Coaching'}</span>
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
                    <span>
                      {isWaitingForFollowUp ? 'Follow-up Question' : 
                       `${currentQuestion.type?.charAt(0).toUpperCase()}${currentQuestion.type?.slice(1)} Question`}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {isWaitingForFollowUp ? 'Follow-up' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                  </h2>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-lg text-slate-800 leading-relaxed flex-1">
                      {currentQuestion.question}
                    </p>
                    <div className="flex items-center space-x-2 ml-4">
                      {audioEnabled && (
                        <button
                          onClick={() => isPlayingQuestion ? stopAudio() : playQuestionAndStartListening(currentQuestion.question)}
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
                  
                  {!isWaitingForFollowUp && currentQuestion.keyPoints && currentQuestion.keyPoints.length > 0 && (
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
                      {speechSupported && !isAnalyzing && !isGeneratingFollowUp && (
                        <div className="flex items-center space-x-2">
                          {isListening ? (
                            <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-sm font-medium">Listening...</span>
                            </div>
                          ) : !isPlayingQuestion && (
                            <button
                              onClick={startListeningFlow}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Start Speaking</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={6}
                      value={transcript}
                      readOnly
                      placeholder={speechSupported ? "Start speaking to see your response here..." : "Your response will appear here..."}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-slate-50"
                    />
                    
                    {(isAnalyzing || isGeneratingFollowUp) && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          <span className="text-purple-600 font-medium">
                            {isAnalyzing ? 'Analyzing your response...' : 'Preparing follow-up question...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {speechError && (
                    <div className="text-red-600 text-sm flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{speechError}</span>
                    </div>
                  )}

                  {isWaitingForResponse && isListening && (
                    <div className="text-blue-600 text-sm flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>We'll automatically continue when you finish speaking...</span>
                    </div>
                  )}

                  {isPlayingQuestion && canInterrupt && (
                    <div className="text-green-600 text-sm flex items-center space-x-2">
                      <Mic className="w-4 h-4" />
                      <span>You can interrupt by starting to speak...</span>
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
                    {!isWaitingForFollowUp && currentQuestion.expectedDuration && (
                      <>Expected duration: ~{Math.floor(currentQuestion.expectedDuration / 60)} minutes</>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    {isWaitingForFollowUp ? 'Follow-up question' : 
                     currentQuestionIndex === questions.length - 1 ? 'Final question' : 
                     `${questions.length - currentQuestionIndex - 1} questions remaining`}
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

export default InterviewCoachPage;