"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const partners = [
  {
    name: "Bolt.new",
    logo: "/bolt-logo.svg",
    url: "https://bolt.new"
  },
  {
    name: "ElevenLabs",
    logo: "/elevenlabs-logo.svg", 
    url: "https://elevenlabs.io"
  },
  {
    name: "Supabase",
    logo: "https://supabase.com/brand-assets/supabase-logo-icon.svg",
    url: "https://supabase.com"
  },
  {
    name: "OpenAI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    url: "https://openai.com"
  },
  {
    name: "Netlify",
    logo: "https://www.netlify.com/v3/img/components/logomark.png",
    url: "https://netlify.com"
  },
  {
    name: "Tailwind CSS",
    logo: "https://tailwindcss.com/_next/static/media/tailwindcss-mark.3c5441fc7a190fb1800d4a5c7f07ba4b1345a9c8.svg",
    url: "https://tailwindcss.com"
  }
];

export const TechPartners = () => {
  return (
    <section className="py-8 sm:py-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
            Powered by
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-16"
        >
          {partners.map((partner, index) => (
            <motion.a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -2 }}
              className="group flex items-center justify-center transition-all duration-300"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  width={48}
                  height={48}
                  className="max-w-full max-h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};