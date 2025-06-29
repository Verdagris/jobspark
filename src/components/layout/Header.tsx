"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "circOut",
      },
    },
  };

  const contentVariants = {
    initial: { y: -20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "circOut", staggerChildren: 0.1 },
    },
  };

  return (
    <motion.nav
      initial="initial"
      animate="animate"
      variants={headerVariants as any}
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        mounted && scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-md border-b border-slate-200/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <motion.div
        variants={contentVariants as any}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 sm:h-20"
      >
        {/* Left Side: Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            JobSpark
          </span>
        </Link>

        {/* Right Side: Actions & Mobile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/auth" className="hidden sm:block">
            <motion.button
              whileHover={{ scale: 1.05, color: "#000" }}
              whileTap={{ scale: 0.95 }}
              className="font-semibold px-3 lg:px-4 py-2 text-slate-600 transition-colors text-sm lg:text-base"
            >
              Login
            </motion.button>
          </Link>
          <Link href="/auth" className="hidden sm:block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60"
        >
          <div className="px-4 py-6 space-y-4">
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <Link href="/auth" className="block">
                <button className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                  Login
                </button>
              </Link>
              <Link href="/auth" className="block">
                <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};