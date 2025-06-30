"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  Star, 
  Heart,
  ExternalLink,
  Filter,
  Search,
  Building2,
  Users,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Target,
  Award,
  Zap,
  ChevronDown,
  X,
  Plus,
  Play,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, getUserExperiences, getUserSkills, getUserSavedJobs, createSavedJob, updateSavedJob, deleteSavedJob, markJobAsApplied } from "@/lib/database";

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// Helper function to calculate job relevance based on user's CV
const calculateJobRelevance = (job: any, userSkills: string[], userExperiences: any[]) => {
  let relevanceScore = 50; // Base score
  
  // Check skill matches
  const jobSkills = job.description.toLowerCase();
  const skillMatches = userSkills.filter(skill => 
    jobSkills.includes(skill.toLowerCase())
  );
  relevanceScore += skillMatches.length * 10;
  
  // Check experience matches
  const jobTitle = job.title.toLowerCase();
  const experienceMatches = userExperiences.filter(exp => 
    jobTitle.includes(exp.title.toLowerCase().split(' ')[0]) ||
    exp.title.toLowerCase().includes(jobTitle.split(' ')[0])
  );
  relevanceScore += experienceMatches.length * 15;
  
  // Check company type matches
  const userCompanies = userExperiences.map(exp => exp.company.toLowerCase());
  if (userCompanies.some(company => company.includes('tech') || company.includes('software'))) {
    if (jobTitle.includes('tech') || jobTitle.includes('software') || jobTitle.includes('developer')) {
      relevanceScore += 20;
    }
  }
  
  return Math.min(100, relevanceScore);
};

// Helper functions for filtering and sorting
const applyMainFilter = (jobs: any[], selectedFilter: string, savedJobs: any[]) => {
  const savedJobIds = new Set(savedJobs.map(job => job.id));
  
  return jobs.filter(job => {
    if (selectedFilter === "saved") return savedJobIds.has(job.id) || job.isSaved;
    if (selectedFilter === "applied") return savedJobs.find(sj => sj.id === job.id)?.is_applied || job.isApplied;
    if (selectedFilter === "recommended") return job.match >= 85;
    if (selectedFilter === "recent") return job.posted.includes("days ago") || job.posted.includes("hours ago") || job.posted.includes("minutes ago") || job.posted.includes("seconds ago");
    return true;
  });
};

const applySearchFilter = (jobs: any[], searchTerm: string) => {
  if (!searchTerm) return jobs;
  return jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

const applyJobTypeFilter = (jobs: any[], selectedJobTypes: Set<string>) => {
  if (selectedJobTypes.size === 0) return jobs;
  return jobs.filter(job => selectedJobTypes.has(job.type));
};

const applyLocationFilter = (jobs: any[], selectedLocation: string) => {
  if (!selectedLocation) return jobs;
  return jobs.filter(job => job.location.toLowerCase().includes(selectedLocation.toLowerCase()));
};

const applySalaryFilter = (jobs: any[], minSalary: number) => {
  if (minSalary === 0) return jobs;
  return jobs.filter(job => job.salary_min >= minSalary);
};

const applySorting = (jobs: any[], sortOption: string) => {
  const sortedJobs = [...jobs];
  if (sortOption === "match") sortedJobs.sort((a, b) => b.match - a.match);
  else if (sortOption === "date") sortedJobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  else if (sortOption === "salary") sortedJobs.sort((a, b) => b.salary_min - a.salary_min);
  return sortedJobs;
};

const JobSearchPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Get filter from URL params
  const urlFilter = searchParams?.get('filter') || 'all';
  
  const [selectedFilter, setSelectedFilter] = useState(urlFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobTypes, setSelectedJobTypes] = useState(new Set<string>());
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [sortOption, setSortOption] = useState("match");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userExperiences, setUserExperiences] = useState<any[]>([]);

  // Add Job Modal State
  const [newJobData, setNewJobData] = useState({
    title: '',
    company: '',
    location: '',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
    benefits: '',
    job_type: 'Full-time',
    url: ''
  });

  const JOB_TYPE_LABELS: { [key: string]: string } = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    temporary: 'Temporary',
  };

  const SALARY_RANGES = [
    { label: "Any salary", value: 0 },
    { label: "R20,000+", value: 20000 },
    { label: "R30,000+", value: 30000 },
    { label: "R50,000+", value: 50000 },
    { label: "R80,000+", value: 80000 },
    { label: "R100,000+", value: 100000 },
  ];

  // Update filter when URL changes
  useEffect(() => {
    const newFilter = searchParams?.get('filter') || 'all';
    setSelectedFilter(newFilter);
  }, [searchParams]);

  // Load user CV data and saved jobs
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const [experiences, skills, userSavedJobs] = await Promise.all([
          getUserExperiences(user.id),
          getUserSkills(user.id),
          getUserSavedJobs(user.id)
        ]);
        
        setUserExperiences(experiences);
        setUserSkills(skills.map(skill => skill.name));
        setSavedJobs(userSavedJobs);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  // Generate South African relevant jobs based on user's CV
  useEffect(() => {
    const generateRelevantJobs = () => {
      setLoading(true);
      setError(null);
      
      try {
        // Generate jobs based on user's experience and skills
        const jobTemplates = [
          {
            id: 1,
            title: "Senior Software Engineer",
            company: "Takealot Group",
            location: "Cape Town, Western Cape",
            type: "Full-time",
            salary_min: 65000,
            salary_max: 95000,
            description: "Join our engineering team to build scalable e-commerce solutions. Work with React, Node.js, Python, and AWS. Experience with microservices and agile development required.",
            requirements: ["5+ years experience", "React/Node.js", "Python", "AWS", "Microservices"],
            logo: "https://ui-avatars.com/api/?name=Takealot&background=0ea5e9&color=fff&size=64",
            url: "https://takealot.com/careers",
            created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Flexible Hours", "Remote Work"]
          },
          {
            id: 2,
            title: "Product Manager",
            company: "Discovery Limited",
            location: "Johannesburg, Gauteng",
            type: "Full-time",
            salary_min: 75000,
            salary_max: 110000,
            description: "Lead product strategy for our digital health platform. Drive innovation in fintech and healthtech. Experience with agile methodologies and data-driven decision making essential.",
            requirements: ["3+ years PM experience", "Agile methodology", "Data analysis", "Fintech/Healthtech"],
            logo: "https://ui-avatars.com/api/?name=Discovery&background=22c55e&color=fff&size=64",
            url: "https://discovery.co.za/careers",
            created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Life Insurance", "Bonus Scheme", "Learning Budget"]
          },
          {
            id: 3,
            title: "UX/UI Designer",
            company: "Naspers",
            location: "Cape Town, Western Cape",
            type: "Full-time",
            salary_min: 45000,
            salary_max: 70000,
            description: "Create exceptional user experiences for our global digital products. Work with design systems, conduct user research, and collaborate with cross-functional teams.",
            requirements: ["Portfolio required", "Figma/Sketch", "User research", "Design systems"],
            logo: "https://ui-avatars.com/api/?name=Naspers&background=8b5cf6&color=fff&size=64",
            url: "https://naspers.com/careers",
            created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Creative Environment", "International Exposure"]
          },
          {
            id: 4,
            title: "Data Scientist",
            company: "Standard Bank",
            location: "Johannesburg, Gauteng",
            type: "Full-time",
            salary_min: 60000,
            salary_max: 90000,
            description: "Analyze complex financial datasets to drive business insights. Build predictive models and work with big data technologies. Strong Python and SQL skills required.",
            requirements: ["Python/R", "Machine Learning", "SQL", "Statistics", "Banking experience"],
            logo: "https://ui-avatars.com/api/?name=Standard+Bank&background=dc2626&color=fff&size=64",
            url: "https://standardbank.co.za/careers",
            created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Performance Bonus", "Study Assistance"]
          },
          {
            id: 5,
            title: "DevOps Engineer",
            company: "Capitec Bank",
            location: "Stellenbosch, Western Cape",
            type: "Full-time",
            salary_min: 55000,
            salary_max: 80000,
            description: "Manage cloud infrastructure and CI/CD pipelines. Work with Docker, Kubernetes, and Azure. Help scale our digital banking platform.",
            requirements: ["Docker/Kubernetes", "Azure/AWS", "CI/CD", "Linux", "Monitoring"],
            logo: "https://ui-avatars.com/api/?name=Capitec&background=f59e0b&color=fff&size=64",
            url: "https://capitecbank.co.za/careers",
            created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Flexible Hours", "Tech Allowance"]
          },
          {
            id: 6,
            title: "Frontend Developer",
            company: "Woolworths Holdings",
            location: "Cape Town, Western Cape",
            type: "Full-time",
            salary_min: 40000,
            salary_max: 65000,
            description: "Build responsive web applications for our retail platform. Work with React, TypeScript, and modern frontend tools. Focus on performance and user experience.",
            requirements: ["React/TypeScript", "CSS/SASS", "Responsive design", "Testing", "Git"],
            logo: "https://ui-avatars.com/api/?name=Woolworths&background=10b981&color=fff&size=64",
            url: "https://woolworths.co.za/careers",
            created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Staff Discount", "Pension Fund", "Wellness Programs"]
          },
          {
            id: 7,
            title: "Business Analyst",
            company: "Old Mutual",
            location: "Cape Town, Western Cape",
            type: "Full-time",
            salary_min: 50000,
            salary_max: 75000,
            description: "Analyze business processes and requirements for digital transformation projects. Work with stakeholders to define solutions and improve operational efficiency.",
            requirements: ["Business analysis", "Process mapping", "SQL", "Stakeholder management", "Insurance"],
            logo: "https://ui-avatars.com/api/?name=Old+Mutual&background=6366f1&color=fff&size=64",
            url: "https://oldmutual.co.za/careers",
            created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Life Insurance", "Professional Development"]
          },
          {
            id: 8,
            title: "Mobile App Developer",
            company: "MTN Group",
            location: "Johannesburg, Gauteng",
            type: "Full-time",
            salary_min: 45000,
            salary_max: 70000,
            description: "Develop mobile applications for our telecommunications services. Work with React Native, Flutter, or native iOS/Android development.",
            requirements: ["React Native/Flutter", "iOS/Android", "API integration", "Mobile UI/UX", "Telecom"],
            logo: "https://ui-avatars.com/api/?name=MTN&background=eab308&color=fff&size=64",
            url: "https://mtn.co.za/careers",
            created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            benefits: ["Medical Aid", "Pension Fund", "Mobile Allowance", "Training Programs"]
          }
        ];

        // Calculate relevance scores based on user's CV
        const jobsWithRelevance = jobTemplates.map(job => {
          const savedJob = savedJobs.find(sj => sj.title === job.title && sj.company === job.company);
          return {
            ...job,
            posted: timeAgo(job.created),
            salary: `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()}`,
            match: calculateJobRelevance(job, userSkills, userExperiences),
            isSaved: !!savedJob,
            savedJobId: savedJob?.id,
            isApplied: savedJob?.is_applied || false,
            practiceCount: savedJob?.practice_count || 0
          };
        });

        // Sort by relevance initially
        jobsWithRelevance.sort((a, b) => b.match - a.match);
        
        setJobs(jobsWithRelevance);
      } catch (err: any) {
        setError(err.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to show loading state
    setTimeout(generateRelevantJobs, 1000);
  }, [userSkills, userExperiences, savedJobs]);

  const handleSaveJob = async (job: any) => {
    if (!user) return;
    
    try {
      if (job.isSaved) {
        // Unsave job
        await deleteSavedJob(job.savedJobId);
        setSavedJobs(prev => prev.filter(sj => sj.id !== job.savedJobId));
        setJobs(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, isSaved: false, savedJobId: null, isApplied: false, practiceCount: 0 }
            : j
        ));
      } else {
        // Save job
        const savedJob = await createSavedJob({
          user_id: user.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          job_type: job.type,
          url: job.url,
          logo: job.logo,
          is_applied: false,
          applied_at: null,
          source: 'platform'
        });
        
        setSavedJobs(prev => [...prev, savedJob]);
        setJobs(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, isSaved: true, savedJobId: savedJob.id, practiceCount: 0 }
            : j
        ));
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  const handlePracticeNow = (job: any) => {
    if (!job.isSaved) {
      alert('Please save this job first to practice for it.');
      return;
    }
    
    // Navigate to interview practice with job context
    if (typeof window !== 'undefined') {
      const practiceUrl = `/interview-practice?jobId=${job.savedJobId}&role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`;
      window.location.href = practiceUrl;
    }
  };

  const handleApplyNow = async (job: any) => {
    if (!job.isSaved) {
      const shouldSave = confirm('Would you like to save this job first so you can track your application and practice for it?');
      if (shouldSave) {
        await handleSaveJob(job);
        return;
      }
    }
    
    if (job.practiceCount === 0) {
      const shouldPractice = confirm("Are you sure? You haven't practiced for this role yet. We recommend practicing at least once before applying.");
      if (!shouldPractice) return;
    } else if (job.practiceCount < 3) {
      const shouldPractice = confirm(`You've only practiced ${job.practiceCount} time${job.practiceCount > 1 ? 's' : ''} for this role. Consider practicing more to improve your chances.`);
      if (!shouldPractice) return;
    }
    
    // Mark as applied if saved
    if (job.isSaved) {
      try {
        await markJobAsApplied(job.savedJobId);
        setSavedJobs(prev => prev.map(sj => 
          sj.id === job.savedJobId 
            ? { ...sj, is_applied: true, applied_at: new Date().toISOString() }
            : sj
        ));
        setJobs(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, isApplied: true }
            : j
        ));
      } catch (error) {
        console.error('Error marking job as applied:', error);
      }
    }
    
    // Open the company's career page in a new tab
    window.open(job.url, '_blank');
  };

  const handleJobTypeChange = (type: string) => {
    setSelectedJobTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedJobTypes(new Set());
    setSelectedLocation("");
    setMinSalary(0);
    setSearchTerm("");
  };

  const handleAddJob = async () => {
    if (!user || !newJobData.title || !newJobData.company) {
      alert('Please fill in at least the job title and company name.');
      return;
    }

    try {
      const savedJob = await createSavedJob({
        user_id: user.id,
        title: newJobData.title,
        company: newJobData.company,
        location: newJobData.location || null,
        salary_min: newJobData.salary_min ? parseInt(newJobData.salary_min) : null,
        salary_max: newJobData.salary_max ? parseInt(newJobData.salary_max) : null,
        description: newJobData.description || null,
        requirements: newJobData.requirements ? newJobData.requirements.split('\n').filter(r => r.trim()) : null,
        benefits: newJobData.benefits ? newJobData.benefits.split('\n').filter(b => b.trim()) : null,
        job_type: newJobData.job_type,
        url: newJobData.url || null,
        logo: null,
        is_applied: false,
        applied_at: null,
        source: 'manual'
      });

      setSavedJobs(prev => [...prev, savedJob]);
      
      // Reset form and close modal
      setNewJobData({
        title: '',
        company: '',
        location: '',
        salary_min: '',
        salary_max: '',
        description: '',
        requirements: '',
        benefits: '',
        job_type: 'Full-time',
        url: ''
      });
      setShowAddJobModal(false);
      
      // Switch to saved jobs filter to show the new job
      setSelectedFilter('saved');
      
      alert('Job saved successfully!');
    } catch (error) {
      console.error('Error adding job:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  const filteredJobs = useMemo(() => {
    let currentJobs = applyMainFilter(jobs, selectedFilter, savedJobs);
    currentJobs = applySearchFilter(currentJobs, searchTerm);
    currentJobs = applyJobTypeFilter(currentJobs, selectedJobTypes);
    currentJobs = applyLocationFilter(currentJobs, selectedLocation);
    currentJobs = applySalaryFilter(currentJobs, minSalary);
    currentJobs = applySorting(currentJobs, sortOption);
    return currentJobs;
  }, [jobs, selectedFilter, searchTerm, savedJobs, selectedJobTypes, selectedLocation, minSalary, sortOption]);

  const filters = [
    { id: "all", label: "All Jobs", count: jobs.length },
    { id: "recommended", label: "Recommended", count: jobs.filter(j => j.match >= 85).length },
    { id: "recent", label: "Recent", count: jobs.filter(j => j.posted.includes("days ago") || j.posted.includes("hours ago")).length },
    { id: "saved", label: "Saved", count: savedJobs.length },
    { id: "applied", label: "Applied", count: savedJobs.filter(j => j.is_applied).length }
  ];

  // Add Job Modal Component
  const AddJobModal = () => (
    <AnimatePresence>
      {showAddJobModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddJobModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  <span>Add Custom Job</span>
                </h2>
                <button
                  onClick={() => setShowAddJobModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={newJobData.title}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={newJobData.company}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Google"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newJobData.location}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Cape Town"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Min Salary (R)
                    </label>
                    <input
                      type="number"
                      value={newJobData.salary_min}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, salary_min: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Salary (R)
                    </label>
                    <input
                      type="number"
                      value={newJobData.salary_max}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, salary_max: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="80000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={newJobData.job_type}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, job_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Application URL
                    </label>
                    <input
                      type="url"
                      value={newJobData.url}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://company.com/careers"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={newJobData.description}
                    onChange={(e) => setNewJobData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Describe the role, responsibilities, and what you'll be doing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Requirements (one per line)
                  </label>
                  <textarea
                    value={newJobData.requirements}
                    onChange={(e) => setNewJobData(prev => ({ ...prev, requirements: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="5+ years experience&#10;React/Node.js&#10;Bachelor's degree"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Benefits (one per line)
                  </label>
                  <textarea
                    value={newJobData.benefits}
                    onChange={(e) => setNewJobData(prev => ({ ...prev, benefits: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Medical Aid&#10;Pension Fund&#10;Flexible Hours"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddJob}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Job</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
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
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Job Search</h1>
                    <p className="text-sm text-slate-600">Find and prepare for your dream job</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
              <Sparkles className="w-6 h-6 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Finding Your Perfect Matches</h2>
            <p className="text-slate-600">Analyzing your CV to find the most relevant opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header with JobSpark Branding */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
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
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Job Search</h1>
                  <p className="text-sm text-slate-600">Find and prepare for your dream job</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-white/80 transition-colors bg-white/60 backdrop-blur-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button 
                onClick={() => setShowAddJobModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Job</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 p-6 mb-8 shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Filter Jobs</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {/* Job Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
                <div className="space-y-2">
                  {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.has(label)}
                        onChange={() => handleJobTypeChange(label)}
                        className="form-checkbox text-green-500 rounded"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Cape Town"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Salary Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Salary</label>
                <select
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {SALARY_RANGES.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort by</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="match">Best Match</option>
                  <option value="date">Most Recent</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 p-6 sticky top-24 shadow-lg">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-500" />
                <span>Job Categories</span>
              </h2>
              <nav className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                      selectedFilter === filter.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium">{filter.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedFilter === filter.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  <span>Your Stats</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Saved Jobs</span>
                    <span className="font-semibold text-slate-900">{savedJobs.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Applications</span>
                    <span className="font-semibold text-slate-900">{savedJobs.filter(j => j.is_applied).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Practice Sessions</span>
                    <span className="font-semibold text-green-600">{savedJobs.reduce((sum, job) => sum + job.practice_count, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Match Score</span>
                    <span className="font-semibold text-orange-600">
                      {jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + job.match, 0) / jobs.length) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-green-500" />
                  <span>
                    {selectedFilter === "all" ? "All Job Matches" : 
                     selectedFilter === "recommended" ? "Recommended for You" :
                     selectedFilter === "recent" ? "Recent Postings" : 
                     selectedFilter === "saved" ? "Saved Jobs" : "Applied Jobs"}
                  </span>
                </h2>
                <p className="text-slate-600 mt-1">
                  {filteredJobs.length} jobs found • Sorted by {sortOption === 'match' ? 'relevance' : sortOption}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job: any, index: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="w-14 h-14 rounded-xl object-cover shadow-md"
                        />
                        {job.match >= 90 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                        {job.isApplied && (
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-slate-600 text-sm mb-3">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.posted}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-slate-900">{job.salary}</span>
                          </div>
                          <span className="text-slate-400">•</span>
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                            {job.type}
                          </span>
                          {job.isApplied && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                Applied
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            job.match >= 90 ? 'bg-green-500' : 
                            job.match >= 80 ? 'bg-orange-500' : 'bg-slate-400'
                          }`} />
                          <span className="text-sm font-bold text-slate-900">{job.match}% match</span>
                        </div>
                        <div className="w-16 bg-slate-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-1000 ${
                              job.match >= 90 ? 'bg-green-500' : 
                              job.match >= 80 ? 'bg-orange-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${job.match}%` }}
                          />
                        </div>
                        {job.isSaved && job.practiceCount > 0 && (
                          <div className="text-xs text-purple-600 mt-1 flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{job.practiceCount} practice{job.practiceCount > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSaveJob(job)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {job.isSaved ? (
                          <BookmarkCheck className="w-5 h-5 text-green-500" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="font-medium text-slate-900 mb-2">Key Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  {job.benefits && (
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-900 mb-2">Benefits:</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((benefit: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 50) + 20}+ applicants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Growing company</span>
                      </div>
                      {job.match >= 85 && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">Great match!</span>
                        </div>
                      )}
                      {job.isSaved && job.practiceCount === 0 && !job.isApplied && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Practice recommended</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleApplyNow(job)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                      >
                        Apply
                      </button>
                      <button 
                        onClick={() => handlePracticeNow(job)}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl"
                        disabled={!job.isSaved}
                      >
                        <Play className="w-4 h-4" />
                        <span>Practice Now</span>
                      </button>
                      <button 
                        onClick={() => handleSaveJob(job)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl ${
                          job.isSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        }`}
                      >
                        {job.isSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-600 mb-4">Try adjusting your filters or search terms.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJobModal />
    </div>
  );
};

export default JobSearchPage;