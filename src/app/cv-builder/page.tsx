"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Save,
  Copy,
  Briefcase,
  User,
  GraduationCap,
  Award,
  Zap,
  ArrowRight,
  Search,
  Building2,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  getUserProfile, 
  getUserExperiences, 
  getUserEducation, 
  getUserSkills, 
  getUserCVs, 
  createGeneratedCV,
  getUserSavedJobs,
  getSavedJobById
} from "@/lib/database";
import { generateCV, enhanceProfessionalSummary, generateExperienceDescription, suggestSkills } from "@/lib/api";
import { exportToPDF } from "@/lib/pdf-export";

const CVBuilderPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [cvs, setCVs] = useState<any[]>([]);
  const [selectedCV, setSelectedCV] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewCVForm, setShowNewCVForm] = useState(false);
  const [newCVData, setNewCVData] = useState({
    title: "",
    jobDescription: "",
    cvType: "professional",
    savedJobId: ""
  });
  
  // Saved jobs
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [selectedSavedJob, setSelectedSavedJob] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [profile, experiences, education, skills, userCVs, jobs] = await Promise.all([
          getUserProfile(user.id),
          getUserExperiences(user.id),
          getUserEducation(user.id),
          getUserSkills(user.id),
          getUserCVs(user.id),
          getUserSavedJobs(user.id)
        ]);
        
        setUserData({
          profile,
          experiences,
          education,
          skills
        });
        
        setCVs(userCVs);
        if (userCVs.length > 0) {
          setSelectedCV(userCVs[0]);
        }
        
        setSavedJobs(jobs);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleGenerateCV = async () => {
    if (!user || !userData) return;
    
    setIsGenerating(true);
    try {
      let jobDescription = newCVData.jobDescription;
      let jobTitle = newCVData.title;
      
      // If a saved job is selected, use its data
      if (newCVData.savedJobId) {
        const job = await getSavedJobById(newCVData.savedJobId);
        if (job) {
          jobDescription = job.description || '';
          jobTitle = job.title;
          setSelectedSavedJob(job);
        }
      }
      
      const cvData = {
        personalInfo: {
          fullName: userData.profile?.full_name || '',
          email: userData.profile?.email || user.email || '',
          phone: userData.profile?.phone || '',
          location: userData.profile?.location || '',
          professionalSummary: userData.profile?.professional_summary || '',
          profileImageUrl: userData.profile?.profile_image_url || ''
        },
        experiences: userData.experiences.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          description: exp.description
        })),
        education: userData.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          graduationYear: edu.graduation_year,
          description: edu.description
        })),
        skills: userData.skills.map((skill: any) => ({
          name: skill.name,
          level: skill.level
        }))
      };
      
      // Generate CV content
      const cvContent = await generateCV({
        cvData,
        jobDescription: jobDescription,
        cvType: newCVData.cvType as any
      });
      
      // Save to database
      const newCV = await createGeneratedCV({
        user_id: user.id,
        title: jobTitle || 'Professional CV',
        content: cvContent,
        job_description: jobDescription || null,
        cv_name: `${userData.profile?.full_name || 'My'} CV - ${new Date().toLocaleDateString()}`,
        saved_job_id: newCVData.savedJobId || null
      });
      
      // Update state
      setCVs(prev => [newCV, ...prev]);
      setSelectedCV(newCV);
      setShowNewCVForm(false);
      
      // Reset form
      setNewCVData({
        title: "",
        jobDescription: "",
        cvType: "professional",
        savedJobId: ""
      });
      
    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Failed to generate CV. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCV = () => {
    if (!selectedCV || !userData) return;
    
    try {
      const cvData = {
        personalInfo: {
          fullName: userData.profile?.full_name || '',
          email: userData.profile?.email || user?.email || '',
          phone: userData.profile?.phone || '',
          location: userData.profile?.location || '',
          professionalSummary: userData.profile?.professional_summary || '',
          profileImageUrl: userData.profile?.profile_image_url || ''
        },
        experiences: userData.experiences.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          description: exp.description
        })),
        education: userData.education.map((edu: any) => ({
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          graduationYear: edu.graduation_year,
          description: edu.description
        })),
        skills: userData.skills.map((skill: any) => ({
          name: skill.name,
          level: skill.level
        }))
      };
      
      exportToPDF(cvData, selectedCV.title);
    } catch (error) {
      console.error('Error downloading CV:', error);
      alert('Failed to download CV. Please try again.');
    }
  };

  const handleSavedJobChange = async (jobId: string) => {
    setNewCVData(prev => ({ ...prev, savedJobId: jobId }));
    
    if (jobId) {
      try {
        const job = await getSavedJobById(jobId);
        if (job) {
          setSelectedSavedJob(job);
          setNewCVData(prev => ({
            ...prev,
            title: job.title,
            jobDescription: job.description || ''
          }));
        }
      } catch (error) {
        console.error('Error loading saved job:', error);
      }
    } else {
      setSelectedSavedJob(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600 mb-4">Please complete your profile first.</p>
          <Link href="/onboarding">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Complete Profile
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">CV Builder</h1>
                  <p className="text-sm text-slate-600">Create professional CVs with AI</p>
                </div>
              </div>
            </div>
            
            {selectedCV && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadCV}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-900">Your CVs</h2>
                <button
                  onClick={() => setShowNewCVForm(true)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* CV List */}
              <div className="space-y-3 mb-6">
                {cvs.length > 0 ? (
                  cvs.map((cv) => (
                    <div
                      key={cv.id}
                      onClick={() => setSelectedCV(cv)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCV?.id === cv.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className={`w-5 h-5 ${
                            selectedCV?.id === cv.id ? 'text-blue-500' : 'text-slate-400'
                          }`} />
                          <div>
                            <h3 className="font-medium text-slate-900 text-sm">{cv.title}</h3>
                            <p className="text-xs text-slate-500">
                              {new Date(cv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 text-sm">No CVs yet</p>
                  </div>
                )}
              </div>
              
              {/* Generate New CV Button */}
              <button
                onClick={() => setShowNewCVForm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New CV</span>
              </button>
              
              {/* Profile Summary */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Your Profile</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{userData.profile?.full_name || 'Name not set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{userData.experiences.length} experiences</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{userData.education.length} education</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{userData.skills.length} skills</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/onboarding">
                    <button className="w-full text-sm text-blue-500 hover:text-blue-700">
                      Update Profile →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* New CV Form */}
              {showNewCVForm ? (
                <motion.div
                  key="new-cv-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                      <Plus className="w-5 h-5 text-blue-500" />
                      <span>Generate New CV</span>
                    </h2>
                    <button
                      onClick={() => setShowNewCVForm(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
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
                            value={newCVData.savedJobId}
                            onChange={(e) => handleSavedJobChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                <button className="text-xs text-blue-600 hover:text-blue-800">
                                  View all saved jobs →
                                </button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Manual Job Details (if no saved job selected) */}
                    {!selectedSavedJob && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            CV Title / Job Position
                          </label>
                          <input
                            type="text"
                            value={newCVData.title}
                            onChange={(e) => setNewCVData({ ...newCVData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Software Engineer, Marketing Manager"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Job Description (Optional)
                          </label>
                          <textarea
                            value={newCVData.jobDescription}
                            onChange={(e) => setNewCVData({ ...newCVData, jobDescription: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={5}
                            placeholder="Paste the job description here to tailor your CV..."
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Adding a job description helps tailor your CV to specific requirements
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CV Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'professional', label: 'Professional' },
                          { id: 'creative', label: 'Creative' },
                          { id: 'technical', label: 'Technical' },
                          { id: 'executive', label: 'Executive' }
                        ].map((style) => (
                          <div
                            key={style.id}
                            onClick={() => setNewCVData({ ...newCVData, cvType: style.id })}
                            className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                              newCVData.cvType === style.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 hover:border-blue-300 text-slate-700'
                            }`}
                          >
                            {style.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setShowNewCVForm(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateCV}
                        disabled={isGenerating || (!newCVData.title && !newCVData.savedJobId)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Generate CV</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : selectedCV ? (
                <motion.div
                  key="cv-preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{selectedCV.title}</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleDownloadCV}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* CV Content */}
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: selectedCV.content
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} 
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-cv"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center py-16"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">No CV Selected</h2>
                  <p className="text-slate-600 mb-6">Generate your first CV or select one from the sidebar</p>
                  <button
                    onClick={() => setShowNewCVForm(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Generate New CV</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilderPage;