"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Heart,
  ExternalLink,
  Filter,
  Search,
  Building2,
  Users,
  TrendingUp,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import Link from "next/link";

const timeAgo = (dateString: string)=>{
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

// Helper functions for filtering and sorting
const applyMainFilter = (jobs: any[], selectedFilter: string, savedJobs: Set<number>) => {
  return jobs.filter(job => {
    if (selectedFilter === "saved") return savedJobs.has(job.id);
    if (selectedFilter === "recommended") return job.match >= 90;
    if (selectedFilter === "recent") return job.posted.includes("days ago") || job.posted.includes("hours ago") || job.posted.includes("minutes ago") || job.posted.includes("seconds ago");
    return true;
  });
};

const applySearchFilter = (jobs: any[], searchTerm: string) => {
  if (!searchTerm) return jobs;
  return jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
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

const applySorting = (jobs: any[], sortOption: string) => {
  const sortedJobs = [...jobs]; // Create a shallow copy to avoid mutating the original array
  if (sortOption === "match") sortedJobs.sort((a, b) => b.match - a.match);
  else if (sortOption === "date") sortedJobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  else if (sortOption === "salary") sortedJobs.sort((a, b) => b.salary_min - a.salary_min);
  return sortedJobs;
};

const JobMatchesPage = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobs, setSavedJobs] = useState(new Set<number>()); // Initialize as empty set
  const [jobs, setJobs] = useState<any[]>([]); // State to store fetched jobs
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [selectedJobTypes, setSelectedJobTypes] = useState(new Set<string>());
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortOption, setSortOption] = useState("match"); // Default sort option

  const filters = [
    { id: "all", label: "All Jobs", count: 24 },
    { id: "recommended", label: "Recommended", count: 8 },
    { id: "recent", label: "Recent", count: 12 },
    { id: "saved", label: "Saved", count: 2 }
  ];

  const JOB_TYPE_LABELS: { [key: string]: string } = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    temporary: 'Temporary',
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const APP_ID = process.env.NEXT_PUBLIC_ADZUNA_APP_ID;
        const APP_KEY = process.env.NEXT_PUBLIC_ADZUNA_APP_KEY;
        const apiUrl = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=10`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Map Adzuna API response to the job structure
        const mappedJobs = data.results.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          type: job.contract_time === 'full_time' ? 'Full-time' : 'Part-time',
          salary: job.salary_min && job.salary_max ? `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()}` : 'Negotiable',
          //posted: job.created ? new Date(job.created).toLocaleDateString() : 'N/A', // You might want a more dynamic "X days ago"
          salary_min: job.salary_min || 0, // Add raw salary_min for sorting
          posted: job.created ? timeAgo(job.created) : 'N/A',
          created: job.created, // Add raw created date for sorting
          match: Math.floor(Math.random() * 100), // Adzuna doesn't provide a direct match score, so using random for now
          description: job.description,
          requirements: job.description.split('. ').slice(0, 3), // Simple split for requirements, adjust as needed
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company.display_name)}&background=random&color=fff&size=64`, // Placeholder logo
          url: job.redirect_url // Add the job URL for "Apply Now"
        }));
        setJobs(mappedJobs);
      } catch (err: any) {
        setError(err.message || "Failed to fetch jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []); // Empty dependency array means this effect runs once on mount

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
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

  const filteredJobs = useMemo(() => {
    let currentJobs = applyMainFilter(jobs, selectedFilter, savedJobs);
    currentJobs = applySearchFilter(currentJobs, searchTerm);
    currentJobs = applyJobTypeFilter(currentJobs, selectedJobTypes);
    currentJobs = applyLocationFilter(currentJobs, selectedLocation);
    currentJobs = applySorting(currentJobs, sortOption);
    return currentJobs;
  }, [jobs, selectedFilter, searchTerm, savedJobs, selectedJobTypes, selectedLocation, sortOption]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading job matches...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600 font-medium">Error: {error}</div>
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
                <Briefcase className="w-8 h-8 text-green-500" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Job Matches</h1>
                  <p className="text-sm text-slate-600">Find your perfect role</p>
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
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <h2 className="font-semibold text-slate-900 mb-4">Filter Jobs</h2>
              <nav className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedFilter === filter.id
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="text-sm bg-slate-100 px-2 py-1 rounded-full">
                      {filter.id === "saved" ? savedJobs.size : filter.count}
                    </span>
                  </button>
                ))}
              </nav>
              
                {/* Job Type Filter */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Job Type</h3>
                <div className="space-y-2">
                  {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.has(label)}
                        onChange={() => handleJobTypeChange(label)}
                        className="form-checkbox text-green-500 rounded"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Location</h3>
                <input
                  type="text"
                  placeholder="e.g., Cape Town"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Profile Views</span>
                    <span className="font-semibold text-slate-900">127</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Applications</span>
                    <span className="font-semibold text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Response Rate</span>
                    <span className="font-semibold text-green-600">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedFilter === "all" ? "All Job Matches" : 
                   selectedFilter === "recommended" ? "Recommended for You" :
                   selectedFilter === "recent" ? "Recent Postings" : "Saved Jobs"}
                </h2>
                <p className="text-slate-600">{filteredJobs.length} jobs found</p>
              </div>
              <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>Sort by Match</option>
                <option>Sort by Date</option>
                <option>Sort by Salary</option>
              </select>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job: any, index: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">{job.title}</h3>
                        <div className="flex items-center space-x-4 text-slate-600 text-sm">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold text-slate-900">{job.match}% match</span>
                        </div>
                        <div className="text-sm text-slate-600">{job.type}</div>
                      </div>
                      <button
                        onClick={() => toggleSaveJob(job.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {savedJobs.has(job.id) ? (
                          <BookmarkCheck className="w-5 h-5 text-green-500" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-1 mb-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-slate-900">{job.salary}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{job.description}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-slate-900 mb-2">Key Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req:any, idx:number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>50+ applicants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Growing company</span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                        Learn More
                      </button>
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        <span>Apply Now</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-600">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobMatchesPage;
