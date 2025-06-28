"use client";

import { useState, useEffect, useMemo } from "react";
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
  Edit,
  Trash2,
  Calendar,
  Link as LinkIcon,
  FileText,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, getUserExperiences, getUserSkills, getUserSavedJobs, createSavedJob, updateSavedJob, deleteSavedJob } from "@/lib/database";

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
const applyMainFilter = (jobs: any[], selectedFilter: string, savedJobs: Set<string>) => {
  return jobs.filter(job => {
    if (selectedFilter === "saved") return savedJobs.has(job.id);
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
  return jobs.filter(job => selectedJobTypes.has(job.job_type));
};

const applyLocationFilter = (jobs: any[], selectedLocation: string) => {
  if (!selectedLocation) return jobs;
  return jobs.filter(job => job.location.toLowerCase().includes(selectedLocation.toLowerCase()));
};

const applySalaryFilter = (jobs: any[], minSalary: number) => {
  if (minSalary === 0) return jobs;
  return jobs.filter(job => job.salary_min >= minSalary);
};

const applyStatusFilter = (jobs: any[], selectedStatus: string) => {
  if (!selectedStatus || selectedStatus === 'all') return jobs;
  return jobs.filter(job => job.status === selectedStatus);
};

const applySorting = (jobs: any[], sortOption: string) => {
  const sortedJobs = [...jobs];
  if (sortOption === "match") sortedJobs.sort((a, b) => b.match - a.match);
  else if (sortOption === "date") sortedJobs.sort((a, b) => new Date(b.created_at || b.created).getTime() - new Date(a.created_at || a.created).getTime());
  else if (sortOption === "salary") sortedJobs.sort((a, b) => (b.salary_min || 0) - (a.salary_min || 0));
  return sortedJobs;
};

const JobSearchPage = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobIds, setSavedJobIds] = useState(new Set<string>([]));
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobTypes, setSelectedJobTypes] = useState(new Set<string>());
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState("match");
  const [showFilters, setShowFilters] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userExperiences, setUserExperiences] = useState<any[]>([]);
  
  // Add job modal state
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'Full-time',
    description: '',
    requirements: [''],
    benefits: [''],
    application_url: '',
    deadline: '',
    notes: '',
    status: 'saved'
  });

  const JOB_TYPE_LABELS: { [key: string]: string } = {
    'Full-time': 'Full-time',
    'Part-time': 'Part-time',
    'Contract': 'Contract',
    'Temporary': 'Temporary',
    'Internship': 'Internship',
    'Remote': 'Remote'
  };

  const JOB_STATUS_LABELS: { [key: string]: string } = {
    'saved': 'Saved',
    'applied': 'Applied',
    'interviewing': 'Interviewing',
    'offered': 'Offered',
    'rejected': 'Rejected'
  };

  const SALARY_RANGES = [
    { label: "Any salary", value: 0 },
    { label: "R20,000+", value: 20000 },
    { label: "R30,000+", value: 30000 },
    { label: "R50,000+", value: 50000 },
    { label: "R80,000+", value: 80000 },
    { label: "R100,000+", value: 100000 },
  ];

  // Load user CV data for job matching
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
        setSavedJobIds(new Set(userSavedJobs.map(job => job.id)));
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
            id: "1",
            title: "Senior Software Engineer",
            company: "Takealot Group",
            location: "Cape Town, Western Cape",
            job_type: "Full-time",
            salary_min: 65000,
            salary_max: 95000,
            description: "Join our engineering team to build scalable e-commerce solutions. Work with React, Node.js, Python, and AWS. Experience with microservices and agile development required.",
            requirements: ["5+ years experience", "React/Node.js", "Python", "AWS", "Microservices"],
            benefits: ["Medical Aid", "Pension Fund", "Flexible Hours", "Remote Work"],
            logo: "https://ui-avatars.com/api/?name=Takealot&background=0ea5e9&color=fff&size=64",
            application_url: "https://takealot.com/careers",
            created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "2",
            title: "Product Manager",
            company: "Discovery Limited",
            location: "Johannesburg, Gauteng",
            job_type: "Full-time",
            salary_min: 75000,
            salary_max: 110000,
            description: "Lead product strategy for our digital health platform. Drive innovation in fintech and healthtech. Experience with agile methodologies and data-driven decision making essential.",
            requirements: ["3+ years PM experience", "Agile methodology", "Data analysis", "Fintech/Healthtech"],
            benefits: ["Medical Aid", "Life Insurance", "Bonus Scheme", "Learning Budget"],
            logo: "https://ui-avatars.com/api/?name=Discovery&background=22c55e&color=fff&size=64",
            application_url: "https://discovery.co.za/careers",
            created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "3",
            title: "UX/UI Designer",
            company: "Naspers",
            location: "Cape Town, Western Cape",
            job_type: "Full-time",
            salary_min: 45000,
            salary_max: 70000,
            description: "Create exceptional user experiences for our global digital products. Work with design systems, conduct user research, and collaborate with cross-functional teams.",
            requirements: ["Portfolio required", "Figma/Sketch", "User research", "Design systems"],
            benefits: ["Medical Aid", "Pension Fund", "Creative Environment", "International Exposure"],
            logo: "https://ui-avatars.com/api/?name=Naspers&background=8b5cf6&color=fff&size=64",
            application_url: "https://naspers.com/careers",
            created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "4",
            title: "Data Scientist",
            company: "Standard Bank",
            location: "Johannesburg, Gauteng",
            job_type: "Full-time",
            salary_min: 60000,
            salary_max: 90000,
            description: "Analyze complex financial datasets to drive business insights. Build predictive models and work with big data technologies. Strong Python and SQL skills required.",
            requirements: ["Python/R", "Machine Learning", "SQL", "Statistics", "Banking experience"],
            benefits: ["Medical Aid", "Pension Fund", "Performance Bonus", "Study Assistance"],
            logo: "https://ui-avatars.com/api/?name=Standard+Bank&background=dc2626&color=fff&size=64",
            application_url: "https://standardbank.co.za/careers",
            created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "5",
            title: "DevOps Engineer",
            company: "Capitec Bank",
            location: "Stellenbosch, Western Cape",
            job_type: "Full-time",
            salary_min: 55000,
            salary_max: 80000,
            description: "Manage cloud infrastructure and CI/CD pipelines. Work with Docker, Kubernetes, and Azure. Help scale our digital banking platform.",
            requirements: ["Docker/Kubernetes", "Azure/AWS", "CI/CD", "Linux", "Monitoring"],
            benefits: ["Medical Aid", "Pension Fund", "Flexible Hours", "Tech Allowance"],
            logo: "https://ui-avatars.com/api/?name=Capitec&background=f59e0b&color=fff&size=64",
            application_url: "https://capitecbank.co.za/careers",
            created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "6",
            title: "Frontend Developer",
            company: "Woolworths Holdings",
            location: "Cape Town, Western Cape",
            job_type: "Full-time",
            salary_min: 40000,
            salary_max: 65000,
            description: "Build responsive web applications for our retail platform. Work with React, TypeScript, and modern frontend tools. Focus on performance and user experience.",
            requirements: ["React/TypeScript", "CSS/SASS", "Responsive design", "Testing", "Git"],
            benefits: ["Medical Aid", "Staff Discount", "Pension Fund", "Wellness Programs"],
            logo: "https://ui-avatars.com/api/?name=Woolworths&background=10b981&color=fff&size=64",
            application_url: "https://woolworths.co.za/careers",
            created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "7",
            title: "Business Analyst",
            company: "Old Mutual",
            location: "Cape Town, Western Cape",
            job_type: "Full-time",
            salary_min: 50000,
            salary_max: 75000,
            description: "Analyze business processes and requirements for digital transformation projects. Work with stakeholders to define solutions and improve operational efficiency.",
            requirements: ["Business analysis", "Process mapping", "SQL", "Stakeholder management", "Insurance"],
            benefits: ["Medical Aid", "Pension Fund", "Life Insurance", "Professional Development"],
            logo: "https://ui-avatars.com/api/?name=Old+Mutual&background=6366f1&color=fff&size=64",
            application_url: "https://oldmutual.co.za/careers",
            created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          },
          {
            id: "8",
            title: "Mobile App Developer",
            company: "MTN Group",
            location: "Johannesburg, Gauteng",
            job_type: "Full-time",
            salary_min: 45000,
            salary_max: 70000,
            description: "Develop mobile applications for our telecommunications services. Work with React Native, Flutter, or native iOS/Android development.",
            requirements: ["React Native/Flutter", "iOS/Android", "API integration", "Mobile UI/UX", "Telecom"],
            benefits: ["Medical Aid", "Pension Fund", "Mobile Allowance", "Training Programs"],
            logo: "https://ui-avatars.com/api/?name=MTN&background=eab308&color=fff&size=64",
            application_url: "https://mtn.co.za/careers",
            created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            status: "saved"
          }
        ];

        // Calculate relevance scores based on user's CV
        const jobsWithRelevance = jobTemplates.map(job => ({
          ...job,
          posted: timeAgo(job.created),
          salary: `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()}`,
          match: calculateJobRelevance(job, userSkills, userExperiences)
        }));

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
  }, [userSkills, userExperiences]);

  const toggleSaveJob = async (job: any) => {
    try {
      if (savedJobIds.has(job.id)) {
        // If job is already saved, delete it
        await deleteSavedJob(job.id);
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(job.id);
          return newSet;
        });
        
        // Remove from saved jobs list
        setSavedJobs(prev => prev.filter(j => j.id !== job.id));
      } else {
        // If job is not saved, save it
        const newSavedJob = {
          user_id: user!.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.job_type,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          application_url: job.application_url,
          source: 'search',
          status: 'saved',
          notes: '',
          deadline: null
        };
        
        const savedJob = await createSavedJob(newSavedJob);
        
        // Update saved jobs
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.add(savedJob.id);
          return newSet;
        });
        
        setSavedJobs(prev => [...prev, savedJob]);
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
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
    setSelectedStatus("all");
  };

  const handleApplyNow = (job: any) => {
    // Open the company's career page in a new tab
    window.open(job.application_url, '_blank');
  };

  const handleLearnMore = (job: any) => {
    // For now, just scroll to the job details or show more info
    alert(`Learn more about ${job.title} at ${job.company}\n\nThis would typically show more detailed job information, company culture, interview process, etc.`);
  };

  const handleAddJob = async () => {
    try {
      if (editingJob) {
        // Update existing job
        await updateSavedJob(editingJob.id, {
          ...newJob,
          salary_min: newJob.salary_min ? parseInt(newJob.salary_min as string) : null,
          salary_max: newJob.salary_max ? parseInt(newJob.salary_max as string) : null,
          user_id: user!.id
        });
        
        // Refresh saved jobs
        const updatedJobs = await getUserSavedJobs(user!.id);
        setSavedJobs(updatedJobs);
      } else {
        // Create new job
        const savedJob = await createSavedJob({
          ...newJob,
          salary_min: newJob.salary_min ? parseInt(newJob.salary_min as string) : null,
          salary_max: newJob.salary_max ? parseInt(newJob.salary_max as string) : null,
          source: 'manual',
          user_id: user!.id
        });
        
        // Update saved jobs
        setSavedJobs(prev => [...prev, savedJob]);
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.add(savedJob.id);
          return newSet;
        });
      }
      
      // Reset form and close modal
      setNewJob({
        title: '',
        company: '',
        location: '',
        salary_min: '',
        salary_max: '',
        job_type: 'Full-time',
        description: '',
        requirements: [''],
        benefits: [''],
        application_url: '',
        deadline: '',
        notes: '',
        status: 'saved'
      });
      setEditingJob(null);
      setShowAddJobModal(false);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setNewJob({
      title: job.title,
      company: job.company,
      location: job.location || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      job_type: job.job_type || 'Full-time',
      description: job.description || '',
      requirements: job.requirements?.length ? job.requirements : [''],
      benefits: job.benefits?.length ? job.benefits : [''],
      application_url: job.application_url || '',
      deadline: job.deadline || '',
      notes: job.notes || '',
      status: job.status || 'saved'
    });
    setShowAddJobModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteSavedJob(jobId);
        
        // Update saved jobs
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      await updateSavedJob(jobId, { status: newStatus });
      
      // Update saved jobs
      setSavedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const addRequirementField = () => {
    setNewJob(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setNewJob(prev => {
      const updatedRequirements = [...prev.requirements];
      updatedRequirements[index] = value;
      return {
        ...prev,
        requirements: updatedRequirements
      };
    });
  };

  const removeRequirement = (index: number) => {
    setNewJob(prev => {
      const updatedRequirements = [...prev.requirements];
      updatedRequirements.splice(index, 1);
      return {
        ...prev,
        requirements: updatedRequirements.length ? updatedRequirements : ['']
      };
    });
  };

  const addBenefitField = () => {
    setNewJob(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setNewJob(prev => {
      const updatedBenefits = [...prev.benefits];
      updatedBenefits[index] = value;
      return {
        ...prev,
        benefits: updatedBenefits
      };
    });
  };

  const removeBenefit = (index: number) => {
    setNewJob(prev => {
      const updatedBenefits = [...prev.benefits];
      updatedBenefits.splice(index, 1);
      return {
        ...prev,
        benefits: updatedBenefits.length ? updatedBenefits : ['']
      };
    });
  };

  // Combine API jobs and saved jobs for display
  const allJobs = useMemo(() => {
    const apiJobs = jobs.map(job => ({
      ...job,
      isSaved: savedJobIds.has(job.id)
    }));
    
    // Add saved jobs that aren't in the API results
    const savedJobsNotInApi = savedJobs.filter(savedJob => 
      !apiJobs.some(apiJob => apiJob.id === savedJob.id)
    ).map(job => ({
      ...job,
      posted: timeAgo(job.created_at),
      salary: job.salary_min && job.salary_max ? 
        `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()}` : 
        'Salary not specified',
      match: calculateJobRelevance(job, userSkills, userExperiences),
      isSaved: true,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0ea5e9&color=fff&size=64`
    }));
    
    return [...apiJobs, ...savedJobsNotInApi];
  }, [jobs, savedJobs, savedJobIds, userSkills, userExperiences]);

  const filteredJobs = useMemo(() => {
    let currentJobs = applyMainFilter(allJobs, selectedFilter, savedJobIds);
    currentJobs = applySearchFilter(currentJobs, searchTerm);
    currentJobs = applyJobTypeFilter(currentJobs, selectedJobTypes);
    currentJobs = applyLocationFilter(currentJobs, selectedLocation);
    currentJobs = applySalaryFilter(currentJobs, minSalary);
    currentJobs = applyStatusFilter(currentJobs, selectedStatus);
    currentJobs = applySorting(currentJobs, sortOption);
    return currentJobs;
  }, [allJobs, selectedFilter, searchTerm, savedJobIds, selectedJobTypes, selectedLocation, minSalary, selectedStatus, sortOption]);

  const filters = [
    { id: "all", label: "All Jobs", count: allJobs.length },
    { id: "recommended", label: "Recommended", count: allJobs.filter(j => j.match >= 85).length },
    { id: "recent", label: "Recent", count: allJobs.filter(j => j.posted?.includes("days ago") || j.posted?.includes("hours ago")).length },
    { id: "saved", label: "Saved", count: savedJobs.length }
  ];

  // Add Job Modal
  const AddJobModal = () => (
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
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>{editingJob ? 'Edit Job' : 'Add New Job'}</span>
            </h2>
            <button
              onClick={() => setShowAddJobModal(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title*</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company*</label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., Acme Inc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., Cape Town"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
                <select
                  value={newJob.job_type}
                  onChange={(e) => setNewJob({...newJob, job_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={newJob.status}
                  onChange={(e) => setNewJob({...newJob, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Salary (R)</label>
                <input
                  type="number"
                  value={newJob.salary_min}
                  onChange={(e) => setNewJob({...newJob, salary_min: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Salary (R)</label>
                <input
                  type="number"
                  value={newJob.salary_max}
                  onChange={(e) => setNewJob({...newJob, salary_max: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., 70000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                rows={4}
                placeholder="Describe the job responsibilities and requirements..."
              />
            </div>

            {/* Requirements */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Requirements</label>
                <button
                  type="button"
                  onClick={addRequirementField}
                  className="text-xs text-sky-600 hover:text-sky-800"
                >
                  + Add Requirement
                </button>
              </div>
              <div className="space-y-2">
                {newJob.requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder={`Requirement ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={newJob.requirements.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Benefits</label>
                <button
                  type="button"
                  onClick={addBenefitField}
                  className="text-xs text-sky-600 hover:text-sky-800"
                >
                  + Add Benefit
                </button>
              </div>
              <div className="space-y-2">
                {newJob.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder={`Benefit ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={newJob.benefits.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application URL</label>
                <input
                  type="url"
                  value={newJob.application_url}
                  onChange={(e) => setNewJob({...newJob, application_url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="https://example.com/apply"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={newJob.deadline}
                  onChange={(e) => setNewJob({...newJob, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={newJob.notes}
                onChange={(e) => setNewJob({...newJob, notes: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                rows={3}
                placeholder="Add any personal notes about this job..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddJobModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddJob}
                disabled={!newJob.title || !newJob.company}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingJob ? 'Update Job' : 'Add Job'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Job Search</h1>
                    <p className="text-sm text-slate-600">Find and save opportunities</p>
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
            <p className="text-slate-600">Searching for relevant job opportunities...</p>
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
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
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
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Job Search</h1>
                  <p className="text-sm text-slate-600">Find and save opportunities</p>
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
                onClick={() => {
                  setEditingJob(null);
                  setNewJob({
                    title: '',
                    company: '',
                    location: '',
                    salary_min: '',
                    salary_max: '',
                    job_type: 'Full-time',
                    description: '',
                    requirements: [''],
                    benefits: [''],
                    application_url: '',
                    deadline: '',
                    notes: '',
                    status: 'saved'
                  });
                  setShowAddJobModal(true);
                }}
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

              {/* Status Filter (for saved jobs) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Sorting Options */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort by</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer">
                  <input
                    type="radio"
                    checked={sortOption === "match"}
                    onChange={() => setSortOption("match")}
                    className="text-green-500"
                  />
                  <span className="text-sm">Best Match</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer">
                  <input
                    type="radio"
                    checked={sortOption === "date"}
                    onChange={() => setSortOption("date")}
                    className="text-green-500"
                  />
                  <span className="text-sm">Most Recent</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer">
                  <input
                    type="radio"
                    checked={sortOption === "salary"}
                    onChange={() => setSortOption("salary")}
                    className="text-green-500"
                  />
                  <span className="text-sm">Highest Salary</span>
                </label>
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
                  <span>Job Tools</span>
                </h3>
                <div className="space-y-3">
                  <Link href="/cv-builder">
                    <div className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-700">Generate CV</span>
                    </div>
                  </Link>
                  <Link href="/interview-practice">
                    <div className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-slate-700">Interview Practice</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      setEditingJob(null);
                      setNewJob({
                        title: '',
                        company: '',
                        location: '',
                        salary_min: '',
                        salary_max: '',
                        job_type: 'Full-time',
                        description: '',
                        requirements: [''],
                        benefits: [''],
                        application_url: '',
                        deadline: '',
                        notes: '',
                        status: 'saved'
                      });
                      setShowAddJobModal(true);
                    }}
                    className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer w-full text-left"
                  >
                    <Plus className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-700">Add Manual Job</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  <span>Job Status</span>
                </h3>
                <div className="space-y-2">
                  {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => {
                    const count = savedJobs.filter(job => job.status === value).length;
                    return (
                      <div key={value} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </div>
                    );
                  })}
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
                    {selectedFilter === "all" ? "All Jobs" : 
                     selectedFilter === "recommended" ? "Recommended for You" :
                     selectedFilter === "recent" ? "Recent Postings" : "Saved Jobs"}
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
                          {job.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.posted && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{job.posted}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {job.salary && (
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-slate-900">{job.salary}</span>
                            </div>
                          )}
                          <span className="text-slate-400">•</span>
                          <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                            {job.job_type}
                          </span>
                          {job.status && job.status !== 'saved' && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                job.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                                job.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                                job.status === 'offered' ? 'bg-green-100 text-green-700' :
                                job.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}
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
                      </div>
                      <button
                        onClick={() => toggleSaveJob(job)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {job.isSaved || savedJobIds.has(job.id) ? (
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
                      {job.requirements?.map((req: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  {job.benefits && job.benefits.length > 0 && (
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

                  {job.deadline && (
                    <div className="mb-4 flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-700">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {job.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-slate-700">{job.notes}</p>
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
                    </div>
                    <div className="flex space-x-3">
                      {job.source === 'manual' || job.isSaved ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditJob(job)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleLearnMore(job)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Learn More
                        </button>
                      )}
                      
                      {job.application_url ? (
                        <button 
                          onClick={() => handleApplyNow(job)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
                        >
                          <span>Apply Now</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="relative group">
                          <button 
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
                          >
                            <span>Update Status</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10">
                            {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                              <button
                                key={value}
                                onClick={() => handleUpdateJobStatus(job.id, value)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                  job.status === value ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-700'
                                } ${value === 'saved' ? 'rounded-t-lg' : ''} ${value === 'rejected' ? 'rounded-b-lg' : ''}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Add/Edit Job Modal */}
      <AnimatePresence>
        {showAddJobModal && <AddJobModal />}
      </AnimatePresence>
    </div>
  );
};

export default JobSearchPage;