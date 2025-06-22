"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, BarChart3, Users, Info, ArrowRight } from "lucide-react";
import ShimmerButton from "../ui/ShimmerButton";
import Image from "next/image";
import Link from "next/link";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState("");

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
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20"
      >
        {/* Left Side: Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-sky-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
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
              className="relative font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-full group"
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

        {/* Right Side: Actions & Spinning Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.05, color: "#000" }}
              whileTap={{ scale: 0.95 }}
              className="font-semibold px-4 py-2 text-slate-600 transition-colors hidden sm:block"
            >
              Login
            </motion.button>
          </Link>
          <Link href="/auth">
            <ShimmerButton className="!px-5 !py-2.5">
              <span className="flex items-center">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            </ShimmerButton>
          </Link>
          <div className="animate-spin-slow ml-2">
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
              className="opacity-80"
            />
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
};