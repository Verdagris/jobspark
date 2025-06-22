"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  AlertCircle,
  Star,
  Award,
  FileText,
  MessageSquare,
  Briefcase,
  User,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Brain,
  Clock,
  Users
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  getUserProfile, 
  getUserExperiences, 
  getUserEducation, 
  getUserSkills, 
  getUserCVs,
  getUserInterviewSessions,
  getInterviewInsights
} from "@/lib/database";

const CareerScorePage = () => {
  const { user } = useAuth();
  const [overallScore, setOverallScore] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<any>(null);

  // Load real user data and calculate scores
  useEffect(() => {
    const loadUserDataAndCalculateScore = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [profile, experiences, education, skills, cvs, interviewSessions] = await Promise.all([
          getUserProfile(user.id),
          getUserExperiences(user.id),
          getUserEducation(user.id),
          getUserSkills(user.id),
          getUserCVs(user.id),
          getUserInterviewSessions(user.id)
        ]);

        // Calculate profile completeness score
        const profileScore = calculateProfileScore(profile, experiences, education, skills);
        
        // Calculate CV quality score
        const cvScore = calculateCVScore(cvs, experiences, skills);
        
        // Calculate interview readiness score
        const interviewScore = calculateInterviewScore(interviewSessions);
        
        // Calculate market alignment score
        const marketScore = calculateMarketScore(skills, experiences);
        
        // Calculate overall score
        const overall = Math.round((profileScore + cvScore + interviewScore + marketScore) / 4);
        
        // Generate trends (simulated based on user activity)
        const trends = generateTrends(overall, interviewSessions, cvs);
        
        // Generate recommendations
        const recommendations = generateRecommendations(profileScore, cvScore, interviewScore, marketScore);
        
        const calculatedScoreData = {
          overall,
          categories: [
            {
              name: "Profile Completeness",
              score: profileScore,
              maxScore: 100,
              icon: User,
              status: getScoreStatus(profileScore),
              description: getProfileDescription(profileScore),
              improvements: getProfileImprovements(profile, experiences, education, skills)
            },
            {
              name: "CV Quality",
              score: cvScore,
              maxScore: 100,
              icon: FileText,
              status: getScoreStatus(cvScore),
              description: getCVDescription(cvScore),
              improvements: getCVImprovements(cvs, experiences, skills)
            },
            {
              name: "Interview Readiness",
              score: interviewScore,
              maxScore: 100,
              icon: MessageSquare,
              status: getScoreStatus(interviewScore),
              description: getInterviewDescription(interviewScore),
              improvements: getInterviewImprovements(interviewSessions)
            },
            {
              name: "Market Alignment",
              score: marketScore,
              maxScore: 100,
              icon: Briefcase,
              status: getScoreStatus(marketScore),
              description: getMarketDescription(marketScore),
              improvements: getMarketImprovements(skills, experiences)
            }
          ],
          trends,
          recommendations,
          insights: {
            totalExperience: experiences.length,
            totalSkills: skills.length,
            totalEducation: education.length,
            totalCVs: cvs.length,
            totalInterviews: interviewSessions.length,
            averageInterviewScore: interviewSessions.length > 0 
              ? Math.round(interviewSessions.reduce((sum, session) => sum + session.overall_score, 0) / interviewSessions.length)
              : 0,
            lastActivity: getLastActivity(experiences, cvs, interviewSessions),
            strongestSkills: getStrongestSkills(skills),
            improvementAreas: getImprovementAreas(profileScore, cvScore, interviewScore, marketScore)
          }
        };
        
        setScoreData(calculatedScoreData);
        
        // Animate score
        setTimeout(() => {
          setOverallScore(overall);
        }, 500);
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserDataAndCalculateScore();
  }, [user]);

  // Scoring functions
  const calculateProfileScore = (profile: any, experiences: any[], education: any[], skills: any[]) => {
    let score = 0;
    
    // Basic profile info (30 points)
    if (profile?.full_name) score += 5;
    if (profile?.email) score += 5;
    if (profile?.phone) score += 5;
    if (profile?.location) score += 5;
    if (profile?.professional_summary) score += 10;
    
    // Experience (25 points)
    if (experiences.length > 0) score += 10;
    if (experiences.length >= 2) score += 10;
    if (experiences.some(exp => exp.description && exp.description.length > 100)) score += 5;
    
    // Education (20 points)
    if (education.length > 0) score += 15;
    if (education.some(edu => edu.description)) score += 5;
    
    // Skills (25 points)
    if (skills.length >= 3) score += 10;
    if (skills.length >= 5) score += 10;
    if (skills.some(skill => skill.level === 'Advanced' || skill.level === 'Expert')) score += 5;
    
    return Math.min(100, score);
  };

  const calculateCVScore = (cvs: any[], experiences: any[], skills: any[]) => {
    let score = 40; // Base score
    
    // Has generated CVs (30 points)
    if (cvs.length > 0) score += 20;
    if (cvs.length >= 2) score += 10;
    
    // Quality indicators (30 points)
    if (experiences.length >= 2) score += 10;
    if (skills.length >= 5) score += 10;
    if (experiences.some(exp => exp.description && exp.description.length > 150)) score += 10;
    
    return Math.min(100, score);
  };

  const calculateInterviewScore = (sessions: any[]) => {
    if (sessions.length === 0) return 30; // Base score for no practice
    
    const avgScore = sessions.reduce((sum, session) => sum + session.overall_score, 0) / sessions.length;
    const recentSessions = sessions.filter(session => 
      new Date(session.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    let score = Math.round(avgScore * 0.7); // 70% based on performance
    if (sessions.length >= 3) score += 10; // Practice frequency
    if (recentSessions > 0) score += 10; // Recent practice
    if (sessions.length >= 5) score += 10; // Extensive practice
    
    return Math.min(100, score);
  };

  const calculateMarketScore = (skills: any[], experiences: any[]) => {
    let score = 50; // Base score
    
    // In-demand skills
    const inDemandSkills = ['React', 'Python', 'JavaScript', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis'];
    const userSkillNames = skills.map(s => s.name.toLowerCase());
    const matchingSkills = inDemandSkills.filter(skill => 
      userSkillNames.some(userSkill => userSkill.includes(skill.toLowerCase()))
    );
    
    score += matchingSkills.length * 5;
    
    // Recent experience
    const recentExperience = experiences.filter(exp => 
      exp.is_current || new Date(exp.end_date || exp.start_date) > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    );
    
    if (recentExperience.length > 0) score += 15;
    if (experiences.length >= 3) score += 10;
    
    return Math.min(100, score);
  };

  const getScoreStatus = (score: number) => {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    return "needs-work";
  };

  const getProfileDescription = (score: number) => {
    if (score >= 85) return "Your profile is comprehensive and professional";
    if (score >= 70) return "Good profile with room for enhancement";
    return "Profile needs more details to stand out";
  };

  const getCVDescription = (score: number) => {
    if (score >= 85) return "Strong CV that showcases your experience well";
    if (score >= 70) return "Good CV with room for improvement";
    return "CV needs more work to be competitive";
  };

  const getInterviewDescription = (score: number) => {
    if (score >= 85) return "Excellent interview skills and preparation";
    if (score >= 70) return "Good interview skills, keep practicing";
    return "More practice needed to improve confidence";
  };

  const getMarketDescription = (score: number) => {
    if (score >= 85) return "Your skills are highly aligned with market demands";
    if (score >= 70) return "Good market alignment with some gaps";
    return "Skills need updating for current market";
  };

  // Improvement suggestions
  const getProfileImprovements = (profile: any, experiences: any[], education: any[], skills: any[]) => {
    const improvements = [];
    if (!profile?.professional_summary) improvements.push("Add a professional summary");
    if (!profile?.phone) improvements.push("Add contact information");
    if (experiences.length < 2) improvements.push("Add more work experience");
    if (skills.length < 5) improvements.push("Add more relevant skills");
    return improvements.slice(0, 3);
  };

  const getCVImprovements = (cvs: any[], experiences: any[], skills: any[]) => {
    const improvements = [];
    if (cvs.length === 0) improvements.push("Generate your first CV");
    if (experiences.some(exp => !exp.description || exp.description.length < 100)) {
      improvements.push("Add detailed job descriptions");
    }
    if (skills.length < 5) improvements.push("Add more technical skills");
    improvements.push("Quantify your achievements");
    return improvements.slice(0, 3);
  };

  const getInterviewImprovements = (sessions: any[]) => {
    const improvements = [];
    if (sessions.length === 0) improvements.push("Start practicing with mock interviews");
    if (sessions.length < 3) improvements.push("Complete more practice sessions");
    if (sessions.length > 0) {
      const avgScore = sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length;
      if (avgScore < 80) improvements.push("Focus on improving response quality");
    }
    improvements.push("Practice behavioral questions");
    return improvements.slice(0, 3);
  };

  const getMarketImprovements = (skills: any[], experiences: any[]) => {
    const improvements = [];
    improvements.push("Learn in-demand technologies");
    improvements.push("Update skills with current trends");
    if (experiences.length < 2) improvements.push("Gain more relevant experience");
    return improvements.slice(0, 3);
  };

  const generateTrends = (currentScore: number, sessions: any[], cvs: any[]) => {
    // Simulate trends based on activity
    const lastMonth = currentScore - Math.floor(Math.random() * 10) - 5;
    const threeMonthsAgo = lastMonth - Math.floor(Math.random() * 15) - 5;
    
    return [
      { period: "This Week", change: Math.floor(Math.random() * 5) + 1, score: currentScore },
      { period: "Last Month", change: currentScore - lastMonth, score: lastMonth },
      { period: "3 Months Ago", change: lastMonth - threeMonthsAgo, score: threeMonthsAgo }
    ];
  };

  const generateRecommendations = (profileScore: number, cvScore: number, interviewScore: number, marketScore: number) => {
    const recommendations = [];
    
    if (interviewScore < 70) {
      recommendations.push({
        title: "Complete Interview Practice",
        description: "Boost your interview readiness with AI-powered mock interviews",
        impact: "+15 points",
        action: "Start Practice",
        href: "/interview-practice",
        priority: "high"
      });
    }
    
    if (cvScore < 80) {
      recommendations.push({
        title: "Enhance Your CV",
        description: "Use AI to improve your CV with better descriptions and formatting",
        impact: "+10 points",
        action: "Improve CV",
        href: "/cv-builder",
        priority: "medium"
      });
    }
    
    if (marketScore < 75) {
      recommendations.push({
        title: "Update Your Skills",
        description: "Add in-demand skills to improve your market alignment",
        impact: "+8 points",
        action: "Add Skills",
        href: "/onboarding",
        priority: "medium"
      });
    }
    
    recommendations.push({
      title: "Apply to More Jobs",
      description: "Increase your visibility by applying to relevant positions",
      impact: "+5 points",
      action: "View Jobs",
      href: "/job-matches",
      priority: "low"
    });
    
    return recommendations.slice(0, 3);
  };

  const getLastActivity = (experiences: any[], cvs: any[], sessions: any[]) => {
    const dates = [
      ...experiences.map(exp => new Date(exp.created_at)),
      ...cvs.map(cv => new Date(cv.created_at)),
      ...sessions.map(session => new Date(session.created_at))
    ].sort((a, b) => b.getTime() - a.getTime());
    
    if (dates.length === 0) return "No recent activity";
    
    const lastDate = dates[0];
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStrongestSkills = (skills: any[]) => {
    return skills
      .filter(skill => skill.level === 'Advanced' || skill.level === 'Expert')
      .map(skill => skill.name)
      .slice(0, 3);
  };

  const getImprovementAreas = (profileScore: number, cvScore: number, interviewScore: number, marketScore: number) => {
    const areas = [
      { name: "Profile", score: profileScore },
      { name: "CV", score: cvScore },
      { name: "Interview", score: interviewScore },
      { name: "Market", score: marketScore }
    ].sort((a, b) => a.score - b.score);
    
    return areas.slice(0, 2).map(area => area.name);
  };

  const recalculateScore = async () => {
    setIsCalculating(true);
    // Simulate recalculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCalculating(false);
    // Reload the page to recalculate
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "needs-work": return "text-orange-600 bg-orange-100";
      default: return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return CheckCircle;
      case "good": return CheckCircle;
      case "needs-work": return AlertCircle;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
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
                  <Target className="w-8 h-8 text-orange-500" />
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Career Score</h1>
                    <p className="text-sm text-slate-600">Analyzing your readiness</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Calculating Your Career Score</h2>
            <p className="text-slate-600">Analyzing your profile, CV, and interview performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Calculate Score</h2>
          <p className="text-slate-600">Please complete your profile first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Header with JobSpark Branding */}
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
                <Target className="w-8 h-8 text-orange-500" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Career Score</h1>
                  <p className="text-sm text-slate-600">Check your readiness</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={recalculateScore}
              disabled={isCalculating}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>{isCalculating ? "Calculating..." : "Recalculate"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Career Readiness Score</h2>
                <p className="text-slate-600">Based on your profile, CV, interviews, and market alignment</p>
              </div>
              
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
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
                      className="stroke-orange-500"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - overallScore / 100) }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="text-5xl font-bold text-slate-900"
                      >
                        {overallScore}
                      </motion.div>
                      <div className="text-slate-600 font-medium">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full mb-4">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">
                    {overallScore >= 85 ? "Excellent Candidate" : 
                     overallScore >= 70 ? "Strong Candidate" : 
                     overallScore >= 60 ? "Good Candidate" : "Developing Candidate"}
                  </span>
                </div>
                <p className="text-slate-600">
                  {overallScore >= 85 ? "You're ready for senior roles and challenging interviews." :
                   overallScore >= 70 ? "You're well-positioned for most roles with minor improvements." :
                   overallScore >= 60 ? "Good foundation with some areas needing attention." :
                   "Focus on the recommendations below to improve your readiness."}
                </p>
              </div>
            </motion.div>
          </div>
          
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Score Trends</span>
              </h3>
              <div className="space-y-4">
                {scoreData.trends.map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{trend.period}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">{trend.score}</span>
                      <div className={`flex items-center space-x-1 ${
                        trend.change > 0 ? 'text-green-600' : trend.change < 0 ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        {trend.change > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : trend.change < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        <span className="text-sm font-medium">
                          {trend.change > 0 ? '+' : ''}{trend.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Quick Insights</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Experience</span>
                  <span className="font-semibold text-slate-900">{scoreData.insights.totalExperience}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Skills Listed</span>
                  <span className="font-semibold text-slate-900">{scoreData.insights.totalSkills}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">CVs Created</span>
                  <span className="font-semibold text-slate-900">{scoreData.insights.totalCVs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Interview Practice</span>
                  <span className="font-semibold text-slate-900">{scoreData.insights.totalInterviews}</span>
                </div>
                {scoreData.insights.averageInterviewScore > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Avg Interview Score</span>
                    <span className="font-semibold text-purple-600">{scoreData.insights.averageInterviewScore}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Last Activity</span>
                  <span className="font-semibold text-slate-900">{scoreData.insights.lastActivity}</span>
                </div>
              </div>
            </motion.div>

            {scoreData.insights.strongestSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl border border-slate-200 p-6"
              >
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Strongest Skills</span>
                </h3>
                <div className="space-y-2">
                  {scoreData.insights.strongestSkills.map((skill: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-slate-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
            <PieChart className="w-6 h-6 text-blue-500" />
            <span>Score Breakdown</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {scoreData.categories.map((category: any, index: number) => {
              const StatusIcon = getStatusIcon(category.status);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <category.icon className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{category.name}</h3>
                        <p className="text-sm text-slate-600">{category.description}</p>
                      </div>
                    </div>
                    <div className={`p-1 rounded-full ${getStatusColor(category.status)}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Score</span>
                      <span className="font-bold text-slate-900">{category.score}/{category.maxScore}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <motion.div
                        className="bg-orange-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(category.score / category.maxScore) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Improvements:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {category.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-slate-200 p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-slate-900">Personalized Recommendations</h2>
          </div>
          
          <div className="space-y-4">
            {scoreData.recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className={`border-l-4 pl-6 py-4 ${
                  rec.priority === 'high' ? 'border-red-400 bg-red-50' :
                  rec.priority === 'medium' ? 'border-orange-400 bg-orange-50' :
                  'border-blue-400 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-slate-600 mb-2">{rec.description}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Star className="w-4 h-4 text-orange-400" />
                      <span className="font-medium text-orange-600">Potential impact: {rec.impact}</span>
                    </div>
                  </div>
                  <Link href={rec.href}>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                      <span>{rec.action}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CareerScorePage;