"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Target, Brain } from "lucide-react";

const features = [
  {
    icon: Zap,
    color: "#f43f5e",
    title: "Sprint Analytics",
    desc: "Sub-800m explosive performance tracking — reaction time, peak velocity, and anaerobic capacity indices.",
  },
  {
    icon: Target,
    color: "#f59e0b",
    title: "Mid-Distance Engine",
    desc: "Lactate threshold estimation, 800 m–3 km pace strategy, and VO₂ max trajectory modelling.",
  },
  {
    icon: Brain,
    color: "#3b82f6",
    title: "AI Endurance Coach",
    desc: "7-day microcycle generation, HR zone compliance, and fatigue-indexed recovery directives for long runs.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", filter: "blur(40px)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-20 px-4 relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
          AI Performance Analytics · v2.0
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
          <span className="bg-gradient-to-br from-[#3b82f6] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent">
            RunMetric
          </span>
        </h1>

        <p className="text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          From sprint to marathon — one intelligent platform that interprets your physiology,
          computes training load, and prescribes recovery with clinical precision.
        </p>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-lg
              bg-gradient-to-r from-[#2563eb] to-[#7c3aed] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
              transition-all duration-300"
          >
            Enter Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl px-4 relative z-10"
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.6 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass-card p-7 group cursor-default"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${f.color}18`, boxShadow: `0 0 20px -8px ${f.color}` }}
              >
                <Icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-[#64748b] text-sm leading-relaxed font-light">{f.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
