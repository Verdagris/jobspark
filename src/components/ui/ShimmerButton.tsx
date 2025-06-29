"use client";

import { motion } from "framer-motion";

const ShimmerButton = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium transition duration-300 ease-out border-2 rounded-lg shadow-md group ${
      // Light mode and dark mode styles with SA colors
      "text-slate-800 border-green-600/50 dark:text-white dark:border-green-600/80"
    } ${className}`}
  >
    {/* Base background color */}
    <span className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900"></span>
    {/* Shimmer effect */}
    <span
      className={`absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 rounded-full opacity-30 group-hover:rotate-90 ease bg-green-600`}
    ></span>
    {/* Text content */}
    <span className="relative">{children}</span>
  </motion.button>
);

export default ShimmerButton;