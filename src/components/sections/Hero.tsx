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
  Mic,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// --- Custom Spotlight Button (Unchanged, it's solid) ---
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
      className="relative w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-slate-900 transition-colors duration-300 rounded-lg overflow-hidden"
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

// --- NEW "Flip" Button Component ---
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
      className="relative flex items-center justify-center w-full sm:w-auto px-8 py-4 font-semibold text-slate-800 bg-white border-2 border-slate-200 transition-colors duration-300 rounded-lg overflow-hidden"
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
            className="flex items-center gap-2 text-sky-500"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Learn More</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.a>
  );
};

// --- Animation Scenes for the Laptop Screen ---
const animationScenes = [
  {
    key: "cv",
    icon: FileText,
    title: "AI CV Generation",
    content: (
      <div className="w-full space-y-2">
        <div className="text-xs text-slate-600 mb-3">Building your professional CV...</div>
        <motion.div 
          className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div 
          className="h-2 w-4/5 bg-slate-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div 
          className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, type: "spring" }}
          className="flex items-center justify-center mt-3 text-xs text-green-600 font-semibold"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          CV Generated Successfully!
        </motion.div>
      </div>
    ),
  },
  {
    key: "interview",
    icon: MessageSquare,
    title: "Interview Practice",
    content: (
      <div className="w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-3 p-2 bg-purple-100 rounded-full inline-block"
        >
          <Mic className="w-4 h-4 text-purple-600" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs font-medium text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 mb-3"
        >
          "Tell me about your leadership experience."
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center space-x-1 mb-2"
        >
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-xs text-slate-600"
        >
          AI analyzing your response...
        </motion.div>
      </div>
    ),
  },
  {
    key: "match",
    icon: Briefcase,
    title: "Job Matching",
    content: (
      <div className="w-full">
        <div className="text-xs text-slate-600 mb-3 text-center">Finding perfect matches...</div>
        <div className="space-y-2">
          {[
            { company: "Takealot", match: "95%", color: "green" },
            { company: "Discovery", match: "88%", color: "blue" },
            { company: "Naspers", match: "82%", color: "purple" }
          ].map((job, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3, type: "spring" }}
              className={`flex items-center justify-between p-2 bg-${job.color}-50 border border-${job.color}-200 rounded-lg`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className={`w-3 h-3 text-${job.color}-600`} />
                <span className="text-xs font-medium text-slate-700">{job.company}</span>
              </div>
              <span className={`text-xs font-bold text-${job.color}-600`}>{job.match}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="flex items-center justify-center mt-3 text-xs text-green-600 font-semibold"
        >
          <Star className="w-3 h-3 mr-1 fill-current" />
          3 Perfect Matches Found!
        </motion.div>
      </div>
    ),
  },
];

export const Hero = () => {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSceneIndex((prevIndex) => (prevIndex + 1) % animationScenes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const CurrentScene = animationScenes[sceneIndex];
  const CurrentIcon = CurrentScene.icon;

  return (
    <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* --- Enhanced Background --- */}
      <div className="absolute inset-0 z-0">
        {/* The Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />
        {/* The Aurora */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_#bae6fd_0%,_transparent_40%)] animate-pulse-slow" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#c7d2fe_0%,_transparent_45%)] animate-pulse-slow animation-delay-2000" />
          <div className="absolute bottom-0 left-1/4 w-full h-full bg-[radial-gradient(circle_at_bottom,_#e0e7ff_0%,_transparent_50%)] animate-pulse-slow animation-delay-4000" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.2 }}
          className="text-center lg:text-left"
        >
          <motion.div className="inline-flex items-center bg-sky-100 text-sky-800 font-semibold px-4 py-1.5 rounded-full text-sm mb-4 border border-sky-200 shadow-sm">
            <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
            Voted #1 Platform for Career Growth
          </motion.div>

          <motion.h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 mb-6 [text-shadow:1px_1px_2px_rgba(255,255,255,0.5)]">
            Your Intelligent <br />
            <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
              Career Co-Pilot
            </span>
          </motion.h1>

          <motion.p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
            Accelerate your job search with intelligent tools for CV building,
            interview practice, and direct connections to top employers.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <SpotlightButton href="/auth">
              Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
            </SpotlightButton>
            <FlipButton href="#how-it-works">How it Works</FlipButton>
          </motion.div>
        </motion.div>

        {/* --- Laptop with Animated Screen --- */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-full max-w-2xl mx-auto"
        >
          {/* Laptop Container */}
          <div className="relative">
            {/* Laptop Image */}
            <Image
              src="/image.png"
              alt="Laptop showing JobSpark interface"
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />
            
            {/* Screen Content Overlay - Precisely positioned */}
            <div className="absolute top-[6%] left-[13.5%] right-[13.5%] bottom-[47%] bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden shadow-inner border border-slate-200/50">
              {/* Screen Content */}
              <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sceneIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full flex flex-col items-center justify-center space-y-3 text-center h-full"
                  >
                    {/* Icon */}
                    <motion.div
                      className="p-2 bg-white rounded-full shadow-md border border-slate-200"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <CurrentIcon className="w-5 h-5 text-sky-500" />
                    </motion.div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-slate-800 text-sm">
                      {CurrentScene.title}
                    </h3>
                    
                    {/* Content */}
                    <div className="w-full flex-1 flex items-center justify-center">
                      <div className="w-full max-w-[200px]">
                        {CurrentScene.content}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Screen Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-lg" />
            </div>
            
            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200/20 to-indigo-200/20 rounded-3xl blur-3xl -z-10 animate-pulse-slow" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};