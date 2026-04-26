"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, CheckCircle } from "lucide-react";
import { usePerformance } from "@/lib/PerformanceContext";

interface AthleteProfile { age: number; sport: string; heightCm: number; weightKg: number; restingHR: number }
const DEFAULT: AthleteProfile = { age: 25, sport: "Marathon Running", heightCm: 180, weightKg: 75, restingHR: 60 };

const SPORT_OPTIONS = [
  "Marathon Running", "Half Marathon", "10K Track", "5K Track",
  "Cross Country", "Sprinting (100m–400m)", "Middle Distance (800m–1500m)",
  "Trail Running", "Triathlon", "Cycling"
];

export default function ProfilePage() {
  const { latestRun } = usePerformance();
  const [profile, setProfile] = useState<AthleteProfile>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("athlete_profile");
    if (s) setProfile(JSON.parse(s));
  }, []);

  const handleSave = () => {
    localStorage.setItem("athlete_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const maxHR = 220 - profile.age;
  const hrr = maxHR - profile.restingHR; // Heart Rate Reserve
  const zone2Ceil = Math.round(hrr * 0.70 + profile.restingHR); // Karvonen 70%
  const zone4Floor = Math.round(hrr * 0.80 + profile.restingHR); // Karvonen 80%
  const bmi = profile.weightKg / Math.pow(profile.heightCm / 100, 2);
  const vo2MaxEst = 15.3 * (maxHR / profile.restingHR);
  const aiVo2Max = latestRun?.aiMetrics?.metrics?.vo2_max_est;

  return (
    <div className="text-[#f1f5f9] flex flex-col items-center">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-[#3b82f6]/15" style={{ boxShadow: "0 0 30px -8px #3b82f6" }}>
          <Settings className="text-[#3b82f6] w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">Athlete Profile</h1>
        <p className="text-[#64748b] mt-2 font-light max-w-md mx-auto">Physiological baseline — used to personalise HR zones and AI recommendations.</p>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 110 }}
        className="glass-card p-8 w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: "Age", key: "age" as const, type: "number", hint: "Used to compute max HR (220 − age)" },
            { label: "Height (cm)", key: "heightCm" as const, type: "number", hint: "Used to compute BMI" },
            { label: "Weight (kg)", key: "weightKg" as const, type: "number", hint: "Used to compute BMI and calorie burn" },
            { label: "Resting HR (bpm)", key: "restingHR" as const, type: "number", hint: "Used for Karvonen HR zones & VO₂ Max" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-[#64748b] uppercase tracking-widest mb-2">{f.label}</label>
              <input
                type={f.type}
                value={profile[f.key]}
                onChange={e => setProfile(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 outline-none transition-all"
              />
              <p className="text-xs text-[#475569] mt-1 ml-1">{f.hint}</p>
            </div>
          ))}
          <div>
            <label className="block text-xs text-[#64748b] uppercase tracking-widest mb-2">Primary Sport</label>
            <select
              value={profile.sport}
              onChange={e => setProfile(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#3b82f6] outline-none transition-all"
            >
              {SPORT_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
            </select>
            <p className="text-xs text-[#475569] mt-1 ml-1">Determines default event category classification</p>
          </div>
        </div>

        {/* Derived physiological stats */}
        <div className="border-t border-white/8 pt-7 mb-7">
          <p className="text-xs uppercase tracking-widest text-[#64748b] mb-4">Derived Physiological Metrics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "BMI", value: bmi.toFixed(1), color: bmi < 18.5 ? "#f59e0b" : bmi < 25 ? "#10b981" : "#f43f5e", hint: bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : "Overweight" },
              { label: "Est. Max HR", value: `${maxHR}`, unit: "bpm", color: "#f43f5e", hint: "220 − age" },
              { label: "Zone 2 Ceiling", value: `${zone2Ceil}`, unit: "bpm", color: "#10b981", hint: "70% max HR" },
              { label: "Zone 4 Floor", value: `${zone4Floor}`, unit: "bpm", color: "#f59e0b", hint: "80% max HR" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl border" style={{ backgroundColor: `${s.color}10`, borderColor: `${s.color}30` }}>
                <p className="text-xs text-[#64748b] mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>
                  {s.value}<span className="text-xs font-normal ml-1">{(s as { unit?: string }).unit || ""}</span>
                </p>
                <p className="text-xs text-[#475569] mt-0.5">{s.hint}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-2xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/8">
              <p className="text-xs text-[#64748b] mb-1">Baseline Est. VO₂ Max</p>
              <p className="text-2xl font-black text-[#8b5cf6]">{vo2MaxEst.toFixed(1)} <span className="text-xs font-normal">mL/kg/min</span></p>
              <p className="text-xs text-[#475569] mt-0.5">Fox formula estimate (15.3 × maxHR / restingHR)</p>
            </div>
            {aiVo2Max && (
              <div className="p-4 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10">
                <p className="text-xs text-[#64748b] mb-1">Live Computed VO₂ Max</p>
                <p className="text-2xl font-black text-[#3b82f6]">{aiVo2Max.toFixed(1)} <span className="text-xs font-normal">mL/kg/min</span></p>
                <p className="text-xs text-[#475569] mt-0.5">Derived from your latest run (AI Engine)</p>
              </div>
            )}
          </div>
        </div>

        {/* Race Predictions */}
        {latestRun?.aiMetrics?.predicted_race_times && (
          <div className="border-t border-white/8 pt-7 mb-7">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#64748b] mb-1">Predictive Analytics</p>
                <h3 className="text-lg font-bold text-white">Race Time Estimator</h3>
              </div>
              <p className="text-xs text-[#475569] max-w-[200px] text-right">Based on Riegel's endurance formula and your latest performance.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(latestRun.aiMetrics.predicted_race_times).map(([race, seconds]) => {
                const h = Math.floor((seconds as number) / 3600);
                const m = Math.floor(((seconds as number) % 3600) / 60);
                const s = Math.floor((seconds as number) % 60);
                const timeStr = h > 0 
                  ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                  : `${m}:${s.toString().padStart(2, '0')}`;
                  
                return (
                  <div key={race} className="p-4 rounded-2xl border border-white/5 bg-black/40">
                    <p className="text-xs text-[#64748b] mb-1">{race}</p>
                    <p className="text-xl font-black text-[#10b981]">{timeStr}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave}
            className="flex items-center gap-2 py-3 px-8 rounded-xl font-semibold text-white text-sm shadow-lg transition-all"
            style={{ backgroundColor: saved ? "#10b981" : "#2563eb", boxShadow: saved ? "0 8px 24px -6px #10b98160" : "0 8px 24px -6px #2563eb60" }}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
