"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePerformance, EVENT_LABELS } from "@/lib/PerformanceContext";
import {
  Clock, Heart, Flame, TrendingUp, Plus, X, ChevronRight, Trash2
} from "lucide-react";

const cardVariants: any = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

export default function DashboardPage() {
  const { runs, latestRun, analytics, addRun, clearData } = usePerformance();
  const [isLogging, setIsLogging] = useState(false);
  const [newRun, setNewRun] = useState({ distance: "", time: "", avgHeartRate: "" });
  const [formError, setFormError] = useState("");

  const stats = [
    { label: "Total Runs", value: analytics.totalRuns.toString(), unit: "", icon: TrendingUp, color: "#3b82f6" },
    { label: "Avg Speed", value: analytics.lastRunAvgSpeedMs.toFixed(2), unit: "m/s", icon: Flame, color: "#f59e0b" },
    { label: "Avg Fatigue", value: `${latestRun ? latestRun.fatigueIndex : 0}`, unit: "%", icon: Heart, color: "#f43f5e" },
    { label: "Total Calories", value: runs.reduce((a, r) => a + r.calories, 0).toLocaleString(), unit: "kcal", icon: Clock, color: "#10b981" },
  ];

  const parseTime = (t: string) => {
    if (!t) return 0;
    const parts = t.split(":").map(Number).filter(n => !isNaN(n));
    if (parts.length === 1) return parts[0]; // SS
    if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    return 0;
  };

  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const distance = parseFloat(newRun.distance);
    const avgHR = parseInt(newRun.avgHeartRate, 10);
    const totalSec = parseTime(newRun.time);

    if (!distance || distance <= 0 || isNaN(avgHR) || avgHR < 60 || avgHR > 220 || totalSec <= 0) {
      setFormError("Check inputs: Distance > 0 km · HR 60–220 bpm · Time (e.g. 05:30)");
      return;
    }

    const secPerKm = totalSec / distance;
    const fullKms = Math.floor(distance);
    const fracKm = parseFloat((distance - fullKms).toFixed(2));
    const laps: Array<{ lapNumber: number; timeStr: string; duration: number; heartRate: number; paceStr: string }> = [];
    const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
    const toStr = (sec: number) => `${pad(sec / 60)}:${pad(sec % 60)}`;

    for (let i = 0; i < fullKms; i++) {
      const driftFactor = 1 + i * 0.01;
      const lapSec = Math.round(secPerKm * driftFactor);
      const lapHR = Math.min(Math.round(avgHR * (0.95 + i * 0.008)), 210);
      laps.push({ lapNumber: i + 1, timeStr: toStr(lapSec), duration: lapSec, heartRate: lapHR, paceStr: toStr(lapSec) });
    }
    if (fracKm >= 0.05) {
      const lapSec = Math.round(secPerKm * fracKm * (1 + fullKms * 0.01));
      const lapHR = Math.min(Math.round(avgHR * 1.02), 210);
      laps.push({ lapNumber: fullKms + 1, timeStr: toStr(lapSec), duration: lapSec, heartRate: lapHR, paceStr: toStr(secPerKm) });
    }

    setIsLogging(false); // Can close immediately or wait, but user experience is better if we wait? Wait, the form disables if we have a state. Let's just await it.
    await addRun({ distance, timeStr: newRun.time, avgHeartRate: avgHR, laps });
    setNewRun({ distance: "", time: "", avgHeartRate: "" });
  };

  return (
    <div className="space-y-8 text-[#f1f5f9]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-[#64748b] mt-1 font-light">Your real-time performance command centre.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setNewRun({ distance: "", time: "", avgHeartRate: "" }); setFormError(""); setIsLogging(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
            >
              <Plus className="w-4 h-4" /> Log Run
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-[#64748b] hover:text-[#f43f5e] text-sm font-medium transition-colors"
              title="Reset to demo data"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -3, scale: 1.01 }}
              className="glass-card p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${s.color}18`, boxShadow: `0 0 16px -6px ${s.color}` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-[#64748b] text-xs uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-3xl font-black text-white">
                {s.value}
                <span className="text-sm font-normal text-[#64748b] ml-1">{s.unit}</span>
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lap splits table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="lg:col-span-3 glass-card p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Latest Split Times</h2>
              {latestRun && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#64748b]">{latestRun.date.substring(0, 10)}</span>
                  {latestRun.eventCategory && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium border"
                      style={{
                        color: EVENT_LABELS[latestRun.eventCategory].color,
                        borderColor: `${EVENT_LABELS[latestRun.eventCategory].color}40`,
                        backgroundColor: `${EVENT_LABELS[latestRun.eventCategory].color}12`,
                      }}>
                      {EVENT_LABELS[latestRun.eventCategory].icon} {EVENT_LABELS[latestRun.eventCategory].label}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {latestRun ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Lap", "Pace", "Time", "Avg HR"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[#64748b] text-xs uppercase tracking-widest font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {latestRun.laps.map((lap, i) => (
                    <motion.tr
                      key={lap.lapNumber}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/4 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-[#3b82f6]">{lap.lapNumber}</td>
                      <td className="py-3 px-3 font-mono text-white">{lap.paceStr} /km</td>
                      <td className="py-3 px-3 font-mono text-[#94a3b8]">{lap.timeStr}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-[#f43f5e] font-semibold">
                          <Heart className="w-3 h-3" /> {lap.heartRate} bpm
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#64748b]">No runs logged yet.</div>
          )}
        </motion.div>

        {/* Right panel: Log form + Recent History */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Log form panel */}
          <AnimatePresence mode="wait">
            {!isLogging ? (
              <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-7">
                <h2 className="text-xl font-bold text-white mb-1">Feed Run Data</h2>
                <p className="text-[#64748b] text-sm mb-5">Auto-classifies as sprint / mid / long based on distance.</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setNewRun({ distance: "", time: "", avgHeartRate: "" }); setFormError(""); setIsLogging(true); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
                >
                  <Plus className="w-4 h-4" /> Enter Data
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">New Run</h2>
                  <button onClick={() => setIsLogging(false)} className="text-[#64748b] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-xs">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleLogRun} className="space-y-4">
                  {[
                    { label: "Distance (km)", key: "distance" as const, placeholder: "e.g. 0.4 = sprint, 10 = long" },
                    { label: "Time (MM:SS)", key: "time" as const, placeholder: "e.g. 52:30" },
                    { label: "Avg Heart Rate (bpm)", key: "avgHeartRate" as const, placeholder: "60 – 220" },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-[#64748b] uppercase tracking-widest mb-1.5">{field.label}</label>
                      <input
                        type="text"
                        value={newRun[field.key]}
                        onChange={e => setNewRun(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#475569] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 outline-none transition-all"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsLogging(false)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-[#64748b] hover:text-white text-sm font-medium transition-colors">
                      Cancel
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit"
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-sm font-semibold shadow-lg shadow-blue-500/20">
                      Save Run
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent history */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-7 flex-1"
          >
            <h2 className="text-xl font-bold text-white mb-5">Recent History</h2>
            <div className="space-y-3">
              {runs.slice(0, 6).map((run, i) => {
                const ev = EVENT_LABELS[run.eventCategory];
                return (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/4 border border-white/6 hover:bg-white/7 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg" title={ev.label}>{ev.icon}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{run.distance} km</p>
                        <p className="text-[#64748b] text-xs">{run.date.substring(0, 10)} · {run.avgPace}/km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: ev.color }}>{ev.label}</p>
                      <p className="text-[#64748b] text-xs">{run.avgHeartRate} bpm</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
