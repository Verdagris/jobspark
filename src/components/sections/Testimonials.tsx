"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Quote, ArrowLeft, ArrowRight, Star } from "lucide-react";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const testimonials = [
    { 
      name: "Thabo Ndlovu", 
      role: "Software Engineer, Vodacom", 
      content: "JobSpark's AI CV builder is a game-changer. It helped me highlight my skills in a way I never could have on my own. I landed my dream job in just three weeks.", 
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
      location: "Johannesburg"
    },
    { 
      name: "Aisha Khan", 
      role: "Marketing Manager, Takealot", 
      content: "The interview prep tool was incredible. I went into my interviews feeling so much more confident and prepared. It made all the difference.", 
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      location: "Cape Town"
    },
    { 
      name: "Michael Botha", 
      role: "Data Analyst, Standard Bank", 
      content: "A fantastic platform for the South African market. The direct connections to employers are invaluable. I received three offers!", 
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
      rating: 5,
      location: "Durban"
    },
];

// Helper to handle wrapping indices
const wrap = (index: number, length: number) => {
  return ((index % length) + length) % length;
};

export const Testimonials = () => {
    const [[activeIndex, direction], setActiveIndex] = useState([0, 0]);
    const [isHovered, setIsHovered] = useState(false);

    const changeTestimonial = (newDirection: number) => {
        setActiveIndex([wrap(activeIndex + newDirection, testimonials.length), newDirection]);
    };
    
    useEffect(() => {
        if(isHovered) return;
        const interval = setInterval(() => changeTestimonial(1), 6000);
        return () => clearInterval(interval);
    }, [isHovered, activeIndex]);

    const activeTestimonial = testimonials[activeIndex];

    const slideVariants: Variants = {
        enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
        center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 25 } },
        exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0, scale: 0.95, transition: { type: "spring", stiffness: 200, damping: 25 } }),
    };

    return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] opacity-30 sm:opacity-50" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900 mb-3 sm:mb-4">
            Loved by Professionals in SA
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Real stories from people who've transformed their careers with JobSpark.
          </p>
        </motion.div>
        
        <div 
            className="relative min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={activeIndex} 
                    custom={direction} 
                    variants={slideVariants}
                    initial="enter" 
                    animate="center" 
                    exit="exit"
                    className="absolute w-full max-w-2xl p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80"
                >
                    <Quote className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 text-slate-100" />
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(activeTestimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="relative text-base sm:text-lg text-slate-700 mb-6 leading-relaxed">
                      "{activeTestimonial.content}"
                    </p>
                    
                    <div className="flex items-center space-x-4">
                        <Image 
                          src={activeTestimonial.avatar} 
                          alt={activeTestimonial.name} 
                          width={56} 
                          height={56} 
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-sky-200 object-cover" 
                        />
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 text-sm sm:text-base">{activeTestimonial.name}</div>
                            <div className="text-xs sm:text-sm text-slate-600">{activeTestimonial.role}</div>
                            <div className="text-xs text-slate-500">{activeTestimonial.location}</div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            
            {/* Navigation Buttons */}
            <button 
              onClick={() => changeTestimonial(-1)} 
              className="absolute left-2 sm:left-4 lg:-left-12 p-2 sm:p-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-md z-20 group"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-600 group-hover:text-slate-800"/>
            </button>
            <button 
              onClick={() => changeTestimonial(1)} 
              className="absolute right-2 sm:right-4 lg:-right-12 p-2 sm:p-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-md z-20 group"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-600 group-hover:text-slate-800"/>
            </button>
        </div>
        
        {/* Testimonial Indicators */}
        <div className="flex justify-center space-x-2 mt-6 sm:mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex([index, index > activeIndex ? 1 : -1])}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-sky-500 w-6 sm:w-8' 
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};