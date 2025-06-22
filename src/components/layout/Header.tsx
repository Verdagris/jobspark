"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, BarChart3, Users, Info, ArrowRight, Menu, X } from "lucide-react";
import ShimmerButton from "../ui/ShimmerButton";
import Image from "next/image";
import Link from "next/link";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features", icon: BarChart3 },
    { name: "How It Works", href: "#how-it-works", icon: Users },
    { name: "Testimonials", href: "#testimonials", icon: Info },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

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
        scrolled
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
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            JobSpark
          </span>
        </Link>

        {/* Center: Navigation - Hidden on mobile, shown on md+ */}
        <div
          className="hidden md:flex items-center space-x-1 bg-white/60 border border-slate-200/80 rounded-full px-2 shadow-sm"
          onMouseLeave={() => setHoveredLink("")}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="relative font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 lg:px-4 py-2 rounded-full group text-sm lg:text-base"
              onMouseEnter={() => setHoveredLink(link.name)}
            >
              <span className="relative z-10 flex items-center">
                <link.icon className="w-4 h-4 mr-2 text-slate-400 group-hover:text-sky-500 transition-colors" />
                {link.name}
              </span>
              {hoveredLink === link.name && (
                <motion.div
                  className="absolute inset-0 bg-slate-100 rounded-full"
                  layoutId="hover-bg"
                  transition={{
                    duration: 0.25,
                    type: "spring",
                    stiffness: 120,
                    damping: 14,
                  }}
                />
              )}
            </a>
          ))}
        </div>

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
            <ShimmerButton className="!px-4 lg:!px-5 !py-2 lg:!py-2.5 !text-sm lg:!text-base">
              <span className="flex items-center">
                Get Started <ArrowRight className="ml-2 w-3 h-3 lg:w-4 lg:h-4" />
              </span>
            </ShimmerButton>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {/* Spinning Logo */}
          <div className="animate-spin-slow ml-2 hidden lg:block">
            <Image
              src="/bolt.svg"
              alt="Decorative Bolt"
              width={60}
              height={60}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open("https://bolt.new", "_blank");
                }
              }}
              className="opacity-80 cursor-pointer"
            />
          </div>
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
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <link.icon className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{link.name}</span>
              </a>
            ))}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <Link href="/auth" className="block">
                <button className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                  Login
                </button>
              </Link>
              <Link href="/auth" className="block">
                <button className="w-full bg-sky-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors">
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