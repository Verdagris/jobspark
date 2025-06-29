"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Calendar,
  MapPin,
  Building2,
  Star,
  Camera,
  Upload,
  X,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  MessageSquare,
  Search,
  Copy,
  SkipForward
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import {
  createUserProfile,
  updateUserProfile,
  createUserExperience,
  createUserEducation,
  createUserSkill,
  getUserProfile
} from "@/lib/database";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  professionalSummary: string;
  profileImage: File | null;
  profileImageUrl: string;
}

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  description: string;
}

interface Skill {
  name: string;
  level: string;
}

interface FormData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
}

// Motivational quotes for South African job seekers
const motivationalQuotes = [
  {
    quote: "Ubuntu: I am because we are. Your success contributes to our collective growth.",
    author: "African Philosophy"
  },
  {
    quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "African Proverb"
  },
  {
    quote: "Every expert was once a beginner. Every professional was once an amateur.",
    author: "Robin Sharma"
  },
  {
    quote: "Your career is a marathon, not a sprint. Pace yourself and stay consistent.",
    author: "Career Wisdom"
  }
];

// South African job search stats
const jobSearchStats = [
  "85% of jobs are found through networking",
  "Companies spend 6 seconds reviewing a CV",
  "70% of jobs are never publicly advertised",
  "Interview preparation increases success by 40%"
];

const OnboardingPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentStat, setCurrentStat] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      professionalSummary: "",
      profileImage: null,
      profileImageUrl: ""
    },
    experiences: [
      {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: ""
      }
    ],
    education: [
      {
        degree: "",
        institution: "",
        location: "",
        graduationYear: "",
        description: ""
      }
    ],
    skills: [
      { name: "", level: "Intermediate" }
    ]
  });

  const steps = [
    { 
      id: "personal", 
      title: "Personal Information", 
      icon: User, 
      description: "Tell us about yourself",
      guidance: "This information helps employers understand who you are and how to contact you. A complete profile increases your visibility by 40%."
    },
    { 
      id: "experience", 
      title: "Work Experience", 
      icon: Briefcase, 
      description: "Your professional journey",
      guidance: "Showcase your career progression and achievements. Use action verbs and quantify your impact where possible."
    },
    { 
      id: "education", 
      title: "Education", 
      icon: GraduationCap, 
      description: "Your academic background",
      guidance: "Include your formal education and any relevant certifications. This helps establish your knowledge foundation."
    },
    { 
      id: "skills", 
      title: "Skills", 
      icon: Award, 
      description: "Your expertise and abilities",
      guidance: "List both technical and soft skills. Be honest about your proficiency levels - employers value authenticity."
    }
  ];

  // Rotate motivational content
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 8000);

    const statInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % jobSearchStats.length);
    }, 6000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(statInterval);
    };
  }, []);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          email: user.email,
          fullName: user.user_metadata?.full_name || ""
        }
      }));
    }
  }, [user]);

  const handleInputChange = (section: keyof FormData, field: string, value: any, index?: number) => {
    setFormData(prev => {
      if (section === "personalInfo") {
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            [field]: value
          }
        };
      } else if (index !== undefined) {
        const sectionData = prev[section] as any[];
        return {
          ...prev,
          [section]: sectionData.map((item: any, i: number) => 
            i === index ? { ...item, [field]: value } : item
          )
        };
      }
      return prev;
    });
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          profileImage: file,
          profileImageUrl: previewUrl
        }
      }));
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfileImage = () => {
    if (formData.personalInfo.profileImageUrl) {
      URL.revokeObjectURL(formData.personalInfo.profileImageUrl);
    }
    
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        profileImage: null,
        profileImageUrl: ""
      }
    }));
  };

  const addItem = (section: keyof FormData) => {
    setFormData(prev => {
      let newItem: any;
      
      if (section === "experiences") {
        newItem = { title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" };
      } else if (section === "education") {
        newItem = { degree: "", institution: "", location: "", graduationYear: "", description: "" };
      } else if (section === "skills") {
        newItem = { name: "", level: "Intermediate" };
      }
      
      if (newItem) {
        const sectionData = prev[section] as any[];
        return {
          ...prev,
          [section]: [...sectionData, newItem]
        };
      }
      
      return prev;
    });
  };

  const removeItem = (section: keyof FormData, index: number) => {
    setFormData(prev => {
      const sectionData = prev[section] as any[];
      return {
        ...prev,
        [section]: sectionData.filter((_: any, i: number) => i !== index)
      };
    });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0: // Personal Info - only name and email required
        return formData.personalInfo.fullName && formData.personalInfo.email;
      case 1: // Experience - at least one experience with title and company
        return formData.experiences.some(exp => exp.title && exp.company);
      case 2: // Education - at least one education entry
        return formData.education.some(edu => edu.degree && edu.institution);
      case 3: // Skills - at least one skill
        return formData.skills.some(skill => skill.name);
      default:
        return true;
    }
  };

  const canSkipStep = (step: number) => {
    // Allow skipping education and some experience fields
    return step === 2 || step === 1;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const skipStep = () => {
    if (canSkipStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    return formData.personalInfo.profileImageUrl;
  };

  const handleComplete = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }
    
    setIsLoading(true);
    try {
      let profileImageUrl = null;
      if (formData.personalInfo.profileImage) {
        profileImageUrl = await uploadImageToSupabase(formData.personalInfo.profileImage);
      }

      let profile = null;
      try {
        profile = await getUserProfile(user.id);
      } catch (error) {
        console.log('Profile does not exist, will create new one');
      }
      
      const profileData = {
        full_name: formData.personalInfo.fullName,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone || null,
        location: formData.personalInfo.location || null,
        professional_summary: formData.personalInfo.professionalSummary || null,
        profile_image_url: profileImageUrl,
        onboarding_completed: true
      };

      if (profile) {
        await updateUserProfile(user.id, profileData);
      } else {
        await createUserProfile({
          user_id: user.id,
          ...profileData
        });
      }

      // Save experiences
      for (const exp of formData.experiences) {
        if (exp.title && exp.company) {
          await createUserExperience({
            user_id: user.id,
            title: exp.title,
            company: exp.company,
            location: exp.location || null,
            start_date: exp.startDate,
            end_date: exp.isCurrent ? null : (exp.endDate || null),
            is_current: exp.isCurrent,
            description: exp.description || null
          });
        }
      }

      // Save education
      for (const edu of formData.education) {
        if (edu.degree && edu.institution) {
          await createUserEducation({
            user_id: user.id,
            degree: edu.degree,
            institution: edu.institution,
            location: edu.location || null,
            graduation_year: edu.graduationYear,
            description: edu.description || null
          });
        }
      }

      // Save skills
      for (const skill of formData.skills) {
        if (skill.name) {
          await createUserSkill({
            user_id: user.id,
            name: skill.name,
            level: skill.level
          });
        }
      }

      if (formData.personalInfo.profileImageUrl) {
        URL.revokeObjectURL(formData.personalInfo.profileImageUrl);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('There was an error completing your onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome Screen Component
  const WelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <Sparkles className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Welcome to JobSpark! 🇿🇦</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Let's build your professional profile and unlock opportunities in the South African job market
        </p>
      </div>

      {/* Dashboard Preview */}
      <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-600" />
          <span>What you'll get access to:</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-slate-900">AI CV Builder</p>
              <p className="text-sm text-slate-600">Professional CVs in minutes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
            <MessageSquare className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-slate-900">Interview Practice</p>
              <p className="text-sm text-slate-600">AI-powered coaching</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
            <Search className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-slate-900">Job Matching</p>
              <p className="text-sm text-slate-600">Find perfect opportunities</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-slate-900">Career Scoring</p>
              <p className="text-sm text-slate-600">Track your readiness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-lg italic text-slate-700 mb-2">
              "{motivationalQuotes[currentQuote].quote}"
            </p>
            <p className="text-sm font-medium text-green-600">
              — {motivationalQuotes[currentQuote].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => setShowWelcome(false)}
        className="flex items-center space-x-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors mx-auto text-lg font-semibold shadow-lg"
      >
        <span>Let's Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-8">
      {/* Guidance Section */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-800 mb-1">Why this matters</h4>
            <p className="text-sm text-green-700">{steps[currentStep].guidance}</p>
          </div>
        </div>
      </div>

      {/* Profile Image Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {formData.personalInfo.profileImageUrl ? (
            <div className="relative">
              <Image
                src={formData.personalInfo.profileImageUrl}
                alt="Profile preview"
                width={120}
                height={120}
                className="w-30 h-30 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                onClick={removeProfileImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          <label className="absolute -bottom-2 -right-2 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors cursor-pointer">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
              disabled={uploadingImage}
            />
          </label>
        </div>
        
        <div className="text-center">
          <h3 className="font-semibold text-gray-800">Profile Photo</h3>
          <p className="text-sm text-gray-600">Add a professional headshot (max 5MB)</p>
          {uploadingImage && (
            <p className="text-sm text-green-600">Processing image...</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 flex items-center space-x-1">
            <span>Full Name</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.personalInfo.fullName}
            onChange={(e) => handleInputChange("personalInfo", "fullName", e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 flex items-center space-x-1">
            <span>Email</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) => handleInputChange("personalInfo", "email", e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="your.email@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Phone</label>
          <input
            type="tel"
            value={formData.personalInfo.phone}
            onChange={(e) => handleInputChange("personalInfo", "phone", e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="+27 XX XXX XXXX"
          />
          <p className="text-xs text-slate-500">Optional - helps employers contact you</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={formData.personalInfo.location}
              onChange={(e) => handleInputChange("personalInfo", "location", e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="City, Province"
            />
          </div>
          <p className="text-xs text-slate-500">Optional - helps with location-based job matching</p>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Professional Summary</label>
        <textarea
          rows={4}
          value={formData.personalInfo.professionalSummary}
          onChange={(e) => handleInputChange("personalInfo", "professionalSummary", e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
          placeholder="Brief summary of your professional background and career objectives..."
        />
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-500">
            <p>This will help employers understand your career goals and experience.</p>
            <button className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 mt-1">
              <Copy className="w-3 h-3" />
              <span>Copy from LinkedIn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      {/* Guidance Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Pro tip</h4>
            <p className="text-sm text-yellow-700">{steps[currentStep].guidance}</p>
          </div>
        </div>
      </div>

      {formData.experiences.map((exp, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 rounded-xl p-6 bg-slate-50/50"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Experience #{index + 1}</h3>
            </div>
            {formData.experiences.length > 1 && (
              <button
                onClick={() => removeItem("experiences", index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>Job Title</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Software Developer"
                value={exp.title}
                onChange={(e) => handleInputChange("experiences", "title", e.target.value, index)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>Company Name</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={exp.company}
                  onChange={(e) => handleInputChange("experiences", "company", e.target.value, index)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location (optional)"
                value={exp.location}
                onChange={(e) => handleInputChange("experiences", "location", e.target.value, index)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="month"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={(e) => handleInputChange("experiences", "startDate", e.target.value, index)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            {!exp.isCurrent && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="month"
                  placeholder="End Date"
                  value={exp.endDate}
                  onChange={(e) => handleInputChange("experiences", "endDate", e.target.value, index)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={exp.isCurrent}
                onChange={(e) => handleInputChange("experiences", "isCurrent", e.target.checked, index)}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-slate-700">I currently work here</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Job Description</label>
            <textarea
              rows={3}
              placeholder="Describe your responsibilities and achievements..."
              value={exp.description}
              onChange={(e) => handleInputChange("experiences", "description", e.target.value, index)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-slate-500">Use bullet points and action verbs. Quantify your achievements where possible.</p>
          </div>
        </motion.div>
      ))}
      <button
        onClick={() => addItem("experiences")}
        className="flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-slate-600 hover:text-green-600 w-full justify-center"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Another Experience</span>
      </button>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      {/* Guidance Section */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-800 mb-1">Education matters</h4>
            <p className="text-sm text-green-700">{steps[currentStep].guidance}</p>
          </div>
        </div>
      </div>

      {formData.education.map((edu, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 rounded-xl p-6 bg-slate-50/50"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Education #{index + 1}</h3>
            </div>
            {formData.education.length > 1 && (
              <button
                onClick={() => removeItem("education", index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>Degree/Qualification</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Bachelor of Science"
                value={edu.degree}
                onChange={(e) => handleInputChange("education", "degree", e.target.value, index)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 flex items-center space-x-1">
                <span>Institution</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="University/College name"
                  value={edu.institution}
                  onChange={(e) => handleInputChange("education", "institution", e.target.value, index)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location (optional)"
                value={edu.location}
                onChange={(e) => handleInputChange("education", "location", e.target.value, index)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Graduation Year"
              value={edu.graduationYear}
              onChange={(e) => handleInputChange("education", "graduationYear", e.target.value, index)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Additional details (optional)..."
            value={edu.description}
            onChange={(e) => handleInputChange("education", "description", e.target.value, index)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
          />
        </motion.div>
      ))}
      <button
        onClick={() => addItem("education")}
        className="flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-slate-600 hover:text-green-600 w-full justify-center"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Another Education</span>
      </button>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      {/* Guidance Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Skills showcase</h4>
            <p className="text-sm text-yellow-700">{steps[currentStep].guidance}</p>
          </div>
        </div>
      </div>

      {/* Job Search Stat */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStat}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Did you know?</p>
              <p className="text-sm text-slate-600">{jobSearchStats[currentStat]}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {formData.skills.map((skill, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Skill #{index + 1}</h3>
              </div>
              {formData.skills.length > 1 && (
                <button
                  onClick={() => removeItem("skills", index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Skill name (e.g., Python, Project Management)"
                value={skill.name}
                onChange={(e) => handleInputChange("skills", "name", e.target.value, index)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <select
                value={skill.level}
                onChange={(e) => handleInputChange("skills", "level", e.target.value, index)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </motion.div>
        ))}
      </div>
      <button
        onClick={() => addItem("skills")}
        className="flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-slate-600 hover:text-green-600 w-full justify-center"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Another Skill</span>
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderExperience();
      case 2: return renderEducation();
      case 3: return renderSkills();
      default: return null;
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#16a34a_0%,_transparent_40%)] animate-pulse-slow" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#eab308_0%,_transparent_45%)] animate-pulse-slow animation-delay-2000" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <WelcomeScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#16a34a_0%,_transparent_40%)] animate-pulse-slow" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#eab308_0%,_transparent_45%)] animate-pulse-slow animation-delay-2000" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">JobSpark Profile Setup</h1>
          </div>
          <p className="text-lg text-slate-600">Let's build your professional profile step by step</p>
        </motion.div>

        {/* Enhanced Progress Bar with Larger Circles */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div 
                  key={step.id} 
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <IconComponent className="w-8 h-8" />
                    )}
                    {index <= currentStep && (
                      <div className="absolute inset-0 bg-green-600 rounded-full animate-ping opacity-20"></div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-1 mx-4 transition-all duration-500 ${
                      index < currentStep ? 'bg-green-600' : 'bg-slate-200'
                    }`} />
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-slate-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <p className="text-xs text-slate-500 mt-1">{steps[currentStep].description}</p>
          </div>
        </motion.div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl shadow-slate-400/20 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-8">
                {React.createElement(steps[currentStep].icon, { 
                  className: "w-7 h-7 text-green-600" 
                })}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep].title}</h2>
                  <p className="text-slate-600">{steps[currentStep].description}</p>
                </div>
              </div>
              
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Skip button for optional steps */}
              {canSkipStep(currentStep) && !validateStep(currentStep) && (
                <button
                  onClick={skipStep}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip for now</span>
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentStep ? 'bg-green-600 w-10' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep) || isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{currentStep === steps.length - 1 ? "Complete Setup" : "Next"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;