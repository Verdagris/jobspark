"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  User,
  Bot,
  Volume2,
  VolumeX,
  Zap,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  Clock,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  Star,
  RefreshCw,
  Settings,
  X,
  Plus,
  Loader2,
  Minus,
  Search,
  Building2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAutoInterview } from "@/hooks/useAutoInterview";
import { CreditBalance } from "@/components/CreditBalance";
import { CREDIT_COSTS, formatCredits, hasEnoughCredits } from "@/lib/credits";

interface Question {
  id: number;
  question: string;
  type: string;
  expectedDuration: number;
  keyPoints: string[];
}

interface SessionConfig {
  role: string;
  experienceYears: number;
  sessionType: string;
  questionCount: number;
  savedJobId?: string;
}

interface Analysis {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  speechMetrics?: {
    pace: number;
    paceRating: string;
    fillerWords: number;
    fillerPercentage: number;
    grammarScore: number;
    clarityScore: number;
    confidenceScore: number;
    overallSpeechScore: number;
  };
  speechCoaching?: string[];
}

const InterviewPracticePage = () => {
  const { user } = useAuth();
  
  // Core state
  const [currentStep, setCurrentStep] = useState<'setup' | 'credits-check' | 'interview' | 'analysis' | 'final'>('setup');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    role: '',
    experienceYears: 1,
    sessionType: 'mock-interview',
    questionCount: 3,
    savedJobId: ''
  });
  
  // Credits state with better null handling
  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [hasEnoughCredits, setHasEnoughCredits] = useState<boolean>(false);
  const [checkingCredits, setCheckingCredits] = useState<boolean>(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  
  // Interview state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Interview flow state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [processingResponse, setProcessingResponse] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  
  // Loading states
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [analyzingResponse, setAnalyzingResponse] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  
  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [selectedSavedJob, setSelectedSavedJob] = useState<any>(null);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);
  
  // Timers
  const responseStartTime = useRef<number>(0);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Speech recognition
  const {
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
    isSupported: speechSupported
  } = useSpeechToText();

  // Auto interview management
  const {
    isWaitingForResponse: autoWaiting,
    silenceDetected,
    startWaitingForResponse,
    stopWaitingForResponse,
    resetSilenceDetection,
    onSilenceDetected,
    detectSilence
  } = useAutoInterview(3000, 20); // 3 seconds silence, 20 char minimum

  // Session types configuration
  const sessionTypes = [
    { id: 'mock-interview', label: 'Full Mock Interview', description: 'Complete interview simulation' },
    { id: 'introduction', label: 'Introduction Practice', description: 'Practice self-introduction' },
    { id: 'experience', label: 'Experience Questions', description: 'Behavioral and experience-based' },
    { id: 'strengths-weaknesses', label: 'Strengths & Weaknesses', description: 'Self-assessment questions' },
    { id: 'salary', label: 'Salary Negotiation', description: 'Compensation discussions' },
    { id: 'job-specific', label: 'Technical Questions', description: 'Role-specific competencies' }
  ];

  // Load saved jobs when component mounts
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (!user) return;
      
      setLoadingSavedJobs(true);
      try {
        const { getUserSavedJobs } = await import('@/lib/database');
        const jobs = await getUserSavedJobs(user.id);
        setSavedJobs(jobs);
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      } finally {
        setLoadingSavedJobs(false);
      }
    };

    loadSavedJobs();
  }, [user]);

  // Check credits when component mounts or user changes
  useEffect(() => {
    const checkUserCredits = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/credits/balance', {
          headers: {
            'Authorization': `Bearer ${(await import('@/lib/supabase')).supabase.auth.session()?.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const balance = data.balance || 0;
          setCreditsBalance(balance);
          setHasEnoughCredits(hasEnoughCredits(balance, CREDIT_COSTS.INTERVIEW_SESSION));
        }
      } catch (error) {
        console.error('Error checking credits:', error);
        setCreditsError('Failed to check credit balance');
        setCreditsBalance(0);
        setHasEnoughCredits(false);
      }
    };

    checkUserCredits();
  }, [user]);

  // Auto-submit response when silence is detected
  useEffect(() => {
    if (silenceDetected && transcript.trim().length > 20) {
      handleSubmitResponse();
    }
  }, [silenceDetected]);

  // Monitor speech for auto-submission
  useEffect(() => {
    if (waitingForResponse && isListening) {
      detectSilence(transcript, isListening);
    }
  }, [transcript, isListening, waitingForResponse, detectSilence]);

  // Setup silence detection callback
  useEffect(() => {
    onSilenceDetected(() => {
      if (transcript.trim().length >= 20) {
        handleSubmitResponse();
      }
    });
  }, [transcript, onSilenceDetected]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const checkCreditsBeforeStart = async () => {
    if (!user) return false;
    
    setCheckingCredits(true);
    setCreditsError(null);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to continue');
      }

      const response = await fetch('/api/interview/check-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ questionCount: sessionConfig.questionCount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify credits');
      }

      const data = await response.json();
      setHasEnoughCredits(data.hasCredits);
      
      if (!data.hasCredits) {
        setCreditsError(`You need ${data.creditsNeeded} credits to start this interview session. You currently have ${creditsBalance} credits.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      setCreditsError(error instanceof Error ? error.message : 'Failed to verify credits');
      return false;
    } finally {
      setCheckingCredits(false);
    }
  };

  const handleSavedJobChange = async (jobId: string) => {
    setSessionConfig(prev => ({ ...prev, savedJobId: jobId }));
    
    if (jobId) {
      try {
        const { getSavedJobById } = await import('@/lib/database');
        const job = await getSavedJobById(jobId);
        if (job) {
          setSelectedSavedJob(job);
          setSessionConfig(prev => ({
            ...prev,
            role: job.title
          }));
        }
      } catch (error) {
        console.error('Error loading saved job:', error);
      }
    } else {
      setSelectedSavedJob(null);
    }
  };

  const generateQuestions = async () => {
    if (!sessionConfig.role.trim()) {
      alert('Please enter a job role or select a saved job');
      return;
    }

    setLoadingQuestions(true);
    try {
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          sessionType: sessionConfig.sessionType,
          questionCount: sessionConfig.questionCount,
          savedJobId: sessionConfig.savedJobId || null
        })
      });

      if (!response.ok) throw new Error('Failed to generate questions');

      const data = await response.json();
      setQuestions(data.questions);
      setCurrentStep('credits-check');
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startInterview = async () => {
    const hasCredits = await checkCreditsBeforeStart();
    if (!hasCredits) return;
    
    setCurrentStep('interview');
    setInterviewStarted(false);
    setShowStartButton(true);
    
    // Play first question after a short delay
    setTimeout(() => {
      if (audioEnabled && questions[0]) {
        playQuestionAudio(questions[0].question);
      }
    }, 1000);
  };

  const handleStartSpeaking = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    setInterviewStarted(true);
    setShowStartButton(false);
    setWaitingForResponse(true);
    responseStartTime.current = Date.now();
    
    // Start listening and auto-interview flow
    startListening();
    startWaitingForResponse();
    resetSilenceDetection();
    
    // Auto-submit after 3 minutes if no response
    autoSubmitTimer.current = setTimeout(() => {
      if (transcript.trim().length > 0) {
        handleSubmitResponse();
      }
    }, 180000); // 3 minutes
  };

  const playQuestionAudio = async (text: string) => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      
      const response = await fetch('/api/interview/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          messageType: 'question',
          voiceId: 'gsm4lUH9bnZ3pjR1Pw7w' // Professional female voice
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          console.error('Audio playback failed');
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (processingResponse || !transcript.trim()) return;
    
    setProcessingResponse(true);
    setWaitingForResponse(false);
    stopListening();
    stopWaitingForResponse();
    
    if (autoSubmitTimer.current) {
      clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }

    const currentResponse = transcript.trim();
    const duration = Date.now() - responseStartTime.current;
    
    try {
      setAnalyzingResponse(true);
      
      const response = await fetch('/api/interview/analyze-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestionIndex].question,
          response: currentResponse,
          questionType: questions[currentQuestionIndex].type,
          keyPoints: questions[currentQuestionIndex].keyPoints,
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          duration,
          sessionType: sessionConfig.sessionType
        })
      });

      if (!response.ok) throw new Error('Failed to analyze response');

      const analysis = await response.json();
      
      // Update state
      setResponses(prev => [...prev, currentResponse]);
      setAnalyses(prev => [...prev, analysis]);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        resetTranscript();
        
        // Auto-play next question and continue conversation
        setTimeout(() => {
          const nextQuestion = questions[currentQuestionIndex + 1];
          if (audioEnabled && nextQuestion) {
            playQuestionAudio(nextQuestion.question);
          }
          
          // Automatically start listening for next response
          setTimeout(() => {
            setWaitingForResponse(true);
            responseStartTime.current = Date.now();
            startListening();
            startWaitingForResponse();
            resetSilenceDetection();
            
            // Auto-submit timer for next question
            autoSubmitTimer.current = setTimeout(() => {
              if (transcript.trim().length > 0) {
                handleSubmitResponse();
              }
            }, 180000);
          }, 2000); // 2 second delay after question audio
        }, 1000);
      } else {
        // Interview complete
        generateFinalAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      alert('Failed to analyze response. Please try again.');
    } finally {
      setAnalyzingResponse(false);
      setProcessingResponse(false);
    }
  };

  const generateFinalAnalysis = async () => {
    setGeneratingFinal(true);
    
    try {
      const sessionData = {
        questions: questions.map((q, i) => ({
          question: q.question,
          response: responses[i] || '',
          score: analyses[i]?.score || 0,
          type: q.type
        })),
        overallDuration: Date.now() - responseStartTime.current,
        sessionType: sessionConfig.sessionType,
        savedJobId: sessionConfig.savedJobId
      };

      const response = await fetch('/api/interview/final-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          responses: sessionData.questions,
          overallDuration: sessionData.overallDuration,
          sessionType: sessionConfig.sessionType
        })
      });

      if (!response.ok) throw new Error('Failed to generate final analysis');

      const finalData = await response.json();
      setFinalAnalysis(finalData);
      
      // Save session to database
      await fetch('/api/interview/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          overallScore: finalData.overallScore,
          durationMinutes: Math.round(sessionData.overallDuration / 60000),
          questionsCount: questions.length,
          sessionData,
          insights: finalData,
          sessionType: sessionConfig.sessionType
        })
      });
      
      setCurrentStep('final');
    } catch (error) {
      console.error('Error generating final analysis:', error);
      alert('Failed to generate final analysis. Please try again.');
    } finally {
      setGeneratingFinal(false);
    }
  };

  const resetInterview = () => {
    setCurrentStep('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setAnalyses([]);
    setFinalAnalysis(null);
    setInterviewStarted(false);
    setWaitingForResponse(false);
    setProcessingResponse(false);
    setShowStartButton(true);
    resetTranscript();
    stopListening();
    stopWaitingForResponse();
    
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    if (autoSubmitTimer.current) {
      clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (currentAudio && !audioEnabled) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  // Helper functions for question count selection
  const incrementQuestions = () => {
    setSessionConfig(prev => ({ 
      ...prev, 
      questionCount: Math.min(5, prev.questionCount + 1) 
    }));
  };

  const decrementQuestions = () => {
    setSessionConfig(prev => ({ 
      ...prev, 
      questionCount: Math.max(2, prev.questionCount - 1) 
    }));
  };

  // Render setup step with saved job selection and question count selector
  const renderSetup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Practice Setup</h2>
          <p className="text-slate-600">Configure your practice session</p>
        </div>

        <div className="space-y-6">
          {/* Saved Jobs Selection */}
          {savedJobs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select a Saved Job (Optional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  value={sessionConfig.savedJobId}
                  onChange={(e) => handleSavedJobChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loadingSavedJobs}
                >
                  <option value="">-- Select a saved job --</option>
                  {savedJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedSavedJob && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">{selectedSavedJob.company}</span>
                  </div>
                  {selectedSavedJob.location && (
                    <div className="flex items-center space-x-2 mb-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedSavedJob.location}</span>
                    </div>
                  )}
                  {selectedSavedJob.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{selectedSavedJob.description}</p>
                  )}
                  <div className="mt-2">
                    <Link href="/job-search?filter=saved">
                      <button className="text-xs text-purple-600 hover:text-purple-800">
                        View all saved jobs →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Role *
            </label>
            <input
              type="text"
              value={sessionConfig.role}
              onChange={(e) => setSessionConfig(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Software Engineer, Marketing Manager"
              disabled={!!selectedSavedJob}
            />
            {selectedSavedJob && (
              <p className="text-xs text-slate-500 mt-1">Role automatically filled from saved job</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Years of Experience
            </label>
            <select
              value={sessionConfig.experienceYears}
              onChange={(e) => setSessionConfig(prev => ({ ...prev, experienceYears: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} year{i > 0 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Session Type
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {sessionTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSessionConfig(prev => ({ 
                    ...prev, 
                    sessionType: type.id
                  }))}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    sessionConfig.sessionType === type.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <h3 className="font-semibold text-slate-900 mb-1">{type.label}</h3>
                  <p className="text-sm text-slate-600">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Count Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={decrementQuestions}
                disabled={sessionConfig.questionCount <= 2}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {sessionConfig.questionCount}
                </div>
                <div className="text-sm text-slate-600">
                  questions ({sessionConfig.questionCount * 2}-{sessionConfig.questionCount * 3} minutes)
                </div>
              </div>
              
              <button
                onClick={incrementQuestions}
                disabled={sessionConfig.questionCount >= 5}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-3 bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-600 text-center">
                Choose between 2-5 questions. More questions = longer practice session.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Credit Cost</span>
            </div>
            <p className="text-purple-800 text-sm">
              This interview session will cost <strong>{CREDIT_COSTS.INTERVIEW_SESSION} credits</strong> regardless of the number of questions.
            </p>
          </div>

          <button
            onClick={generateQuestions}
            disabled={!sessionConfig.role.trim() || loadingQuestions}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loadingQuestions ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Questions...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Generate Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render credits check step with better null handling
  const renderCreditsCheck = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Credit Verification</h2>
          <p className="text-slate-600">Checking your credit balance</p>
        </div>

        <div className="space-y-6">
          {/* Current Balance with null safety */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600">Current Balance</span>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {formatCredits(creditsBalance)}
                </span>
                <span className="text-slate-600">credits</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Session Cost</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-slate-900">
                  {CREDIT_COSTS.INTERVIEW_SESSION}
                </span>
                <span className="text-slate-600">credits</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Session Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Role</span>
                <span className="font-medium text-slate-900">{sessionConfig.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Experience</span>
                <span className="font-medium text-slate-900">{sessionConfig.experienceYears} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Session Type</span>
                <span className="font-medium text-slate-900">
                  {sessionTypes.find(t => t.id === sessionConfig.sessionType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Questions</span>
                <span className="font-medium text-slate-900">{questions.length}</span>
              </div>
              {selectedSavedJob && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Saved Job</span>
                  <span className="font-medium text-slate-900">{selectedSavedJob.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {creditsError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Insufficient Credits</span>
              </div>
              <p className="text-red-800 text-sm">{creditsError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentStep('setup')}
              className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Back to Setup
            </button>
            
            {hasEnoughCredits ? (
              <button
                onClick={startInterview}
                disabled={checkingCredits}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {checkingCredits ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Start Interview</span>
                  </>
                )}
              </button>
            ) : (
              <Link href="/credits" className="flex-1">
                <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Buy Credits</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Render interview step (unchanged)
  const renderInterview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-slate-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-slate-900 font-medium">{currentQuestion?.question}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-3">
                      <button
                        onClick={() => playQuestionAudio(currentQuestion?.question || '')}
                        disabled={isPlaying}
                        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                      >
                        {isPlaying ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span className="text-sm">{isPlaying ? 'Playing...' : 'Replay Question'}</span>
                      </button>
                      
                      <button
                        onClick={toggleAudio}
                        className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {audioEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                        <span className="text-sm">{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Area */}
              <div className="space-y-6">
                {/* User Response */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-xl p-4 min-h-[120px]">
                      {transcript ? (
                        <div>
                          <p className="text-slate-900">{finalTranscript}</p>
                          {interimTranscript && (
                            <p className="text-slate-500 italic">{interimTranscript}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">
                          {showStartButton 
                            ? "Click 'Start Speaking' to begin your response..."
                            : waitingForResponse 
                              ? "Listening... Speak your response now."
                              : "Waiting for your response..."
                          }
                        </p>
                      )}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        {showStartButton ? (
                          <button
                            onClick={handleStartSpeaking}
                            disabled={!speechSupported}
                            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Mic className="w-5 h-5" />
                            <span>Start Speaking</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-3">
                            {isListening && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium">Listening...</span>
                              </div>
                            )}
                            
                            {processingResponse && (
                              <div className="flex items-center space-x-2 text-purple-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Processing...</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!showStartButton && transcript.trim().length > 20 && !processingResponse && (
                          <button
                            onClick={handleSubmitResponse}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            <span>Submit Response</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        {transcript.trim().length > 0 && (
                          <span>{transcript.trim().length} characters</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Session Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-600">Role</span>
                  <p className="font-medium text-slate-900">{sessionConfig.role}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Experience</span>
                  <p className="font-medium text-slate-900">{sessionConfig.experienceYears} years</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Type</span>
                  <p className="font-medium text-slate-900">
                    {sessionTypes.find(t => t.id === sessionConfig.sessionType)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Questions</span>
                  <p className="font-medium text-slate-900">{questions.length} questions</p>
                </div>
                {selectedSavedJob && (
                  <div>
                    <span className="text-sm text-slate-600">Saved Job</span>
                    <p className="font-medium text-slate-900">{selectedSavedJob.company}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 Interview Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Speak clearly and at a moderate pace</li>
                <li>• Use the STAR method for behavioral questions</li>
                <li>• Provide specific examples from your experience</li>
                <li>• The interview will automatically move to the next question when you finish</li>
                <li>• Take your time to think before responding</li>
              </ul>
            </div>

            {/* Audio Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Audio Settings</h3>
              <div className="space-y-3">
                <button
                  onClick={toggleAudio}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    audioEnabled 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {audioEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Audio Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Audio Disabled</span>
                    </>
                  )}
                </button>
                
                {isPlaying && (
                  <button
                    onClick={stopCurrentAudio}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Stop Audio</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render final analysis step (unchanged)
  const renderFinalAnalysis = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Interview Complete!</h2>
        <p className="text-slate-600">Here's your detailed performance analysis</p>
      </div>

      {finalAnalysis && (
        <div className="space-y-8">
          {/* Overall Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-slate-900 mb-2">
                {finalAnalysis.overallScore}
              </div>
              <div className="text-slate-600">Overall Score</div>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.round(finalAnalysis.overallScore / 20)
                        ? 'text-yellow-400 fill-current'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-slate-700 text-lg">{finalAnalysis.overallFeedback}</p>
          </div>

          {/* Category Scores */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Performance Breakdown</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(finalAnalysis.categoryScores || {}).map(([category, score]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-900 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-bold text-slate-900">{score}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-green-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Strengths</span>
              </h3>
              <ul className="space-y-2">
                {finalAnalysis.strengths?.map((strength: string, index: number) => (
                  <li key={index} className="text-green-800 flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h3 className="font-bold text-orange-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Areas for Improvement</span>
              </h3>
              <ul className="space-y-2">
                {finalAnalysis.areasForImprovement?.map((improvement: string, index: number) => (
                  <li key={index} className="text-orange-800 flex items-start space-x-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recommendations</span>
            </h3>
            <ul className="space-y-2">
              {finalAnalysis.recommendations?.map((recommendation: string, index: number) => (
                <li key={index} className="text-blue-800 flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetInterview}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>
            
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                <Award className="w-5 h-5" />
                <span>View Dashboard</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Please sign in</h2>
          <p className="text-slate-600 mb-4">You need to be signed in to practice interviews.</p>
          <Link href="/auth">
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-8 h-8 text-sky-500" />
                <span className="text-2xl font-bold text-slate-900">JobSpark</span>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-4" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Interview Practice</h1>
                  <p className="text-sm text-slate-600">AI-powered interview coaching</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <CreditBalance />
              
              {currentStep === 'interview' && (
                <button
                  onClick={resetInterview}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>End Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'setup' && renderSetup()}
          {currentStep === 'credits-check' && renderCreditsCheck()}
          {currentStep === 'interview' && renderInterview()}
          {currentStep === 'final' && renderFinalAnalysis()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewPracticePage;