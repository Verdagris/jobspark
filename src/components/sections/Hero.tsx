"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Briefcase,
  Star,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";

// --- Custom Spotlight Button (Enhanced) ---
const SpotlightButton = ({ children, href }: { children: React.ReactNode; href?: string }) => {
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePos({ x: clientX - left, y: clientY - top });
  };

  const ButtonContent = (
    <motion.button
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: -999, y: -999 })}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-slate-900 to-slate-800 transition-all duration-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl"
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.25), transparent 80%)`,
          opacity: mousePos.x === -999 ? 0 : 1,
        }}
      />
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
    </motion.button>
  );

  return href ? <Link href={href}>{ButtonContent}</Link> : ButtonContent;
};

// --- Enhanced "Flip" Button Component ---
const FlipButton = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={href}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 font-semibold text-slate-800 bg-white/90 backdrop-blur-sm border-2 border-slate-200 hover:border-sky-300 transition-all duration-300 rounded-xl overflow-hidden shadow-md hover:shadow-lg"
      style={{ perspective: "500px" }}
    >
      <AnimatePresence mode="wait">
        {!isHovered ? (
          <motion.span
            key="text"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-base sm:text-lg"
          >
            {children}
          </motion.span>
        ) : (
          <motion.span
            key="icon"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center gap-2 text-sky-500 text-base sm:text-lg"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Learn More</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.a>
  );
};

// --- Simplified Animation Scenes ---
const animationScenes = [
  {
    key: "cv",
    icon: FileText,
    title: "AI CV Generation",
    subtitle: "Creating your perfect resume...",
    content: (
      <div className="space-y-3 w-full">
        <motion.div 
          className="h-3 w-full bg-gradient-to-r from-sky-200 to-sky-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-4/5 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "80%" }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-full bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-3/4 bg-gradient-to-r from-purple-200 to-purple-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
        />
      </div>
    ),
  },
  {
    key: "interview",
    icon: MessageSquare,
    title: "AI Interview Coach",
    subtitle: "Practicing with real-time feedback...",
    content: (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg border border-indigo-200"
        >
          <p className="text-sm font-medium text-indigo-700 mb-2">
            "Tell me about a challenging project you worked on."
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Listening...</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-green-50 p-3 rounded-lg border border-green-200"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Great structure! Score: 85%</span>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    key: "match",
    icon: Briefcase,
    title: "Smart Job Matching",
    subtitle: "Connecting you with opportunities...",
    content: (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Company {i}</p>
                <p className="text-xs text-slate-600">Software Engineer</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-green-600">{95 - i * 3}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
];

export const Hero = () => {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSceneIndex((prevIndex) => (prevIndex + 1) % animationScenes.length);
    }, 4000); // Slightly faster transitions
    return () => clearInterval(interval);
  }, []);

  const CurrentScene = animationScenes[sceneIndex];
  const CurrentIcon = CurrentScene.icon;

  return (
    <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* --- Simplified Background --- */}
      <div className="absolute inset-0 z-0">
        {/* The Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:36px_36px] opacity-20 sm:opacity-30" />
        {/* Simplified Aurora */}
        <div className="absolute inset-0 opacity-30 sm:opacity-40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#bae6fd_0%,_transparent_40%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#c7d2fe_0%,_transparent_45%)]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center lg:text-left order-2 lg:order-1"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm mb-4 sm:mb-6 border border-sky-200 shadow-sm"
          >
            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-400 fill-current" />
            <span className="hidden sm:inline">Voted #1 Platform for Career Growth</span>
            <span className="sm:hidden">#1 Career Platform</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tighter text-slate-900 mb-4 sm:mb-6 leading-tight"
          >
            Your Intelligent <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Career Co-Pilot
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Accelerate your job search with intelligent tools for CV building,
            interview practice, and direct connections to top employers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
          >
            <SpotlightButton href="/auth">
              <span className="flex items-center">
                Start Your Journey 
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </SpotlightButton>
            <FlipButton href="#how-it-works">How it Works</FlipButton>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span>AI-powered</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              <span>12,500+ users</span>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Simplified Animated Viewport --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto aspect-[4/3] order-1 lg:order-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 rounded-2xl sm:rounded-3xl opacity-20 sm:opacity-30 blur-xl sm:blur-2xl"></div>
          <div className="relative w-full h-full bg-white/70 sm:bg-white/60 backdrop-blur-xl border-2 border-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl sm:shadow-2xl shadow-slate-400/20 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={sceneIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-center space-y-3 sm:space-y-4"
              >
                <motion.div
                  className="p-2 sm:p-3 bg-white rounded-full shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CurrentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500" />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm sm:text-lg mb-1">
                    {CurrentScene.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                    {CurrentScene.subtitle}
                  </p>
                </div>
                <div className="w-full min-h-[120px] sm:min-h-[140px] flex items-center justify-center px-2">
                  {CurrentScene.content}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Scene indicators */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
              {animationScenes.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                    index === sceneIndex ? 'bg-sky-500 w-4 sm:w-6' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};