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
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  SkipForward,
  Settings,
  Zap,
  Brain,
  Star,
  Users,
  Briefcase,
  User,
  GraduationCap,
  DollarSign,
  Code,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Headphones,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAutoInterview } from "@/hooks/useAutoInterview";
import { useSearchParams } from "next/navigation";
import { getUserProfile, getUserExperiences, getUserSkills, getSavedJobById } from "@/lib/database";

// Session type configurations
const SESSION_TYPES = {
  'mock-interview': {
    title: 'Mock Interview',
    description: 'Complete interview simulation',
    icon: MessageSquare,
    color: 'from-blue-500 to-blue-600',
    questionTypes: ['introduction', 'behavioral', 'technical', 'situational', 'closing']
  },
  'introduction': {
    title: 'Introduction Practice',
    description: 'Perfect your elevator pitch',
    icon: User,
    color: 'from-green-500 to-green-600',
    questionTypes: ['introduction', 'personal-brand', 'career-overview']
  },
  'experience': {
    title: 'Experience Questions',
    description: 'STAR method and achievements',
    icon: Briefcase,
    color: 'from-purple-500 to-purple-600',
    questionTypes: ['behavioral', 'experience-based', 'achievement']
  },
  'strengths-weaknesses': {
    title: 'Strengths & Weaknesses',
    description: 'Self-assessment questions',
    icon: Target,
    color: 'from-orange-500 to-orange-600',
    questionTypes: ['self-assessment', 'behavioral', 'growth-mindset']
  },
  'salary': {
    title: 'Salary Negotiation',
    description: 'Compensation discussions',
    icon: DollarSign,
    color: 'from-yellow-500 to-yellow-600',
    questionTypes: ['negotiation', 'compensation', 'value-proposition']
  },
  'job-specific': {
    title: 'Job-Specific',
    description: 'Role and industry focused',
    icon: Code,
    color: 'from-indigo-500 to-indigo-600',
    questionTypes: ['technical', 'role-specific', 'industry-knowledge']
  }
};

const InterviewPracticePage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const urlSessionType = searchParams?.get('type') || 'mock-interview';
  const urlJobId = searchParams?.get('jobId');
  const urlRole = searchParams?.get('role');
  const urlCompany = searchParams?.get('company');

  // State management
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'results'>('setup');
  const [sessionType, setSessionType] = useState(urlSessionType);
  const [questionCount, setQuestionCount] = useState(3); // Default to 3 questions
  const [role, setRole] = useState(urlRole || '');
  const [experienceYears, setExperienceYears] = useState(2);
  const [context, setContext] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJob, setSavedJob] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Audio and speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Speech recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
    isSupported
  } = useSpeechToText();

  // Auto interview functionality
  const {
    isWaitingForResponse,
    startWaitingForResponse,
    stopWaitingForResponse,
    onSilenceDetected,
    detectSilence
  } = useAutoInterview(3000, 20); // 3 seconds silence, 20 char minimum

  // Load user data and saved job on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const [profile, experiences, skills] = await Promise.all([
          getUserProfile(user.id),
          getUserExperiences(user.id),
          getUserSkills(user.id)
        ]);
        
        setUserProfile({ profile, experiences, skills });
        
        // Load saved job if jobId is provided
        if (urlJobId) {
          const job = await getSavedJobById(urlJobId);
          if (job) {
            setSavedJob(job);
            setRole(job.title);
            setContext(`Practicing for ${job.title} position at ${job.company}`);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user, urlJobId]);

  // Cleanup audio on unmount or when ending interview
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentAudio]);

  // Stop audio when component unmounts or step changes
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [currentStep]);

  const stopAllAudio = useCallback(() => {
    // Stop current audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    
    // Stop audio ref
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    
    setIsPlayingAudio(false);
  }, [currentAudio]);

  // Detect silence for auto-progression
  useEffect(() => {
    detectSilence(transcript, isListening);
  }, [transcript, isListening, detectSilence]);

  // Handle silence detection
  useEffect(() => {
    onSilenceDetected(() => {
      if (transcript.trim().length > 20) {
        handleSubmitResponse();
      }
    });
  }, [transcript]);

  const playQuestionAudio = async (text: string, messageType: string = 'question') => {
    if (!audioEnabled) return;
    
    try {
      stopAllAudio(); // Stop any existing audio
      setIsPlayingAudio(true);
      
      const response = await fetch('/api/interview/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          voiceId: 'gsm4lUH9bnZ3pjR1Pw7w', // Updated voice ID
          messageType 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        
        // Start listening after question is read
        if (messageType === 'question') {
          setTimeout(() => {
            startListening();
            startWaitingForResponse();
          }, 500);
        }
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setCurrentAudio(null);
      
      // Start listening even if audio fails
      if (messageType === 'question') {
        setTimeout(() => {
          startListening();
          startWaitingForResponse();
        }, 500);
      }
    }
  };

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/interview/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          experienceYears,
          context,
          cvData: userProfile,
          sessionType,
          questionCount // Use the selected question count
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setCurrentStep('interview');
      
      // Start with first question
      if (data.questions.length > 0) {
        setTimeout(() => {
          playQuestionAudio(data.questions[0].question);
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!transcript.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    stopListening();
    stopWaitingForResponse();
    stopAllAudio(); // Stop any playing audio
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const responseStartTime = Date.now();
      
      const response = await fetch('/api/interview/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          response: transcript,
          questionType: currentQuestion.type,
          keyPoints: currentQuestion.keyPoints,
          role,
          experienceYears,
          duration: responseStartTime - (responses.length * 120000), // Approximate duration
          sessionType,
          isFollowUp: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze response');
      }

      const analysis = await response.json();
      
      const newResponse = {
        question: currentQuestion.question,
        response: transcript,
        analysis,
        timestamp: new Date().toISOString(),
        duration: Date.now() - responseStartTime
      };
      
      setResponses(prev => [...prev, newResponse]);
      
      // Play feedback audio
      if (audioEnabled && analysis.feedback) {
        await playQuestionAudio(
          `Your score: ${analysis.score}%. ${analysis.feedback.substring(0, 150)}...`,
          'feedback'
        );
      }
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        resetTranscript();
        
        // Play next question after a short delay
        setTimeout(() => {
          const nextQuestion = questions[currentQuestionIndex + 1];
          playQuestionAudio(nextQuestion.question);
        }, audioEnabled ? 3000 : 1000);
      } else {
        // Interview complete
        await generateFinalAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      setError('Failed to analyze response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFinalAnalysis = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/interview/final-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          experienceYears,
          responses: responses.map(r => ({
            question: r.question,
            response: r.response,
            score: r.analysis.score,
            type: questions.find(q => q.question === r.question)?.type || 'general'
          })),
          overallDuration: responses.reduce((sum, r) => sum + (r.duration || 0), 0),
          sessionType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate final analysis');
      }

      const analysis = await response.json();
      setFinalAnalysis(analysis);
      
      // Save session to database
      await saveSession(analysis);
      
      setCurrentStep('results');
      
      // Play final feedback
      if (audioEnabled) {
        const encouragement = analysis.overallScore >= 80 
          ? "Excellent work! You're well-prepared for interviews."
          : analysis.overallScore >= 70 
          ? "Good job! Keep practicing to improve further."
          : "Great effort! Practice makes perfect.";
        
        setTimeout(() => {
          playQuestionAudio(encouragement, 'summary');
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating final analysis:', error);
      setError('Failed to generate final analysis.');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (analysis: any) => {
    if (!user) return;
    
    try {
      const sessionData = {
        questions: questions.map((q, index) => ({
          ...q,
          response: responses[index]?.response || '',
          analysis: responses[index]?.analysis || null
        })),
        savedJobId: savedJob?.id || null,
        audioEnabled,
        sessionSettings: {
          questionCount,
          sessionType,
          role,
          experienceYears,
          context
        }
      };

      await fetch('/api/interview/save-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role,
          experienceYears,
          context,
          overallScore: analysis.overallScore,
          durationMinutes: Math.round(responses.reduce((sum, r) => sum + (r.duration || 0), 0) / 60000),
          questionsCount: questions.length,
          sessionData,
          insights: analysis,
          sessionType
        }),
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleEndInterview = () => {
    stopAllAudio(); // Stop all audio when ending interview
    stopListening();
    stopWaitingForResponse();
    setCurrentStep('results');
    
    if (responses.length > 0) {
      generateFinalAnalysis();
    }
  };

  const resetInterview = () => {
    stopAllAudio(); // Stop all audio when resetting
    setCurrentStep('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setFinalAnalysis(null);
    resetTranscript();
    stopListening();
    stopWaitingForResponse();
    setError(null);
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      stopAllAudio(); // Stop audio when skipping
      setCurrentQuestionIndex(prev => prev + 1);
      resetTranscript();
      stopListening();
      stopWaitingForResponse();
      
      // Play next question
      setTimeout(() => {
        const nextQuestion = questions[currentQuestionIndex + 1];
        playQuestionAudio(nextQuestion.question);
      }, 500);
    } else {
      handleEndInterview();
    }
  };

  // Setup Step Component
  const SetupStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Interview Practice Setup</h2>
        <p className="text-slate-600">Configure your practice session for the best experience</p>
      </div>

      {savedJob && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Practicing for saved job</h3>
              <p className="text-sm text-blue-700">{savedJob.title} at {savedJob.company}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="space-y-6">
          {/* Session Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Practice Type
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(SESSION_TYPES).map(([key, config]) => {
                const IconComponent = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSessionType(key)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      sessionType === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{config.title}</h3>
                        <p className="text-sm text-slate-600">{config.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Number of Questions
            </label>
            <div className="flex space-x-3">
              {[2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    questionCount === count
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-purple-300 text-slate-700'
                  }`}
                >
                  {count} questions
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Shorter sessions (2-3) are great for focused practice, longer ones (4-5) for comprehensive preparation
            </p>
          </div>

          {/* Role Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role/Position
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Software Engineer, Marketing Manager"
            />
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Years of Experience
            </label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={0}>Entry Level (0-1 years)</option>
              <option value={2}>Junior (2-3 years)</option>
              <option value={5}>Mid-level (4-6 years)</option>
              <option value={8}>Senior (7-10 years)</option>
              <option value={12}>Lead/Principal (10+ years)</option>
            </select>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Any specific areas you want to focus on or company information..."
            />
          </div>

          {/* Audio Settings */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Headphones className="w-5 h-5 text-slate-600" />
              <div>
                <h3 className="font-semibold text-slate-900">Voice Interview</h3>
                <p className="text-sm text-slate-600">AI will read questions aloud</p>
              </div>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioEnabled ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Speech Recognition Check */}
          {!isSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Speech Recognition Not Available</h3>
                  <p className="text-sm text-yellow-700">
                    Your browser doesn't support speech recognition. You can still practice, but you'll need to type your responses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={generateQuestions}
            disabled={!role.trim() || loading}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{loading ? 'Generating...' : 'Start Interview'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Interview Step Component
  const InterviewStep = () => {
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
            <span className="text-sm font-medium text-slate-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-slate-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <motion.div
              className="bg-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                    {currentQuestion?.type?.replace('-', ' ')} Question
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {currentQuestion?.question}
                </h2>
                
                {/* Audio Controls */}
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => playQuestionAudio(currentQuestion?.question)}
                    disabled={isPlayingAudio}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isPlayingAudio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>{isPlayingAudio ? 'Playing...' : 'Replay Question'}</span>
                  </button>
                  
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      audioEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>

                {/* Key Points */}
                {currentQuestion?.keyPoints && currentQuestion.keyPoints.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Key Points to Address:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {currentQuestion.keyPoints.map((point: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Response Area */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Your Response</h3>
                  <div className="flex items-center space-x-2">
                    {isSupported && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          isListening
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>{isListening ? 'Stop' : 'Start'} Recording</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Transcript Display */}
                <div className="min-h-[200px] p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                  {isListening && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-600 font-medium">Recording...</span>
                    </div>
                  )}
                  
                  {transcript ? (
                    <p className="text-slate-900 leading-relaxed">{transcript}</p>
                  ) : (
                    <p className="text-slate-500 italic">
                      {isSupported 
                        ? "Click 'Start Recording' and begin speaking your response..."
                        : "Speech recognition not available. Please type your response below."
                      }
                    </p>
                  )}
                </div>

                {/* Manual Input for non-supported browsers */}
                {!isSupported && (
                  <textarea
                    value={transcript}
                    onChange={(e) => {
                      // This is a workaround for non-supported browsers
                      // You'd need to implement a manual transcript setter
                    }}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Type your response here..."
                  />
                )}

                {speechError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{speechError}</p>
                  </div>
                )}

                {/* Auto-progression indicator */}
                {isWaitingForResponse && transcript.length > 20 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <p className="text-green-700 text-sm">
                        Great response! I'll automatically move to the next question when you finish speaking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <button
                    onClick={skipQuestion}
                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip Question</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleEndInterview}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      End Interview
                    </button>
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!transcript.trim() || isAnalyzing}
                      className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>{isAnalyzing ? 'Analyzing...' : 'Submit Response'}</span>
                    </button>
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
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Type:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {SESSION_TYPES[sessionType as keyof typeof SESSION_TYPES]?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Role:</span>
                  <span className="text-sm font-medium text-slate-900">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Experience:</span>
                  <span className="text-sm font-medium text-slate-900">{experienceYears} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Questions:</span>
                  <span className="text-sm font-medium text-slate-900">{questions.length}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Progress</h3>
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index < currentQuestionIndex
                        ? 'bg-green-500 text-white'
                        : index === currentQuestionIndex
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {index < currentQuestionIndex ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-sm ${
                      index === currentQuestionIndex ? 'font-medium text-slate-900' : 'text-slate-600'
                    }`}>
                      {q.type?.replace('-', ' ')} Question
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Interview Tips</span>
              </h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Use the STAR method for behavioral questions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Be specific with examples and metrics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Take your time to think before responding</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Show enthusiasm and ask clarifying questions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Results Step Component
  const ResultsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Interview Complete!</h2>
        <p className="text-slate-600">Here's your detailed performance analysis</p>
      </div>

      {finalAnalysis && (
        <div className="space-y-8">
          {/* Overall Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-green-500"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - finalAnalysis.overallScore / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{finalAnalysis.overallScore}</div>
                    <div className="text-slate-600 text-sm">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{finalAnalysis.readinessLevel}</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">{finalAnalysis.overallFeedback}</p>
          </div>

          {/* Detailed Analysis */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Strengths & Areas for Improvement */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Star className="w-5 h-5 text-green-500" />
                  <span>Strengths</span>
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  <span>Areas for Improvement</span>
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.areasForImprovement.map((area: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Category Scores */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Category Breakdown</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(finalAnalysis.categoryScores).map(([category, score]: [string, any]) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.5, duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations & Next Steps */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Recommendations</span>
              </h3>
              <ul className="space-y-3">
                {finalAnalysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Next Steps</span>
              </h3>
              <ul className="space-y-3">
                {finalAnalysis.nextSteps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-slate-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Individual Question Analysis */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Question-by-Question Analysis</span>
            </h3>
            <div className="space-y-6">
              {responses.map((response, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-slate-900">Question {index + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        response.analysis.score >= 80 ? 'bg-green-100 text-green-700' :
                        response.analysis.score >= 70 ? 'bg-blue-100 text-blue-700' :
                        response.analysis.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {response.analysis.score}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{response.question}</p>
                  <p className="text-sm text-slate-800 italic mb-3">"{response.response.substring(0, 150)}..."</p>
                  <p className="text-sm text-slate-700">{response.analysis.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetInterview}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );

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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Interview Practice</h1>
                  <p className="text-sm text-slate-600">AI-powered interview coaching</p>
                </div>
              </div>
            </div>
            
            {currentStep === 'interview' && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <button
                  onClick={handleEndInterview}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  End Interview
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'setup' && <SetupStep />}
          {currentStep === 'interview' && <InterviewStep />}
          {currentStep === 'results' && <ResultsStep />}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InterviewPracticePage;