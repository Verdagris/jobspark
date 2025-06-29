"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  getUserProfile, 
  getUserExperiences, 
  getUserEducation,
  getUserSkills, 
  getUserCVs,
  getUserInterviewSessions,
  getUserProgress,
  getUserSavedJobs,
  getEncouragementMessage,
  getSessionRecommendations,
  calculateCareerScore
} from "@/lib/database";
import { 
  Sparkles, 
  LogOut, 
  FileText, 
  MessageSquare, 
  Briefcase, 
  Target,
  User,
  Settings,
  TrendingUp,
  Calendar,
  Bell,
  Bookmark,
  Award,
  Clock,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Star,
  Activity,
  X,
  Shield,
  Mail,
  ArrowRight,
  Plus,
  TrendingDown,
  Users,
  MapPin,
  Building2,
  Flame,
  Trophy,
  BookOpen,
  Search
} from "lucide-react";
import Link from "next/link";

const DashboardPage = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState("");
  const [recommendations, setRecommendations] = useState<any>(null);
  
  // UI state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (loading) return;
      
      if (!user) {
        if (!redirecting) {
          setRedirecting(true);
          router.push('/auth');
        }
        return;
      }

      try {
        const profile = await getUserProfile(user.id);
        if (!profile || !profile.onboarding_completed) {
          if (!redirecting) {
            setRedirecting(true);
            router.push('/onboarding');
          }
          return;
        }
        
        // Load dashboard data
        await loadDashboardData();
      } catch (error) {
        console.error('Error checking profile:', error);
        if (!redirecting) {
          setRedirecting(true);
          router.push('/onboarding');
        }
        return;
      } finally {
        setProfileLoading(false);
      }
    };

    checkOnboarding();
  }, [user, loading, router, redirecting]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const [profile, experiences, education, skills, cvs, interviewSessions, progress, savedJobs] = await Promise.all([
        getUserProfile(user.id),
        getUserExperiences(user.id),
        getUserEducation(user.id),
        getUserSkills(user.id),
        getUserCVs(user.id),
        getUserInterviewSessions(user.id),
        getUserProgress(user.id),
        getUserSavedJobs(user.id)
      ]);

      // Calculate profile completion
      const profileCompletion = calculateProfileCompletion(profile, experiences, skills);
      
      // Use consistent career score calculation with education parameter
      const careerScore = calculateCareerScore(profile, experiences, skills, cvs, interviewSessions, education);
      
      // Get recent activity with more details
      const recentActivity = getEnhancedRecentActivity(experiences, cvs, interviewSessions);
      
      // Generate notifications based on user activity
      const userNotifications = generateUserNotifications(profile, progress, interviewSessions, cvs);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
      
      // Calculate stats
      const stats = {
        profileCompletion,
        savedJobs: savedJobs.length,
        practiceCount: interviewSessions.filter(session => {
          const sessionDate = new Date(session.created_at);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return sessionDate >= oneMonthAgo;
        }).length,
        careerScore
      };

      setDashboardData({
        profile,
        experiences,
        education,
        skills,
        cvs,
        interviewSessions,
        progress,
        savedJobs,
        stats,
        recentActivity
      });

      // Load encouragement and recommendations
      const [encouragement, recs] = await Promise.all([
        getEncouragementMessage(user.id),
        getSessionRecommendations(user.id)
      ]);
      
      setEncouragementMessage(encouragement);
      setRecommendations(recs);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateProfileCompletion = (profile: any, experiences: any[], skills: any[]) => {
    let completed = 0;
    let total = 8;
    let missingItems = [];
    
    if (profile?.full_name) completed++;
    else missingItems.push("Full name");
    
    if (profile?.email) completed++;
    else missingItems.push("Email");
    
    if (profile?.phone) completed++;
    else missingItems.push("Phone number");
    
    if (profile?.location) completed++;
    else missingItems.push("Location");
    
    if (profile?.professional_summary) completed++;
    else missingItems.push("Professional summary");
    
    if (experiences.length > 0) completed++;
    else missingItems.push("Work experience");
    
    if (skills.length >= 3) completed++;
    else missingItems.push("Skills (at least 3)");
    
    if (profile?.profile_image_url) completed++;
    else missingItems.push("Profile photo");
    
    return {
      percentage: Math.round((completed / total) * 100),
      missingItems: missingItems
    };
  };

  const getEnhancedRecentActivity = (experiences: any[], cvs: any[], sessions: any[]) => {
    const activities = [];
    
    // Add recent interview sessions with detailed info
    sessions.slice(0, 3).forEach(session => {
      const improvement = session.overall_score >= 80 ? 'excellent' : session.overall_score >= 70 ? 'good' : 'needs-work';
      activities.push({
        type: 'interview',
        title: 'Interview Practice Completed',
        description: `${session.session_type?.replace('-', ' ') || 'Mock interview'} for ${session.role} role`,
        details: `Score: ${session.overall_score}% • ${session.questions_count} questions • ${session.duration_minutes}min`,
        time: new Date(session.created_at),
        icon: MessageSquare,
        color: improvement === 'excellent' ? 'green' : improvement === 'good' ? 'blue' : 'orange',
        score: session.overall_score,
        sessionType: session.session_type
      });
    });
    
    // Add recent CVs
    cvs.slice(0, 2).forEach(cv => {
      activities.push({
        type: 'cv',
        title: 'CV Generated',
        description: `Created "${cv.title || 'Professional CV'}"`,
        details: `Version ${cv.version} • ${cv.job_description ? 'Tailored for specific role' : 'General purpose'}`,
        time: new Date(cv.created_at),
        icon: FileText,
        color: 'green'
      });
    });
    
    // Add recent experiences
    experiences.slice(0, 1).forEach(exp => {
      activities.push({
        type: 'experience',
        title: 'Work Experience Added',
        description: `Added ${exp.title} at ${exp.company}`,
        details: `${exp.is_current ? 'Current position' : `${exp.start_date} - ${exp.end_date}`}`,
        time: new Date(exp.created_at),
        icon: Briefcase,
        color: 'blue'
      });
    });
    
    // Sort by time and return latest 5
    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  };

  const generateUserNotifications = (profile: any, progress: any, sessions: any[], cvs: any[]) => {
    const notifications = [];
    const now = new Date();
    
    // Recent session completion
    if (sessions.length > 0) {
      const lastSession = sessions[0];
      const sessionDate = new Date(lastSession.created_at);
      const hoursAgo = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60));
      
      if (hoursAgo < 24) {
        notifications.push({
          id: 1,
          type: lastSession.overall_score >= 80 ? 'success' : 'info',
          title: 'Interview Practice Complete',
          message: `Great job on your ${lastSession.session_type?.replace('-', ' ') || 'interview'} practice! You scored ${lastSession.overall_score}%.`,
          time: `${hoursAgo} hours ago`,
          read: false,
          actionable: true,
          action: 'View Details',
          actionUrl: '/interview-practice'
        });
      }
    }
    
    // Weekly goal progress
    if (progress?.sessions_this_week !== undefined) {
      const weeklyGoal = 3;
      if (progress.sessions_this_week >= weeklyGoal) {
        notifications.push({
          id: 2,
          type: 'success',
          title: 'Weekly Goal Achieved! 🎉',
          message: `Congratulations! You've completed ${progress.sessions_this_week} practice sessions this week.`,
          time: '1 day ago',
          read: false
        });
      } else if (progress.sessions_this_week === weeklyGoal - 1) {
        notifications.push({
          id: 3,
          type: 'reminder',
          title: 'Almost There!',
          message: `You're 1 session away from your weekly goal of ${weeklyGoal} practices.`,
          time: '2 days ago',
          read: false,
          actionable: true,
          action: 'Practice Now',
          actionUrl: '/interview-practice'
        });
      }
    }
    
    // Profile completion reminder
    const profileCompletion = calculateProfileCompletion(profile, [], []);
    if (profileCompletion.percentage < 80) {
      notifications.push({
        id: 4,
        type: 'reminder',
        title: 'Complete Your Profile',
        message: `Your profile is ${profileCompletion.percentage}% complete. Add more details to improve your career score.`,
        time: '3 days ago',
        read: true,
        actionable: true,
        action: 'Complete Profile',
        actionUrl: '/onboarding'
      });
    }
    
    // New features or tips
    notifications.push({
      id: 5,
      type: 'info',
      title: 'Tip: Use STAR Method',
      message: 'Structure your behavioral interview answers using Situation, Task, Action, Result for better impact.',
      time: '1 week ago',
      read: true
    });
    
    return notifications;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Settings Modal Component (simplified)
  const SettingsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowSettings(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Full Name</span>
                  <span className="text-sm font-medium text-slate-900">
                    {dashboardData?.profile?.full_name || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm font-medium text-slate-900">
                    {user?.email}
                  </span>
                </div>
                <Link href="/onboarding">
                  <button className="w-full text-left px-3 py-2 text-sm text-sa-green hover:bg-sa-green/10 rounded-lg transition-colors">
                    Edit Profile
                  </button>
                </Link>
              </div>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Support</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>Contact Support</span>
                </button>
              </div>
            </div>

            {/* Account Section */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Notifications Dropdown Component
  const NotificationsDropdown = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50"
    >
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-sa-green/10 text-sa-green px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                !notification.read ? 'bg-sa-green/5' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === 'success' ? 'bg-sa-green' :
                  notification.type === 'info' ? 'bg-blue-500' :
                  'bg-sa-gold'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 text-sm">{notification.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">{notification.time}</span>
                    <div className="flex items-center space-x-2">
                      {notification.actionable && (
                        <Link href={notification.actionUrl || '#'}>
                          <button className="text-xs text-sa-green hover:text-sa-green-dark font-medium">
                            {notification.action}
                          </button>
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-sa-green rounded-full" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="p-3 border-t border-slate-200">
          <button 
            onClick={markAllAsRead}
            className="w-full text-center text-sm text-sa-green hover:text-sa-green-dark transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </motion.div>
  );

  if (loading || profileLoading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-sa-green/30 border-t-sa-green rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return null;
  }

  const quickActions = [
    {
      icon: FileText,
      title: "Generate CV",
      description: "Create a professional CV with AI",
      color: "from-sa-green to-sa-green-dark",
      href: "/cv-builder"
    },
    {
      icon: MessageSquare,
      title: "Interview Practice",
      description: "Practice with our AI coach",
      color: "from-sa-gold to-sa-gold-dark",
      href: "/interview-practice"
    },
    {
      icon: Search,
      title: "Job Search",
      description: "Find and save job opportunities",
      color: "from-sa-green-light to-sa-green",
      href: "/job-search"
    },
    {
      icon: Target,
      title: "Career Score",
      description: "Check your readiness",
      color: "from-sa-gold-light to-sa-gold",
      href: "/career-score"
    }
  ];

  const stats = [
    { 
      label: "Profile Completion", 
      value: `${dashboardData.stats.profileCompletion.percentage}%`, 
      icon: User,
      color: "text-sa-green bg-sa-green/10",
      trend: dashboardData.stats.profileCompletion.percentage > 80 ? 'up' : 'neutral',
      details: dashboardData.stats.profileCompletion.missingItems.length > 0 
        ? `Missing: ${dashboardData.stats.profileCompletion.missingItems.slice(0, 2).join(', ')}${dashboardData.stats.profileCompletion.missingItems.length > 2 ? '...' : ''}`
        : 'Complete'
    },
    { 
      label: "Jobs Saved", 
      value: dashboardData.stats.savedJobs.toString(), 
      icon: Bookmark,
      color: "text-sa-gold bg-sa-gold/10",
      trend: 'up',
      details: dashboardData.stats.savedJobs > 0 ? `${dashboardData.savedJobs.filter(j => j.is_applied).length} applied` : 'Save jobs to apply'
    },
    { 
      label: "Practice Sessions", 
      value: dashboardData.stats.practiceCount.toString(), 
      icon: Calendar,
      color: "text-sa-green-dark bg-sa-green/10",
      trend: 'up',
      details: 'Past 30 days'
    },
    { 
      label: "Career Score", 
      value: dashboardData.stats.careerScore.toString(), 
      icon: TrendingUp,
      color: "text-sa-gold-dark bg-sa-gold/10",
      trend: dashboardData.stats.careerScore > 75 ? 'up' : 'neutral',
      details: dashboardData.stats.careerScore > 80 ? 'Excellent' : dashboardData.stats.careerScore > 70 ? 'Good' : 'Needs improvement'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-sa-green" />
              <span className="text-2xl font-bold text-slate-900">JobSpark</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-sa-gold rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{unreadCount}</span>
                    </div>
                  )}
                </button>
                {showNotifications && <NotificationsDropdown />}
              </div>

              {/* Settings Button */}
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-sa-green rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-slate-700 font-medium hidden sm:block">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && <SettingsModal />}
      </AnimatePresence>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Encouragement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}! 🇿🇦
              </h1>
              {encouragementMessage && (
                <p className="text-slate-600 max-w-2xl leading-relaxed">
                  {encouragementMessage}
                </p>
              )}
            </div>
            {dashboardData.stats.careerScore < 80 && (
              <div className="hidden md:block">
                <div className="bg-sa-gold/10 border border-sa-gold/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-sa-gold" />
                    <span className="text-sm font-medium text-sa-gold-dark">
                      Boost your career score to {dashboardData.stats.careerScore + 10}+
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid with Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  {stat.details && (
                    <p className="text-xs text-slate-500 mt-1">{stat.details}</p>
                  )}
                  {stat.label === "Profile Completion" && parseInt(stat.value) < 100 && (
                    <Link href="/onboarding">
                      <button className="text-xs text-sa-gold mt-1 hover:text-sa-gold-dark font-medium">
                        Complete profile →
                      </button>
                    </Link>
                  )}
                  {stat.label === "Career Score" && parseInt(stat.value) < 80 && (
                    <Link href="/career-score">
                      <button className="text-xs text-sa-gold mt-1 hover:text-sa-gold-dark font-medium">
                        Improve score →
                      </button>
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.trend === 'up' && (
                    <div className="flex items-center space-x-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-sa-green" />
                      <span className="text-xs text-sa-green">+{Math.floor(Math.random() * 10) + 1}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Progress Tracking Section */}
        {dashboardData.progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-sa-green/5 to-sa-gold/5 rounded-xl border border-sa-green/20 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-sa-gold" />
                <span>Your Progress This Week</span>
              </h3>
              <div className="flex items-center space-x-4">
                {dashboardData.progress.streak_days > 0 && (
                  <div className="flex items-center space-x-1 bg-sa-gold/10 px-3 py-1 rounded-full">
                    <Flame className="w-4 h-4 text-sa-gold" />
                    <span className="text-sm font-medium text-sa-gold-dark">
                      {dashboardData.progress.streak_days} day streak
                    </span>
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  {dashboardData.progress.sessions_this_week}/3 sessions
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-4 h-4 text-sa-gold" />
                  <span className="text-sm font-medium text-slate-700">Best Score</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{dashboardData.progress.best_score}%</div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-sa-green" />
                  <span className="text-sm font-medium text-slate-700">Practice Time</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{dashboardData.progress.total_practice_time}min</div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-sa-green-dark" />
                  <span className="text-sm font-medium text-slate-700">Avg Score</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{Math.round(dashboardData.progress.average_score)}%</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations Section */}
        {recommendations && recommendations.recommended.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 p-6 mb-8"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-sa-green" />
              <span>Recommended for You</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.recommended.slice(0, 2).map((rec: string, index: number) => (
                <div key={rec} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 capitalize">
                        {rec.replace('-', ' ')} Practice
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {recommendations.reasons[index]}
                      </p>
                    </div>
                    <Link href={`/interview-practice?type=${rec}`}>
                      <button className="flex items-center space-x-1 px-3 py-2 bg-sa-green text-white rounded-lg hover:bg-sa-green-dark transition-colors text-sm">
                        <span>Start</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"
                       style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                  <div className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-lg transition-all duration-300">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{action.title}</h3>
                    <p className="text-slate-600 text-sm">{action.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enhanced Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-sa-green" />
                <span>Recent Activity</span>
              </h2>
              <span className="text-sm text-slate-500">{dashboardData.recentActivity.length} recent items</span>
            </div>
            
            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.color === 'blue' ? 'bg-sa-green/10' :
                      activity.color === 'green' ? 'bg-sa-green/10' :
                      activity.color === 'purple' ? 'bg-sa-gold/10' :
                      activity.color === 'orange' ? 'bg-sa-gold/10' : 'bg-slate-100'
                    }`}>
                      <activity.icon className={`w-5 h-5 ${
                        activity.color === 'blue' ? 'text-sa-green' :
                        activity.color === 'green' ? 'text-sa-green' :
                        activity.color === 'purple' ? 'text-sa-gold' :
                        activity.color === 'orange' ? 'text-sa-gold' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <span className="text-sm text-slate-500">{formatTimeAgo(activity.time)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                      {activity.details && (
                        <p className="text-xs text-slate-500 mt-1">{activity.details}</p>
                      )}
                      {activity.score && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.score >= 80 ? 'bg-sa-green' :
                            activity.score >= 70 ? 'bg-sa-green-light' : 'bg-sa-gold'
                          }`} />
                          <span className="text-xs font-medium text-slate-600">
                            {activity.score >= 80 ? 'Excellent performance' :
                             activity.score >= 70 ? 'Good performance' : 'Room for improvement'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No recent activity</h3>
                  <p className="text-slate-600">Start by completing your profile or generating a CV!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Career Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-sa-gold" />
                <span>Career Progress</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Overall Readiness</span>
                    <span className="font-semibold text-slate-900">{dashboardData.stats.careerScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-sa-gold h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardData.stats.careerScore}%` }}
                    />
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    {dashboardData.stats.careerScore > 75 ? (
                      <TrendingUp className="w-3 h-3 text-sa-green" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-sa-gold" />
                    )}
                    <span className="text-xs text-slate-500">
                      {dashboardData.stats.careerScore > 75 ? 'Strong readiness' : 'Needs improvement'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Profile Complete</span>
                    <span className="font-semibold text-slate-900">{dashboardData.stats.profileCompletion.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-sa-green h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardData.stats.profileCompletion.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-sa-gold" />
                <span>Your Profile</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Work Experience</span>
                  <span className="font-semibold text-slate-900">{dashboardData.experiences.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Skills Listed</span>
                  <span className="font-semibold text-slate-900">{dashboardData.skills.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">CVs Created</span>
                  <span className="font-semibold text-slate-900">{dashboardData.cvs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Interview Practice</span>
                  <span className="font-semibold text-slate-900">{dashboardData.interviewSessions.length}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-sa-green/5 to-sa-gold/5 rounded-xl border border-sa-green/20 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5 text-sa-green" />
                <span>Next Steps</span>
              </h3>
              <div className="space-y-3">
                {dashboardData.stats.profileCompletion.percentage < 100 && (
                  <Link href="/onboarding">
                    <div className="flex items-center space-x-2 p-2 hover:bg-white/50 rounded-lg transition-colors cursor-pointer">
                      <CheckCircle className="w-4 h-4 text-sa-green" />
                      <span className="text-sm text-slate-700">Complete your profile</span>
                    </div>
                  </Link>
                )}
                {dashboardData.cvs.length === 0 && (
                  <Link href="/cv-builder">
                    <div className="flex items-center space-x-2 p-2 hover:bg-white/50 rounded-lg transition-colors cursor-pointer">
                      <CheckCircle className="w-4 h-4 text-sa-green" />
                      <span className="text-sm text-slate-700">Generate your first CV</span>
                    </div>
                  </Link>
                )}
                {dashboardData.interviewSessions.length < 3 && (
                  <Link href="/interview-practice">
                    <div className="flex items-center space-x-2 p-2 hover:bg-white/50 rounded-lg transition-colors cursor-pointer">
                      <CheckCircle className="w-4 h-4 text-sa-green" />
                      <span className="text-sm text-slate-700">Practice more interviews</span>
                    </div>
                  </Link>
                )}
                <Link href="/job-search">
                  <div className="flex items-center space-x-2 p-2 hover:bg-white/50 rounded-lg transition-colors cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-sa-green" />
                    <span className="text-sm text-slate-700">Search and save jobs</span>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;