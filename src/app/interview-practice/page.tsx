"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Award,
  TrendingUp,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Building2,
  MapPin,
  Calendar,
  BarChart3,
  Zap,
  Brain,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Briefcase,
  X,
  Settings,
  RefreshCw,
  BookOpen,
  Users,
  Trophy,
  Flame,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAutoInterview } from "@/hooks/useAutoInterview";
import { getUserSavedJobs, getSavedJobById } from "@/lib/database";

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
  context: string;
  sessionType: string;
  questionCount: number;
  savedJobId?: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  practice_count: number;
}

const InterviewPracticePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Core state
  const [currentStep, setCurrentStep] = useState<'setup' | 'practice' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [encouragementMessage, setEncouragementMessage] = useState("");
  
  // Setup state
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    role: "",
    experienceYears: 2,
    context: "",
    sessionType: "mock-interview",
    questionCount: 3,
    savedJobId: ""
  });
  
  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [selectedSavedJob, setSelectedSavedJob] = useState<SavedJob | null>(null);
  const [showSavedJobDropdown, setShowSavedJobDropdown] = useState(false);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  
  // Loading states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  
  // Audio state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Speech recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
    isSupported: speechSupported
  } = useSpeechToText();
  
  // Auto interview
  const {
    isWaitingForResponse,
    startWaitingForResponse,
    stopWaitingForResponse,
    onSilenceDetected,
    detectSilence
  } = useAutoInterview(3000, 15);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);
  const isProcessingResponse = useRef(false);

  // Session types configuration
  const sessionTypes = [
    { id: 'mock-interview', label: 'Full Mock Interview', description: 'Complete interview simulation' },
    { id: 'introduction', label: 'Introduction Practice', description: 'Practice self-introduction and personal branding' },
    { id: 'experience', label: 'Experience Questions', description: 'Behavioral and experience-based questions' },
    { id: 'strengths-weaknesses', label: 'Strengths & Weaknesses', description: 'Self-assessment and growth mindset' },
    { id: 'salary', label: 'Salary Negotiation', description: 'Compensation and negotiation practice' },
    { id: 'job-specific', label: 'Job-Specific Questions', description: 'Technical and role-specific questions' }
  ];

  // Initialize from URL parameters only once
  useEffect(() => {
    if (hasInitialized.current || !searchParams) return;
    
    const initializeFromParams = async () => {
      try {
        const jobId = searchParams.get('jobId');
        const role = searchParams.get('role');
        const company = searchParams.get('company');
        const type = searchParams.get('type');

        if (jobId) {
          // Load specific saved job
          const job = await getSavedJobById(jobId);
          if (job) {
            setSelectedSavedJob(job);
            setSessionConfig(prev => ({
              ...prev,
              role: job.title,
              context: job.description ? job.description.substring(0, 200) + '...' : '',
              savedJobId: job.id
            }));
          }
        } else if (role) {
          // Set role from URL
          setSessionConfig(prev => ({
            ...prev,
            role: decodeURIComponent(role)
          }));
        }

        if (type && sessionTypes.find(st => st.id === type)) {
          setSessionConfig(prev => ({
            ...prev,
            sessionType: type
          }));
        }

        hasInitialized.current = true;
      } catch (error) {
        console.error('Error initializing from URL params:', error);
        hasInitialized.current = true;
      }
    };

    initializeFromParams();
  }, [searchParams]);

  // Load saved jobs only once when user is available
  useEffect(() => {
    if (!user || savedJobs.length > 0) return;
    
    const loadSavedJobs = async () => {
      setSavedJobsLoading(true);
      try {
        const jobs = await getUserSavedJobs(user.id);
        setSavedJobs(jobs);
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      } finally {
        setSavedJobsLoading(false);
      }
    };

    loadSavedJobs();
  }, [user, savedJobs.length]);

  // Handle silence detection
  useEffect(() => {
    onSilenceDetected(() => {
      if (isWaitingForResponse && !isProcessingResponse.current) {
        handleResponseComplete();
      }
    });
  }, [isWaitingForResponse]);

  // Monitor transcript for silence detection
  useEffect(() => {
    detectSilence(transcript, isListening);
  }, [transcript, isListening, detectSilence]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const handleSavedJobSelect = useCallback((job: SavedJob | null) => {
    setSelectedSavedJob(job);
    setShowSavedJobDropdown(false);
    
    if (job) {
      setSessionConfig(prev => ({
        ...prev,
        role: job.title,
        context: job.description ? job.description.substring(0, 200) + '...' : '',
        savedJobId: job.id
      }));
    } else {
      setSessionConfig(prev => ({
        ...prev,
        role: "",
        context: "",
        savedJobId: ""
      }));
    }
  }, []);

  const generateQuestions = useCallback(async () => {
    if (!sessionConfig.role.trim()) {
      alert('Please enter a role to practice for');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          context: sessionConfig.context,
          sessionType: sessionConfig.sessionType,
          questionCount: sessionConfig.questionCount
        })
      });

      if (!response.ok) throw new Error('Failed to generate questions');

      const data = await response.json();
      setQuestions(data.questions);
      setCurrentStep('practice');
      setSessionStartTime(Date.now());
      
      // Load encouragement message
      if (user) {
        try {
          const encResponse = await fetch('/api/interview/encouragement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              type: 'pre-session',
              sessionType: sessionConfig.sessionType
            })
          });
          
          if (encResponse.ok) {
            const encData = await encResponse.json();
            setEncouragementMessage(encData.message);
          }
        } catch (error) {
          console.error('Error loading encouragement:', error);
        }
      }
      
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [sessionConfig, user]);

  const playQuestionAudio = useCallback(async (questionText: string) => {
    if (!audioEnabled) return;

    setIsLoadingAudio(true);
    try {
      const response = await fetch('/api/interview/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: questionText,
          messageType: 'question'
        })
      });

      if (!response.ok) throw new Error('Failed to generate audio');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setIsPlayingAudio(true);

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        startWaitingForResponse();
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      startWaitingForResponse();
    } finally {
      setIsLoadingAudio(false);
    }
  }, [audioEnabled, currentAudio, startWaitingForResponse]);

  const startQuestion = useCallback(async () => {
    if (currentQuestionIndex >= questions.length) return;

    const question = questions[currentQuestionIndex];
    setQuestionStartTime(Date.now());
    resetTranscript();
    stopWaitingForResponse();

    await playQuestionAudio(question.question);
  }, [currentQuestionIndex, questions, resetTranscript, stopWaitingForResponse, playQuestionAudio]);

  const handleResponseComplete = useCallback(async () => {
    if (isProcessingResponse.current || !transcript.trim()) return;
    
    isProcessingResponse.current = true;
    setIsAnalyzing(true);
    stopListening();
    stopWaitingForResponse();

    try {
      const question = questions[currentQuestionIndex];
      const duration = Date.now() - questionStartTime;

      const response = await fetch('/api/interview/analyze-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          response: transcript,
          questionType: question.type,
          keyPoints: question.keyPoints,
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          duration,
          sessionType: sessionConfig.sessionType
        })
      });

      if (!response.ok) throw new Error('Failed to analyze response');

      const analysis = await response.json();
      
      const responseData = {
        question: question.question,
        response: transcript,
        analysis,
        duration,
        type: question.type
      };

      setResponses(prev => [...prev, responseData]);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        resetTranscript();
      } else {
        await completeSession([...responses, responseData]);
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      alert('Failed to analyze response. Please try again.');
    } finally {
      setIsAnalyzing(false);
      isProcessingResponse.current = false;
    }
  }, [transcript, currentQuestionIndex, questions, questionStartTime, sessionConfig, responses, stopListening, stopWaitingForResponse, resetTranscript]);

  const completeSession = useCallback(async (allResponses: any[]) => {
    setIsSavingSession(true);
    try {
      const totalDuration = Date.now() - sessionStartTime;

      const finalResponse = await fetch('/api/interview/final-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: sessionConfig.role,
          experienceYears: sessionConfig.experienceYears,
          responses: allResponses.map(r => ({
            question: r.question,
            response: r.response,
            score: r.analysis.score,
            type: r.type
          })),
          overallDuration: totalDuration,
          sessionType: sessionConfig.sessionType
        })
      });

      if (!response.ok) throw new Error('Failed to generate final analysis');

      const finalData = await finalResponse.json();
      setFinalAnalysis(finalData);

      if (user) {
        await fetch('/api/interview/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            role: sessionConfig.role,
            experienceYears: sessionConfig.experienceYears,
            context: sessionConfig.context,
            overallScore: finalData.overallScore,
            durationMinutes: Math.round(totalDuration / 60000),
            questionsCount: questions.length,
            sessionData: {
              questions,
              responses: allResponses,
              saved_job_id: sessionConfig.savedJobId
            },
            insights: finalData,
            sessionType: sessionConfig.sessionType
          })
        });
      }

      setCurrentStep('results');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setIsSavingSession(false);
    }
  }, [sessionStartTime, sessionConfig, questions, user]);

  const handleStartRecording = useCallback(() => {
    if (!isListening) {
      startListening();
    }
  }, [isListening, startListening]);

  const handleStopRecording = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleResponseComplete();
      }
    }
  }, [isListening, stopListening, transcript, handleResponseComplete]);

  const restartSession = useCallback(() => {
    setCurrentStep('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setFinalAnalysis(null);
    resetTranscript();
    stopWaitingForResponse();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }
    setIsPlayingAudio(false);
  }, [resetTranscript, stopWaitingForResponse, currentAudio]);

  // Start first question when practice begins
  useEffect(() => {
    if (currentStep === 'practice' && questions.length > 0 && currentQuestionIndex === 0 && questionStartTime === 0) {
      startQuestion();
    }
  }, [currentStep, questions.length, currentQuestionIndex, questionStartTime, startQuestion]);

  // Start next question when index changes
  useEffect(() => {
    if (currentStep === 'practice' && currentQuestionIndex > 0 && currentQuestionIndex < questions.length) {
      const timer = setTimeout(() => {
        startQuestion();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, currentStep, questions.length, startQuestion]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-4">Please sign in to access interview practice.</p>
          <Link href="/auth">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
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
            
            {currentStep === 'practice' && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled ? 'text-green-600 bg-green-100' : 'text-slate-400 bg-slate-100'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={restartSession}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>End Interview</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {currentStep === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Set Up Your Interview Practice</h2>
                <p className="text-lg text-slate-600">Configure your practice session for the best experience</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Saved Job Selection */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                      <span>Practice for a Specific Job (Optional)</span>
                    </h3>
                    
                    {savedJobsLoading ? (
                      <div className="flex items-center space-x-2 text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading saved jobs...</span>
                      </div>
                    ) : savedJobs.length > 0 ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowSavedJobDropdown(!showSavedJobDropdown)}
                          className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Search className="w-5 h-5 text-slate-400" />
                            <span className="text-slate-700">
                              {selectedSavedJob ? `${selectedSavedJob.title} at ${selectedSavedJob.company}` : 'Select a saved job to practice for'}
                            </span>
                          </div>
                          {showSavedJobDropdown ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        
                        {showSavedJobDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => handleSavedJobSelect(null)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
                            >
                              <span className="text-slate-600">Practice generally (no specific job)</span>
                            </button>
                            {savedJobs.map((job) => (
                              <button
                                key={job.id}
                                onClick={() => handleSavedJobSelect(job)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">{job.title}</p>
                                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                                      <span className="flex items-center space-x-1">
                                        <Building2 className="w-3 h-3" />
                                        <span>{job.company}</span>
                                      </span>
                                      {job.location && (
                                        <span className="flex items-center space-x-1">
                                          <MapPin className="w-3 h-3" />
                                          <span>{job.location}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {job.practice_count > 0 && (
                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                      {job.practice_count} practice{job.practice_count > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <p className="mb-2">No saved jobs found</p>
                        <Link href="/job-search">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Browse and save jobs →
                          </button>
                        </Link>
                      </div>
                    )}

                    {selectedSavedJob && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">{selectedSavedJob.company}</span>
                        </div>
                        {selectedSavedJob.location && (
                          <div className="flex items-center space-x-2 mb-2 text-sm text-blue-700">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedSavedJob.location}</span>
                          </div>
                        )}
                        {selectedSavedJob.practice_count > 0 && (
                          <div className="text-sm text-blue-600">
                            You've practiced for this role {selectedSavedJob.practice_count} time{selectedSavedJob.practice_count > 1 ? 's' : ''} before
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Role and Experience */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Role & Experience</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Role/Position {selectedSavedJob && <span className="text-blue-600">(auto-filled)</span>}
                        </label>
                        <input
                          type="text"
                          value={sessionConfig.role}
                          onChange={(e) => setSessionConfig(prev => ({ ...prev, role: e.target.value }))}
                          disabled={!!selectedSavedJob}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                          placeholder="e.g., Software Engineer, Marketing Manager"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                        <select
                          value={sessionConfig.experienceYears}
                          onChange={(e) => setSessionConfig(prev => ({ ...prev, experienceYears: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value={0}>Entry Level (0-1 years)</option>
                          <option value={2}>Junior (2-3 years)</option>
                          <option value={5}>Mid-level (4-6 years)</option>
                          <option value={8}>Senior (7-10 years)</option>
                          <option value={12}>Lead/Principal (10+ years)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Session Type */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Practice Type</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {sessionTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSessionConfig(prev => ({ ...prev, sessionType: type.id }))}
                          className={`p-4 text-left border rounded-lg transition-all ${
                            sessionConfig.sessionType === type.id
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 hover:border-purple-300 text-slate-700'
                          }`}
                        >
                          <h4 className="font-medium mb-1">{type.label}</h4>
                          <p className="text-sm opacity-75">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Number of Questions</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-600">2</span>
                      <input
                        type="range"
                        min="2"
                        max="5"
                        value={sessionConfig.questionCount}
                        onChange={(e) => setSessionConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-slate-600">5</span>
                      <div className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {sessionConfig.questionCount} questions
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Recommended: 3-4 questions for focused practice, 5 for comprehensive sessions
                    </p>
                  </div>

                  {/* Additional Context */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Additional Context {selectedSavedJob && <span className="text-blue-600">(auto-filled from job)</span>}
                    </h3>
                    <textarea
                      value={sessionConfig.context}
                      onChange={(e) => setSessionConfig(prev => ({ ...prev, context: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Any specific requirements, company info, or focus areas..."
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      <span>Session Info</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Questions</span>
                        <span className="font-medium text-slate-900">{sessionConfig.questionCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Est. Duration</span>
                        <span className="font-medium text-slate-900">{sessionConfig.questionCount * 2}-{sessionConfig.questionCount * 3} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Type</span>
                        <span className="font-medium text-slate-900">
                          {sessionTypes.find(t => t.id === sessionConfig.sessionType)?.label}
                        </span>
                      </div>
                      {selectedSavedJob && (
                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Company</span>
                            <span className="font-medium text-slate-900">{selectedSavedJob.company}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <span>Interview Tips</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Use the STAR method for behavioral questions</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Speak clearly and at a moderate pace</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Provide specific examples with metrics</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Practice in a quiet environment</span>
                      </li>
                    </ul>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={generateQuestions}
                    disabled={!sessionConfig.role.trim() || isGeneratingQuestions}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Generating Questions...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Interview Practice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Practice Step */}
          {currentStep === 'practice' && questions.length > 0 && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Practice Area */}
                <div className="lg:col-span-2">
                  {/* Progress Bar */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-slate-900">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </h3>
                      <span className="text-sm text-slate-600">
                        {sessionTypes.find(t => t.id === sessionConfig.sessionType)?.label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Display */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {questions[currentQuestionIndex]?.question}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Expected: {Math.round(questions[currentQuestionIndex]?.expectedDuration / 60)}min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{questions[currentQuestionIndex]?.type}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      {isLoadingAudio ? (
                        <div className="flex items-center space-x-2 text-purple-600">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Loading audio...</span>
                        </div>
                      ) : isPlayingAudio ? (
                        <div className="flex items-center space-x-2 text-purple-600">
                          <Volume2 className="w-5 h-5" />
                          <span>Playing question...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => playQuestionAudio(questions[currentQuestionIndex]?.question)}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          <span>Replay Question</span>
                        </button>
                      )}
                    </div>

                    {/* Recording Controls */}
                    <div className="text-center">
                      {isWaitingForResponse && (
                        <div className="mb-4">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Listening for your response...</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={handleStartRecording}
                          disabled={isListening || isAnalyzing}
                          className={`p-4 rounded-full transition-all ${
                            isListening 
                              ? 'bg-red-500 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        
                        {isListening && (
                          <button
                            onClick={handleStopRecording}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Stop & Submit
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mt-4">
                        {isListening 
                          ? 'Speak your answer. Click "Stop & Submit" when finished.' 
                          : 'Click the microphone to start recording your answer'
                        }
                      </p>

                      {speechError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">{speechError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript Display */}
                  {transcript && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Your Response</h4>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-700">{transcript}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis Loading */}
                  {isAnalyzing && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Brain className="w-6 h-6 text-purple-500 animate-pulse" />
                        <span className="text-lg font-semibold text-slate-900">Analyzing your response...</span>
                      </div>
                      <p className="text-slate-600">Our AI is evaluating your answer and preparing feedback</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Session Progress */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <span>Session Progress</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Questions</span>
                        <span className="font-medium text-slate-900">{currentQuestionIndex + 1}/{questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Completed</span>
                        <span className="font-medium text-slate-900">{responses.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Time Elapsed</span>
                        <span className="font-medium text-slate-900">
                          {sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0}min
                        </span>
                      </div>
                      {selectedSavedJob && (
                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Company</span>
                            <span className="font-medium text-slate-900">{selectedSavedJob.company}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Encouragement */}
                  {encouragementMessage && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                        <Star className="w-5 h-5 text-green-500" />
                        <span>Encouragement</span>
                      </h3>
                      <p className="text-sm text-slate-700">{encouragementMessage}</p>
                    </div>
                  )}

                  {/* Question Tips */}
                  {questions[currentQuestionIndex]?.keyPoints && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span>Key Points to Cover</span>
                      </h3>
                      <ul className="space-y-2">
                        {questions[currentQuestionIndex].keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Previous Responses */}
                  {responses.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <span>Previous Scores</span>
                      </h3>
                      <div className="space-y-2">
                        {responses.map((response, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Q{index + 1}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{response.analysis.score}%</span>
                              <div className={`w-2 h-2 rounded-full ${
                                response.analysis.score >= 80 ? 'bg-green-500' : 
                                response.analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Step */}
          {currentStep === 'results' && finalAnalysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Interview Complete!</h2>
                </div>
                <p className="text-lg text-slate-600">Here's your detailed performance analysis</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Results */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Overall Score */}
                  <div className="bg-white rounded-xl border border-slate-200 p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center space-x-4">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-slate-200"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-green-500"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - finalAnalysis.overallScore / 100)}`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-900">{finalAnalysis.overallScore}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-bold text-slate-900">Overall Score</h3>
                          <p className="text-slate-600">{finalAnalysis.readinessLevel}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 text-center">{finalAnalysis.overallFeedback}</p>
                  </div>

                  {/* Category Scores */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Performance Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(finalAnalysis.categoryScores).map(([category, score]) => (
                        <div key={category}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {category.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-semibold text-slate-900">{score}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths and Improvements */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Strengths</span>
                      </h3>
                      <ul className="space-y-2">
                        {finalAnalysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <span>Areas for Improvement</span>
                      </h3>
                      <ul className="space-y-2">
                        {finalAnalysis.areasForImprovement.map((area: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <span>Recommendations</span>
                    </h3>
                    <ul className="space-y-3">
                      {finalAnalysis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span>Next Steps</span>
                    </h3>
                    <ul className="space-y-2">
                      {finalAnalysis.nextSteps.map((step: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Session Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <span>Session Summary</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Role</span>
                        <span className="font-medium text-slate-900">{sessionConfig.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Questions</span>
                        <span className="font-medium text-slate-900">{questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Duration</span>
                        <span className="font-medium text-slate-900">
                          {Math.round((Date.now() - sessionStartTime) / 60000)}min
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Type</span>
                        <span className="font-medium text-slate-900">
                          {sessionTypes.find(t => t.id === sessionConfig.sessionType)?.label}
                        </span>
                      </div>
                      {selectedSavedJob && (
                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Company</span>
                            <span className="font-medium text-slate-900">{selectedSavedJob.company}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Question Scores */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Question Scores</h3>
                    <div className="space-y-3">
                      {responses.map((response, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Question {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{response.analysis.score}%</span>
                            <div className={`w-3 h-3 rounded-full ${
                              response.analysis.score >= 80 ? 'bg-green-500' : 
                              response.analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={restartSession}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Practice Again</span>
                    </button>
                    
                    <Link href="/dashboard">
                      <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                      </button>
                    </Link>

                    {selectedSavedJob && (
                      <Link href="/job-search?filter=saved">
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          <Briefcase className="w-4 h-4" />
                          <span>View Saved Jobs</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterviewPracticePage;