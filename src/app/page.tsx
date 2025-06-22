// Import all the components we've built
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { TechPartners } from "@/components/sections/TechPartners";
import { Stats } from "@/components/sections/Stats";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    // The main container provides the base background color
    <main className="bg-white text-slate-800 antialiased">
      <Header />
      <Hero />
      <TechPartners />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}