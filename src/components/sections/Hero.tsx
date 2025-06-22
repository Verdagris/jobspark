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

// --- Animation Scenes for the Viewport ---
const animationScenes = [
  {
    key: "cv",
    icon: FileText,
    title: "Generating Your CV...",
    content: (
      <div className="space-y-2 w-full">
        <div className="h-2.5 w-full bg-slate-200 rounded-full animate-pulse" />
        <div className="h-2.5 w-4/5 bg-slate-200 rounded-full animate-pulse" />
        <div className="h-2.5 w-full bg-slate-200 rounded-full animate-pulse" />
      </div>
    ),
  },
  {
    key: "interview",
    icon: MessageSquare,
    title: "AI Interview Practice",
    content: (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-center font-medium text-indigo-700 bg-indigo-100 px-3 py-2 rounded-lg"
      >
        "Great point! Try elaborating on the STAR method."
      </motion.p>
    ),
  },
  {
    key: "match",
    icon: Briefcase,
    title: "Connecting to Employers...",
    content: (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="flex items-center justify-center gap-2 bg-green-100 p-3 rounded-lg text-green-800 font-semibold"
      >
        <CheckCircle className="w-5 h-5" />
        <span>You're a Match!</span>
      </motion.div>
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

        {/* --- Enhanced Animated Viewport --- */}
        <motion.div
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          className="relative w-full max-w-lg mx-auto aspect-[4/3]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-indigo-200 rounded-3xl opacity-40 blur-2xl animate-pulse-slow"></div>
          <div className="relative w-full h-full bg-white/60 backdrop-blur-xl border-2 border-white/80 rounded-3xl p-6 shadow-2xl shadow-slate-400/20 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={sceneIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-center space-y-4"
              >
                <motion.div
                  className="p-3 bg-white rounded-full shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CurrentIcon className="w-8 h-8 text-sky-500" />
                </motion.div>
                <p className="font-bold text-slate-800 text-lg">
                  {CurrentScene.title}
                </p>
                <div className="w-full h-20 flex items-center justify-center px-4">
                  {CurrentScene.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};