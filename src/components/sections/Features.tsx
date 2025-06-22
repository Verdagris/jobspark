"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { FileText, MessageSquare, Briefcase, Target, Mic, CheckCircle, Star, TrendingUp, Building2, Users, MapPin } from "lucide-react";
import React, { useState, useEffect } from "react";

// --- Enhanced Visual Components ---

const CVVisual = () => (
  <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-start bg-white shadow-lg rounded-xl sm:rounded-2xl">
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        className="flex items-center space-x-2 mb-4"
    >
      <FileText className="w-5 h-5 text-sky-500" />
      <p className="font-bold text-slate-800 text-sm sm:text-lg">AI Generating CV...</p>
    </motion.div>
    <motion.div
        className="w-full space-y-2 sm:space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
            visible: { transition: { staggerChildren: 0.3 } }
        }}
    >
        {[...Array(4)].map((_, i) => (
            <motion.div 
                key={i}
                className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-sky-200 to-indigo-200"
                variants={{
                    hidden: { opacity: 0, width: "0%" },
                    visible: { opacity: 1, width: i % 2 === 0 ? "100%" : "85%" }
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
        ))}
    </motion.div>
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5 }}
      className="mt-4 flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg"
    >
      <CheckCircle className="w-4 h-4 text-green-600" />
      <span className="text-xs sm:text-sm text-green-700 font-medium">CV Generated Successfully!</span>
    </motion.div>
  </div>
);

const InterviewVisual = () => (
  <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center bg-white shadow-lg rounded-xl sm:rounded-2xl">
    <motion.div 
      initial={{ scale: 0 }} 
      animate={{ scale: 1 }} 
      className="mb-4 p-3 sm:p-4 bg-indigo-100 rounded-full"
    >
      <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
      className="text-center space-y-3"
    >
      <p className="text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-2 rounded-lg">
        "Tell me about a time you showed leadership."
      </p>
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Listening...</span>
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-4 bg-green-50 px-3 py-2 rounded-lg"
    >
      <div className="flex items-center space-x-2">
        <Star className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="text-xs sm:text-sm text-green-700 font-medium">Score: 88%</span>
      </div>
    </motion.div>
  </div>
);

const ConnectionsVisual = () => (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center bg-white shadow-lg rounded-xl sm:rounded-2xl">
        <div className="flex items-center space-x-2 mb-6">
          <Briefcase className="w-5 h-5 text-green-600" />
          <p className="font-bold text-slate-800 text-sm sm:text-lg">Finding Perfect Matches...</p>
        </div>
        
        <div className="relative w-full max-w-[280px] space-y-3">
            {[
              { 
                name: "Takealot Group", 
                role: "Senior Software Engineer",
                location: "Cape Town",
                logo: "T", 
                bgColor: "bg-blue-500", 
                textColor: "text-white", 
                score: 95,
                salary: "R65k - R95k"
              },
              { 
                name: "Discovery Limited", 
                role: "Product Manager",
                location: "Johannesburg", 
                logo: "D", 
                bgColor: "bg-green-500", 
                textColor: "text-white", 
                score: 92,
                salary: "R75k - R110k"
              },
              { 
                name: "Standard Bank", 
                role: "Data Scientist",
                location: "Johannesburg",
                logo: "S", 
                bgColor: "bg-red-500", 
                textColor: "text-white", 
                score: 89,
                salary: "R60k - R90k"
              }
            ].map((company, i) => (
                <motion.div
                    key={i}
                    className="w-full bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.3, duration: 0.5 }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${company.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <span className={`font-bold text-sm ${company.textColor}`}>
                                    {company.logo}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-slate-800 text-sm truncate">{company.name}</h3>
                                <p className="text-xs text-slate-600 truncate">{company.role}</p>
                                <div className="flex items-center space-x-1 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs text-slate-500">{company.location}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-green-600 fill-current" />
                            <span className="text-xs font-bold text-green-600">{company.score}%</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">{company.salary}</span>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs bg-sky-500 text-white px-3 py-1 rounded-full hover:bg-sky-600 transition-colors"
                        >
                            Apply
                        </motion.button>
                    </div>
                </motion.div>
            ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-4 flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg"
        >
          <Users className="w-4 h-4 text-green-600" />
          <span className="text-xs sm:text-sm text-green-700 font-medium">3 Perfect Matches Found!</span>
        </motion.div>
    </div>
);

const ScoreVisual = () => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, latest => Math.round(latest));
    const circumference = 2 * Math.PI * 35; // Smaller radius for mobile

    useEffect(() => {
        const controls = animate(count, 88, { duration: 1.5, ease: "easeOut" });
        return controls.stop;
    }, [count]);

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center bg-white shadow-lg rounded-xl sm:rounded-2xl">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                <svg className="w-full h-full" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" className="stroke-amber-100" strokeWidth="8" fill="none" />
                    <motion.circle
                        cx="40" cy="40" r="35"
                        className="stroke-amber-400 -rotate-90 origin-center"
                        strokeWidth="8" fill="none"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - 0.88) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.span className="text-2xl sm:text-4xl font-extrabold text-amber-500">{rounded}</motion.span>
                      <span className="text-lg sm:text-xl font-bold text-amber-500">%</span>
                    </div>
                </div>
            </div>
            <p className="font-bold text-slate-800 text-sm sm:text-lg text-center">Career Readiness</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-2 flex items-center space-x-1 bg-amber-50 px-3 py-1 rounded-full"
            >
              <TrendingUp className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Excellent</span>
            </motion.div>
        </div>
    );
};

// --- Main Feature List ---
const features = [
  { 
    icon: FileText, 
    title: "AI-Powered CV Generation", 
    description: "Our AI crafts a professional CV tailored to your dream job in minutes.", 
    visual: <CVVisual/> 
  },
  { 
    icon: MessageSquare, 
    title: "Interview Coaching", 
    description: "Practice with our AI coach and get instant, actionable feedback.", 
    visual: <InterviewVisual/> 
  },
  { 
    icon: Briefcase, 
    title: "Direct Employer Connections", 
    description: "Get discovered by top companies actively hiring on our platform.", 
    visual: <ConnectionsVisual/> 
  },
  { 
    icon: Target, 
    title: "Career Readiness Score", 
    description: "Quantify your job-readiness and get insights to improve your profile.", 
    visual: <ScoreVisual/> 
  },
];

export const Features = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-slate-50 relative">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] sm:bg-[size:2.5rem_2.5rem] opacity-30 sm:opacity-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900 mb-3 sm:mb-4">
            A Smarter Way to Get Hired
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
            Our intelligent suite of tools gives you a competitive edge at every stage.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Mobile: Stack features vertically, Desktop: Side navigation */}
          <div className="lg:hidden space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-lg"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-sky-100 rounded-lg">
                    <feature.icon className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  {feature.visual}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Interactive side navigation */}
          <div className="hidden lg:flex flex-col gap-4"
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}>
            {features.map((feature, index) => (
              <div key={feature.title} 
                onMouseEnter={() => setActiveIndex(index)}
                className="relative p-6 rounded-2xl cursor-pointer transition-all duration-300">
                {activeIndex === index && (
                  <motion.div 
                    layoutId="active-feature-background"
                    className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg"
                    style={{ borderRadius: 16 }} 
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                  />
                )}
                <div className="relative z-10 flex items-start gap-4">
                  <motion.div 
                    className="p-3 rounded-lg transition-all duration-300"
                    animate={{
                        backgroundColor: activeIndex === index ? "#0ea5e91a" : "#f1f5f9",
                        color: activeIndex === index ? "#0ea5e9" : "#64748b"
                    }}>
                    <feature.icon className="w-6 h-6" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop: Visual display */}
          <div className="hidden lg:block relative w-full aspect-[4/3] backdrop-blur-sm rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                {features[activeIndex].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};