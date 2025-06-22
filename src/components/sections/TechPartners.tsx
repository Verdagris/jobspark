"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const partners = [
  {
    name: "Bolt.new",
    logo: "/bolt-logo.svg",
    description: "AI-powered development platform"
  },
  {
    name: "ElevenLabs",
    logo: "/elevenlabs-logo.svg", 
    description: "Advanced AI voice technology"
  },
  {
    name: "Supabase",
    logo: "https://supabase.com/brand-assets/supabase-logo-icon.svg",
    description: "Open source Firebase alternative"
  },
  {
    name: "OpenAI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    description: "Leading AI technology"
  },
  {
    name: "Vercel",
    logo: "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png",
    description: "Frontend cloud platform"
  },
  {
    name: "Tailwind CSS",
    logo: "https://tailwindcss.com/_next/static/media/tailwindcss-mark.3c5441fc7a190fb1800d4a5c7f07ba4b1345a9c8.svg",
    description: "Utility-first CSS framework"
  }
];

export const TechPartners = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="text-sm sm:text-base text-slate-500 font-medium mb-4">
            Powered by industry-leading technology
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            Built with the Best
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12 items-center"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-all duration-300"
            >
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-3 flex items-center justify-center">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  width={64}
                  height={64}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
                {partner.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">
                {partner.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-8 sm:mt-12"
        >
          <p className="text-xs sm:text-sm text-slate-400">
            Trusted by thousands of professionals • Built with enterprise-grade security
          </p>
        </motion.div>
      </div>
    </section>
  );
};