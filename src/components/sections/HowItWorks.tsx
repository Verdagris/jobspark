"use client";

import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { UserPlus, PencilRuler, Send, ArrowRight } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    title: "Build Your Profile",
    description: "Our intuitive onboarding helps you create a comprehensive professional profile that truly stands out.",
    features: ["AI-guided setup", "Smart suggestions", "Profile optimization"]
  },
  {
    icon: PencilRuler,
    title: "Enhance & Prepare",
    description: "Leverage AI tools to craft the perfect CV, write compelling cover letters, and ace your interviews.",
    features: ["CV generation", "Interview practice", "Real-time feedback"]
  },
  {
    icon: Send,
    title: "Apply & Succeed",
    description: "Connect with curated opportunities and track your application progress all in one unified platform.",
    features: ["Job matching", "Application tracking", "Direct connections"]
  },
];

const MobileStep = ({ step, index }: { step: any, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.6 }}
      className="relative"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-lg">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center shadow-lg">
            <step.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-sky-600 mb-1">Step {index + 1}</div>
            <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
        <div className="space-y-2">
          {step.features.map((feature: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
              <span className="text-sm text-slate-600">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      {index < steps.length - 1 && (
        <div className="flex justify-center my-6">
          <ArrowRight className="w-6 h-6 text-sky-400" />
        </div>
      )}
    </motion.div>
  );
};

const TimelineStep = ({ step, index }: { step: any, index: number }) => {
    const isReversed = index % 2 !== 0;

    const cardVariants: Variants = {
        offscreen: { opacity: 0, x: isReversed ? 50 : -50 },
        onscreen: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", duration: 0.8, bounce: 0.2 }
        }
    };
    
    const markerVariants: Variants = {
        offscreen: { scale: 0 },
        onscreen: {
            scale: 1,
            transition: { type: "spring", duration: 0.8, bounce: 0.3 },
        }
    };
    
     const markerGlowVariants: Variants = {
        offscreen: { opacity: 0 },
        onscreen: {
            opacity: [0, 0.7, 0],
            scale: [1, 2.5, 1],
            transition: { duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }
        }
    };

    return (
        <motion.div 
            className="relative"
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.5 }}
        >
            <div className={`flex items-start ${isReversed ? 'flex-row-reverse' : ''}`}>
                <div className="w-1/2">
                    <motion.div variants={cardVariants} className={`w-full ${isReversed ? 'pl-8' : 'pr-8'}`}>
                        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="text-sm font-medium text-sky-600">Step {index + 1}</div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                            <div className="space-y-2">
                              {step.features.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                                  <span className="text-sm text-slate-600">{feature}</span>
                                </div>
                              ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="w-1/2" /> {/* This is a spacer */}
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex items-start justify-center">
                 <motion.div variants={markerVariants} className="relative w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center border-4 border-white shadow-lg z-10">
                    <step.icon className="w-6 h-6 text-white" />
                    <motion.div variants={markerGlowVariants} className="absolute w-full h-full bg-sky-500 rounded-full blur-lg" />
                </motion.div>
            </div>
        </motion.div>
    );
}

export const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  
  const timelineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900 mb-3 sm:mb-4">
            Your Path to Success in 3 Steps
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Follow our proven process to go from job seeker to valued employee.
          </p>
        </motion.div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <MobileStep key={index} step={step} index={index} />
          ))}
        </div>

        {/* Desktop Timeline Layout */}
        <div ref={containerRef} className="hidden lg:block relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-1 bg-slate-200" />
            <motion.div 
                style={{ height: timelineHeight }}
                className="absolute left-1/2 -translate-x-1/2 top-6 w-1 bg-gradient-to-b from-sky-500 to-blue-500" 
            />
            
            <div className="flex flex-col gap-y-24">
                {steps.map((step, index) => (
                    <TimelineStep key={index} step={step} index={index} />
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};