"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserProfile,
  getUserExperiences,
  getUserSkills,
  getUserCVs,
  getUserInterviewSessions,
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
  Send,
  Award,
  Clock,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Star,
  Activity,
} from "lucide-react";
import Link from "next/link";

const DashboardPage = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!loading && !user) {
        router.push("/auth");
        return;
      }

      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          if (!profile || !profile.onboarding_completed) {
            router.push("/onboarding");
            return;
          }

          // Load dashboard data
          await loadDashboardData();
        } catch (error) {
          console.error("Error checking profile:", error);
          // If profile doesn't exist, redirect to onboarding
          router.push("/onboarding");
          return;
        } finally {
          setProfileLoading(false);
        }
      }
    };

    checkOnboarding();
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [profile, experiences, skills, cvs, interviewSessions] =
        await Promise.all([
          getUserProfile(user.id),
          getUserExperiences(user.id),
          getUserSkills(user.id),
          getUserCVs(user.id),
          getUserInterviewSessions(user.id),
        ]);

      // Calculate profile completion
      const profileCompletion = calculateProfileCompletion(
        profile,
        experiences,
        skills
      );

      // Calculate career score
      const careerScore = calculateCareerScore(
        profile,
        experiences,
        skills,
        cvs,
        interviewSessions
      );

      // Get recent activity
      const recentActivity = getRecentActivity(
        experiences,
        cvs,
        interviewSessions
      );

      // Calculate stats
      const stats = {
        profileCompletion,
        applicationsSent: Math.floor(Math.random() * 20) + 5, // Simulated
        interviewInvites: Math.floor(Math.random() * 5) + 1, // Simulated
        careerScore,
      };

      setDashboardData({
        profile,
        experiences,
        skills,
        cvs,
        interviewSessions,
        stats,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const calculateProfileCompletion = (
    profile: any,
    experiences: any[],
    skills: any[]
  ) => {
    let completed = 0;
    let total = 8;

    if (profile?.full_name) completed++;
    if (profile?.email) completed++;
    if (profile?.phone) completed++;
    if (profile?.location) completed++;
    if (profile?.professional_summary) completed++;
    if (experiences.length > 0) completed++;
    if (skills.length >= 3) completed++;
    if (profile?.profile_image_url) completed++;

    return Math.round((completed / total) * 100);
  };

  const calculateCareerScore = (
    profile: any,
    experiences: any[],
    skills: any[],
    cvs: any[],
    sessions: any[]
  ) => {
    let score = 0;

    // Profile completeness (25%)
    const profileScore = calculateProfileCompletion(
      profile,
      experiences,
      skills
    );
    score += profileScore * 0.25;

    // CV quality (25%)
    let cvScore = 40;
    if (cvs.length > 0) cvScore += 30;
    if (experiences.length >= 2) cvScore += 20;
    if (skills.length >= 5) cvScore += 10;
    score += Math.min(100, cvScore) * 0.25;

    // Interview readiness (25%)
    let interviewScore = 30;
    if (sessions.length > 0) {
      const avgScore =
        sessions.reduce((sum: number, s: any) => sum + s.overall_score, 0) /
        sessions.length;
      interviewScore = avgScore;
    }
    score += interviewScore * 0.25;

    // Market alignment (25%)
    let marketScore = 60;
    if (skills.length >= 5) marketScore += 20;
    if (experiences.length >= 2) marketScore += 20;
    score += Math.min(100, marketScore) * 0.25;

    return Math.round(score);
  };

  const getRecentActivity = (
    experiences: any[],
    cvs: any[],
    sessions: any[]
  ) => {
    const activities: any = [];

    // Add recent experiences
    experiences.slice(0, 2).forEach((exp) => {
      activities.push({
        type: "experience",
        title: "Work Experience Added",
        description: `Added ${exp.title} at ${exp.company}`,
        time: new Date(exp.created_at),
        icon: Briefcase,
        color: "blue",
      });
    });

    // Add recent CVs
    cvs.slice(0, 2).forEach((cv) => {
      activities.push({
        type: "cv",
        title: "CV Generated",
        description: `Created "${cv.title || "Professional CV"}"`,
        time: new Date(cv.created_at),
        icon: FileText,
        color: "green",
      });
    });

    // Add recent interview sessions
    sessions.slice(0, 2).forEach((session) => {
      activities.push({
        type: "interview",
        title: "Interview Practice",
        description: `Practiced for ${session.role} role (${session.overall_score}% score)`,
        time: new Date(session.created_at),
        icon: MessageSquare,
        color: "purple",
      });
    });

    // Sort by time and return latest 4
    return activities
      .sort((a: any, b: any) => b.time.getTime() - a.time.getTime())
      .slice(0, 4);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
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
      color: "from-blue-500 to-cyan-500",
      href: "/cv-builder",
    },
    {
      icon: MessageSquare,
      title: "Interview Practice",
      description: "Practice with our AI coach",
      color: "from-purple-500 to-pink-500",
      href: "/interview-practice",
    },
    {
      icon: Briefcase,
      title: "Job Matches",
      description: "Find your perfect role",
      color: "from-green-500 to-emerald-500",
      href: "/job-matches",
    },
    {
      icon: Target,
      title: "Career Score",
      description: "Check your readiness",
      color: "from-orange-500 to-red-500",
      href: "/career-score",
    },
  ];

  const stats = [
    {
      label: "Profile Completion",
      value: `${dashboardData.stats.profileCompletion}%`,
      icon: User,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Applications Sent",
      value: dashboardData.stats.applicationsSent.toString(),
      icon: Send,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Interview Invites",
      value: dashboardData.stats.interviewInvites.toString(),
      icon: Calendar,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Career Score",
      value: dashboardData.stats.careerScore.toString(),
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-sky-500" />
              <span className="text-2xl font-bold text-slate-900">
                JobSpark
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <Bell className="w-5 h-5" />
                {dashboardData.recentActivity.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.user_metadata?.full_name?.charAt(0) ||
                      user.email?.charAt(0).toUpperCase()}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back,{" "}
                {user.user_metadata?.full_name?.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-slate-600">
                Ready to take the next step in your career journey?
              </p>
            </div>
            {dashboardData.stats.careerScore < 80 && (
              <div className="hidden md:block">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Boost your career score to{" "}
                      {dashboardData.stats.careerScore + 10}+
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
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
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  {stat.label === "Profile Completion" &&
                    stat.value !== "100%" && (
                      <p className="text-xs text-orange-600 mt-1">
                        Complete your profile
                      </p>
                    )}
                  {stat.label === "Career Score" &&
                    parseInt(stat.value) < 80 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Room for improvement
                      </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group cursor-pointer"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"
                    style={{
                      background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  />
                  <div className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-lg transition-all duration-300">
                    <div
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {action.description}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>Recent Activity</span>
              </h2>
              <span className="text-sm text-slate-500">
                {dashboardData.recentActivity.length} recent items
              </span>
            </div>

            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map(
                  (activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.color === "blue"
                            ? "bg-blue-100"
                            : activity.color === "green"
                            ? "bg-green-100"
                            : activity.color === "purple"
                            ? "bg-purple-100"
                            : "bg-slate-100"
                        }`}
                      >
                        <activity.icon
                          className={`w-5 h-5 ${
                            activity.color === "blue"
                              ? "text-blue-600"
                              : activity.color === "green"
                              ? "text-green-600"
                              : activity.color === "purple"
                              ? "text-purple-600"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-slate-600">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {formatTimeAgo(activity.time)}
                      </span>
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No recent activity
                  </h3>
                  <p className="text-slate-600">
                    Start by completing your profile or generating a CV!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Career Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <span>Career Progress</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Overall Readiness
                    </span>
                    <span className="font-semibold text-slate-900">
                      {dashboardData.stats.careerScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardData.stats.careerScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Profile Complete
                    </span>
                    <span className="font-semibold text-slate-900">
                      {dashboardData.stats.profileCompletion}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${dashboardData.stats.profileCompletion}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Your Profile</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Work Experience
                  </span>
                  <span className="font-semibold text-slate-900">
                    {dashboardData.experiences.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Skills Listed</span>
                  <span className="font-semibold text-slate-900">
                    {dashboardData.skills.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">CVs Created</span>
                  <span className="font-semibold text-slate-900">
                    {dashboardData.cvs.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    Interview Practice
                  </span>
                  <span className="font-semibold text-slate-900">
                    {dashboardData.interviewSessions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5 text-sky-500" />
                <span>Next Steps</span>
              </h3>
              <div className="space-y-3">
                {dashboardData.stats.profileCompletion < 100 && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-sky-500 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      Complete your profile
                    </span>
                  </div>
                )}
                {dashboardData.cvs.length === 0 && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-sky-500 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      Generate your first CV
                    </span>
                  </div>
                )}
                {dashboardData.interviewSessions.length < 3 && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-sky-500 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      Practice more interviews
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-sky-500 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Apply to relevant jobs
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
