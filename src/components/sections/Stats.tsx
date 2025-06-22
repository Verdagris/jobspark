"use client";

import { motion, Variants } from "framer-motion";
import { Zap, Building2, TrendingUp, Star } from "lucide-react";
import AnimatedCounter from "../ui/AnimatedCounter";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 15 },
  },
};

export const Stats = () => {
  const stats = [
    { value: 12500, label: "Careers Launched", icon: Zap, color: "from-yellow-400 to-orange-500" },
    { value: 650, label: "Partner Companies", icon: Building2, color: "from-blue-400 to-cyan-500" },
    { value: 92, suffix: "%", label: "Success Rate", icon: TrendingUp, color: "from-green-400 to-emerald-500" },
    { value: 4.9, suffix: "/5", label: "User Rating", icon: Star, precision: 1, color: "from-purple-400 to-pink-500" },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900 mb-3 sm:mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Our platform's success is measured by the success of our users.
            Here's a look at our impact.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="relative group"
            >
              {/* Simplified background glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative text-center bg-white/70 backdrop-blur-md border border-slate-200/80 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl h-full flex flex-col items-center justify-center shadow-lg"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`p-2 sm:p-3 lg:p-4 bg-gradient-to-r ${stat.color} rounded-full mb-3 sm:mb-4`}
                >
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                </motion.div>

                <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tighter text-slate-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} precision={stat.precision} />
                </div>
                <div className="text-slate-500 mt-1 sm:mt-2 font-medium text-xs sm:text-sm lg:text-base text-center leading-tight">
                  {stat.label}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};