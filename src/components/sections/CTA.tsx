"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight, CheckCircle } from "lucide-react";
import React from "react";
import Link from "next/link";

// --- Enhanced "Shine" Button ---
const ShineButton = ({ children, href }: { children: React.ReactNode; href?: string }) => {
    const ButtonContent = (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-slate-800 bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
            {/* The base text */}
            <span className="relative z-10 flex items-center justify-center">{children}</span>

            {/* The animated shine element */}
            <motion.div
                className="absolute inset-0 z-0"
                initial={{ x: "-150%", skewX: "-25deg" }}
                whileHover={{
                    x: "150%",
                    transition: { duration: 0.6, ease: "easeInOut" }
                }}
                style={{
                    background: "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent)",
                }}
            />
        </motion.button>
    );

    return href ? <Link href={href}>{ButtonContent}</Link> : ButtonContent;
};

export const CTA = () => {
  const benefits = [
    "Free to start",
    "No credit card required", 
    "Setup in 5 minutes"
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="relative text-center rounded-2xl sm:rounded-3xl overflow-hidden p-1 bg-gradient-to-br from-sky-300 via-indigo-300 to-sky-300"
        >
          {/* Animated Gradient Background */}
          <div className="absolute inset-[-100%] -z-10 animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#e0f2fe_0%,#a5b4fc_50%,#e0f2fe_100%)]" />
          
          <div className="relative bg-slate-900/90 backdrop-blur-xl p-8 sm:p-12 lg:p-16 rounded-[22px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white mb-4 sm:mb-6 [text-shadow:0_2px_4px_rgba(0,0,0,0.3)]">
                Ready to Find Your Dream Job?
              </h2>
              <p className="text-base sm:text-lg text-sky-100/90 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] leading-relaxed">
                Create your profile in minutes and let our AI co-pilot guide you
                to career success. Your next opportunity is just a click away.
              </p>
              
              {/* Benefits List */}
              <motion.div 
                className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sky-200/90">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <span className="text-sm sm:text-base font-medium">{benefit}</span>
                  </div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ShineButton href="/auth">
                  <span className="flex items-center">
                    Get Started for Free 
                    <Zap className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </ShineButton>
              </motion.div>
              
              <motion.p 
                className="text-sky-200/60 text-xs sm:text-sm mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Join 12,500+ professionals who've accelerated their careers
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};