import React from 'react';
import WomanFaceCanvas from './WomanFaceCanvas';
import { Cpu, Zap, Shield, HeartPulse, Sparkles, Globe, Brain, CheckCircle2 } from 'lucide-react';

/**
 * CovertHomePage Component
 * Clean, informational home page dedicated purely to the Advantages and Uses of AI.
 * Stripped of all search bars, navigation links, buttons, and external actions.
 */
export default function CovertHomePage({ onUnlockPortal }) {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] font-sans selection:bg-[#e8d5c4]">
      
      {/* MINIMALIST HEADER - Purely Branding, No Links or Buttons */}
      <header className="bg-[#faf8f5] border-b border-[#e7dfd5] py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1c1917] text-[#faf8f5]">
              <Brain className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1c1917]">
                AIBlog Intelligence Digest
              </h1>
              <p className="text-xs text-[#78716c] font-mono">Research, Advantages & Applications of Artificial Intelligence</p>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION - Purely Educational Content & Real Portrait */}
      <section className="py-12 lg:py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Educational AI Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2e9e1] border border-[#e2d4c7] text-xs font-mono text-[#8c6b4b] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#a87c51]" />
              <span>Technology & Human Progress</span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#1c1917] leading-[1.18] tracking-tight">
              Transforming Society Through <span className="italic text-[#8c6b4b] font-light">Artificial Intelligence</span>
            </h2>

            <p className="text-base text-[#57534e] leading-relaxed font-light">
              Artificial Intelligence (AI) represents one of the most powerful technological breakthroughs in modern history. By simulating human cognition, learning from complex data patterns, and executing tasks at unprecedented scale, AI is enhancing human capability across every field of knowledge.
            </p>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-[#f5ede4] border border-[#e7dfd5]">
                <span className="block font-serif text-2xl font-bold text-[#1c1917]">99.8%</span>
                <span className="text-[11px] text-[#78716c]">Data Accuracy</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f5ede4] border border-[#e7dfd5]">
                <span className="block font-serif text-2xl font-bold text-[#1c1917]">24/7</span>
                <span className="text-[11px] text-[#78716c]">Continuous Operation</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f5ede4] border border-[#e7dfd5]">
                <span className="block font-serif text-2xl font-bold text-[#1c1917]">10x</span>
                <span className="text-[11px] text-[#78716c]">Faster Analysis</span>
              </div>
            </div>
          </div>

          {/* Right Column: Woman Portrait Feature */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <WomanFaceCanvas onMoleClick={onUnlockPortal} />
              <p className="text-center text-xs font-serif italic text-[#78716c] mt-3">
                Figure 1.1: Facial Analysis & Biometric Symmetry in AI Perception Models
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: CORE ADVANTAGES OF ARTIFICIAL INTELLIGENCE */}
      <section className="py-16 px-6 bg-[#f5ede4] border-y border-[#e7dfd5]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono text-[#a87c51] uppercase tracking-widest">Key Capabilities</span>
            <h3 className="font-serif text-3xl font-normal text-[#1c1917]">Core Advantages of AI</h3>
            <p className="text-sm text-[#78716c] font-light">
              Understanding why artificial intelligence is fundamentally reshaping computational capabilities worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Automation of Repetitive Tasks",
                desc: "AI automates routine, mundane workflows without fatigue, allowing human talent to focus on high-level strategic reasoning and creative innovation."
              },
              {
                icon: Cpu,
                title: "Processing Massive Datasets",
                desc: "AI neural networks can evaluate millions of data points per second, identifying underlying trends and anomalies invisible to manual inspection."
              },
              {
                icon: Shield,
                title: "Reduction of Human Error",
                desc: "By adhering to calibrated algorithmic logic, AI minimizes manual mathematical mistakes, operational oversights, and subjective bias."
              },
              {
                icon: HeartPulse,
                title: "24/7 Operational Availability",
                desc: "Unlike human workforces, AI systems run continuously without downtime, providing non-stop medical monitoring, security, and infrastructure oversight."
              },
              {
                icon: Globe,
                title: "Predictive Intelligence",
                desc: "Leveraging historical data modeling, AI accurately predicts weather catastrophes, financial market shifts, and equipment maintenance needs."
              },
              {
                icon: Brain,
                title: "Accelerated Medical Research",
                desc: "AI models simulate molecular biology, accelerating drug discovery and genome sequencing from decades down to mere days."
              }
            ].map((adv, idx) => {
              const Icon = adv.icon;
              return (
                <div key={idx} className="bg-[#faf8f5] p-6 rounded-2xl border border-[#e7dfd5] space-y-3 shadow-sm">
                  <div className="p-3 rounded-xl bg-[#f2e9e1] text-[#a87c51] w-fit">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-xl text-[#1c1917]">{adv.title}</h4>
                  <p className="text-xs text-[#57534e] leading-relaxed font-light">{adv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: PRACTICAL APPLICATIONS OF AI */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono text-[#a87c51] uppercase tracking-widest">Real-World Impact</span>
          <h3 className="font-serif text-3xl font-normal text-[#1c1917]">Practical Uses Across Industries</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#f5ede4] p-8 rounded-2xl border border-[#e7dfd5] space-y-4">
            <h4 className="font-serif text-2xl text-[#1c1917]">1. Healthcare & Precision Diagnostics</h4>
            <p className="text-sm text-[#57534e] leading-relaxed font-light">
              AI algorithms analyze medical imaging (MRIs, CT scans) with accuracy matching expert radiologists. AI also personalized treatment plans according to individual patient genetic profiles.
            </p>
            <ul className="space-y-2 text-xs text-[#57534e]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#a87c51]" /> Early tumor detection and tissue analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#a87c51]" /> Robotic surgical assistance with sub-millimeter precision
              </li>
            </ul>
          </div>

          <div className="bg-[#f5ede4] p-8 rounded-2xl border border-[#e7dfd5] space-y-4">
            <h4 className="font-serif text-2xl text-[#1c1917]">2. Scientific Discovery & Climate Modeling</h4>
            <p className="text-sm text-[#57534e] leading-relaxed font-light">
              Complex atmospheric models powered by AI forecast global climate patterns, optimize renewable energy grids, and simulate protein folding structures.
            </p>
            <ul className="space-y-2 text-xs text-[#57534e]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#a87c51]" /> Autonomous agricultural yield optimization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#a87c51]" /> Real-time ocean temperature and wildlife tracking
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER - Purely Informational, No Links */}
      <footer className="bg-[#1c1917] text-[#e7d8c9] py-8 px-6 border-t border-[#38322e] text-center text-xs space-y-2 font-mono">
        <p>AIBlog • Educational Overview of Artificial Intelligence</p>
        <p className="text-[#786b5e]">© {new Date().getFullYear()} AIBlog Foundation. All Rights Reserved.</p>
      </footer>

    </div>
  );
}
