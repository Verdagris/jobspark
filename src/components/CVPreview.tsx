"use client";

import { useMemo } from "react";
import { parseCVMarkdown } from "@/lib/cv-parser";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface CVPreviewProps {
  markdownContent: string;
}

export const CVPreview = ({ markdownContent }: CVPreviewProps) => {
  const cvData = useMemo(() => {
    if (!markdownContent) {
      return null;
    }
    return parseCVMarkdown(markdownContent);
  }, [markdownContent]);

  if (!cvData) {
    return (
      <div className="text-center text-slate-500">
        Could not parse CV content.
      </div>
    );
  }

  return (
    <div className="bg-white text-black font-sans text-base">
      {/* Header */}
      <header className="text-center border-b-2 border-slate-300 pb-4 mb-6">
        <h1 className="text-4xl font-bold tracking-wide uppercase text-slate-800">
          {cvData.name}
        </h1>
        <p className="text-slate-600 mt-2 text-sm">{cvData.contact}</p>
      </header>

      {/* Sections */}
      <main className="space-y-6">
        {cvData.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-3">
              {section.title}
            </h2>
            <div data-color-mode="light" className="wm-preview-light">
              <MarkdownPreview source={section.content} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
