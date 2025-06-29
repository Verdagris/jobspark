"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-4 md:col-span-1 mb-8 md:mb-0">
            <a href="#" className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-7 h-7 text-sa-green drop-shadow-[0_0_5px_rgba(0,122,61,0.7)]" />
              <span className="text-2xl font-bold text-slate-900">
                JobSpark
              </span>
            </a>
            <p className="text-slate-500 text-sm max-w-xs">
              AI-powered career tools for the modern South African professional.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 col-span-4 md:col-span-3 gap-8">
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Integrations"],
              },
              { title: "Company", links: ["About Us", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-semibold text-slate-900 mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-slate-500 hover:text-sa-green transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} JobSpark. All rights reserved.</p>
          <p>Proudly built for South Africa 🇿🇦</p>
        </div>
      </div>
    </footer>
  );
};