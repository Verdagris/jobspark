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
    title: "Generating Your CV...",
    content: (
      <div className="space-y-3 w-full px-4">
        <motion.div 
          className="h-3 w-full bg-gradient-to-r from-sky-200 to-sky-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-4/5 bg-gradient-to-r from-sky-200 to-sky-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "80%" }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-full bg-gradient-to-r from-sky-200 to-sky-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
        />
        <motion.div 
          className="h-3 w-3/4 bg-gradient-to-r from-sky-200 to-sky-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
        />
      </div>
    ),
  },
  {
    key: "interview",
    icon: MessageSquare,
    title: "AI Interview Practice",
    content: (
      <div className="text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-4 p-3 bg-purple-100 rounded-full inline-block"
        >
          <MessageSquare className="w-6 h-6 text-purple-600" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm font-medium text-purple-700 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200"
        >
          "Tell me about a time you showed leadership."
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-3 flex items-center justify-center space-x-1"
        >
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </motion.div>
      </div>
    ),
  },
  {
    key: "match",
    icon: Briefcase,
    title: "Connecting to Employers...",
    content: (
      <div className="text-center px-4">
        <div className="relative mb-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 p-3 bg-green-100 border-2 border-green-200 rounded-xl flex items-center justify-center"
              initial={{ y: 0, rotate: 0, scale: 1, opacity: 0.8 }}
              animate={{ 
                y: -i * 8,
                rotate: (i - 1) * 5,
                scale: 1 - i * 0.05,
                opacity: 1 - i * 0.2
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: i * 0.2 }}
            >
              <Briefcase className="w-5 h-5 text-green-600 mr-2"/>
              <span className="font-semibold text-green-800 text-sm">Company {i + 1}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="mt-12 flex items-center justify-center gap-2 bg-green-100 p-3 rounded-lg text-green-800 font-semibold border border-green-200"
        >
          <CheckCircle className="w-5 h-5" />
          <span>Perfect Match!</span>
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
              alt="Laptop"
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />
            
            {/* Screen Content Overlay */}
            <div className="absolute top-[8%] left-[12%] right-[12%] bottom-[45%] bg-white rounded-lg overflow-hidden shadow-inner">
              {/* Screen Content */}
              <div className="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sceneIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full flex flex-col items-center justify-center space-y-4 text-center"
                  >
                    {/* Icon */}
                    <motion.div
                      className="p-3 bg-white rounded-full shadow-lg border border-slate-200"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <CurrentIcon className="w-6 h-6 text-sky-500" />
                    </motion.div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-slate-800 text-sm lg:text-base">
                      {CurrentScene.title}
                    </h3>
                    
                    {/* Content */}
                    <div className="w-full flex items-center justify-center min-h-[80px]">
                      {CurrentScene.content}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Screen Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200/20 to-indigo-200/20 rounded-3xl blur-3xl -z-10 animate-pulse-slow" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};