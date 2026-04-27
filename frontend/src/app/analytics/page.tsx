"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import { usePerformance, EVENT_LABELS, EventCategory } from "@/lib/PerformanceContext";
import { Zap, Target, TrendingUp, AlertTriangle, Shield, Activity, Share2 } from "lucide-react";
import { PerformanceGraph } from "@/lib/dsa/Graph";

const TABS = [
  { key: "all",    label: "All Events",    icon: "📊", color: "#3b82f6" },
  { key: "sprint", label: "Sprint",        icon: "⚡", color: "#f43f5e" },
  { key: "mid",    label: "Mid-Distance",  icon: "🔥", color: "#f59e0b" },
  { key: "long",   label: "Long Distance", icon: "🏃", color: "#10b981" },
] as const;

const fmtPace = (sec: number) => {
  if (!sec || sec <= 0 || sec === Infinity || isNaN(sec)) return "—";
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2,"0")}`;
};

const parsePaceToSec = (paceStr: string) => {
  if (!paceStr || paceStr === "—") return 0;
  // Strip units like /km or /mi if present
  const cleanStr = paceStr.split("/")[0].trim();
  const parts = cleanStr.split(":").map(Number).filter(n => !isNaN(n));
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

export default function AnalyticsPage() {
  const { runs, analytics } = usePerformance();
  const [activeTab, setActiveTab] = useState<EventCategory | "all">("all");

  const filteredRuns = activeTab === "all" ? runs : runs.filter(r => r.eventCategory === activeTab);
  const sortedRuns = [...filteredRuns].reverse();

  const historicalData = sortedRuns.map(run => {
    return { date: run.date.substring(5, 10), pace: parsePaceToSec(run.avgPace), hr: run.avgHeartRate, fatigue: run.fatigueIndex };
  });

  const latestRun = filteredRuns[0];
  const lapData = latestRun ? latestRun.laps.map(lap => {
    return { split: `L${lap.lapNumber}`, pace: parsePaceToSec(lap.paceStr), hr: lap.heartRate };
  }) : [];

  const radarData = [
    { metric: "Speed", sprint: Math.min(100, analytics.sprintStats.avgSpeedMs * 8), mid: Math.min(100, analytics.midStats.avgSpeedMs * 12), long: Math.min(100, analytics.longStats.avgSpeedMs * 15) },
    { metric: "Efficiency", sprint: Math.min(100, (analytics.sprintStats.avgSpeedMs / (analytics.sprintStats.avgHeartRate || 1)) * 800), mid: Math.min(100, (analytics.midStats.avgSpeedMs / (analytics.midStats.avgHeartRate || 1)) * 1000), long: Math.min(100, (analytics.longStats.avgHeartRate > 0 ? (analytics.longStats.avgSpeedMs / analytics.longStats.avgHeartRate) * 1200 : 0)) },
    { metric: "Volume", sprint: Math.min(100, analytics.sprintStats.totalDistanceKm * 50), mid: Math.min(100, analytics.midStats.totalDistanceKm * 10), long: Math.min(100, analytics.longStats.totalDistanceKm * 3) },
    { metric: "Recovery", sprint: Math.min(100, 100 - analytics.sprintStats.avgFatigue), mid: Math.min(100, 100 - analytics.midStats.avgFatigue), long: Math.min(100, 100 - analytics.longStats.avgFatigue) },
    { metric: "Consistency", sprint: Math.min(100, analytics.sprintStats.count * 15), mid: Math.min(100, analytics.midStats.count * 20), long: Math.min(100, analytics.longStats.count * 25) },
  ];

  const tipStyle = { contentStyle: { backgroundColor: "#0f172a", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "12px" }, itemStyle: { color: "#f1f5f9" }, labelStyle: { color: "#64748b" }, cursor: { fill: "rgba(255,255,255,0.04)" } };

  const catCards = [
    { key: "sprint" as EventCategory, stats: analytics.sprintStats, icon: <Zap className="w-4 h-4" />, color: "#f43f5e" },
    { key: "mid" as EventCategory, stats: analytics.midStats, icon: <Target className="w-4 h-4" />, color: "#f59e0b" },
    { key: "long" as EventCategory, stats: analytics.longStats, icon: <TrendingUp className="w-4 h-4" />, color: "#10b981" },
  ];

  // DSA Integration: Graph - Find Correlation Clusters
  const graph = new PerformanceGraph();
  runs.forEach(run => graph.addNode(run.id));
  
  // Connect runs that have similar fatigue (+/- 5%) and pace (+/- 10s)
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const r1 = runs[i];
      const r2 = runs[j];
      const fatigueDiff = Math.abs(r1.fatigueIndex - r2.fatigueIndex);
      const pace1 = parsePaceToSec(r1.avgPace);
      const pace2 = parsePaceToSec(r2.avgPace);
      const paceDiff = Math.abs(pace1 - pace2);
      
      if (fatigueDiff < 5 && paceDiff < 15) {
        graph.addEdge(r1.id, r2.id);
      }
    }
  }
  
  const clusters = graph.findClusters();

  return (
    <div className="space-y-8 text-[#f1f5f9]">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">Performance Analytics</h1>
        <p className="text-[#64748b] mt-1 font-light">Physiological trend analysis across all event categories.</p>
      </motion.header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Runs", value: analytics.totalRuns.toString(), color: "#3b82f6" },
          { label: "Pace Trend", value: analytics.paceTrend === "insufficient_data" ? "—" : analytics.paceTrend === "improving" ? `↑ ${Math.abs(analytics.paceChangePercent).toFixed(1)}%` : analytics.paceTrend === "degrading" ? `↓ ${analytics.paceChangePercent.toFixed(1)}%` : "Stable", color: analytics.paceTrend === "improving" ? "#10b981" : analytics.paceTrend === "degrading" ? "#f43f5e" : "#3b82f6" },
          { label: "Avg Fatigue", value: `${analytics.avgFatigue.toFixed(1)}%`, color: "#f59e0b" },
          { label: "Weekly km", value: `${analytics.weeklyDistanceKm.toFixed(1)} km`, color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs text-[#64748b] uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ACWR Injury Risk Gauge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Injury Risk Assessment</h2>
            <p className="text-[#64748b] text-sm">Acute:Chronic Workload Ratio (ACWR) — 7-day vs 28-day training load</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{
              backgroundColor: analytics.acwr === 0 ? '#64748b15' : analytics.acwr < 0.8 ? '#3b82f615' : analytics.acwr <= 1.3 ? '#10b98115' : analytics.acwr <= 1.5 ? '#f59e0b15' : '#f43f5e15',
              color: analytics.acwr === 0 ? '#64748b' : analytics.acwr < 0.8 ? '#3b82f6' : analytics.acwr <= 1.3 ? '#10b981' : analytics.acwr <= 1.5 ? '#f59e0b' : '#f43f5e',
              border: `1px solid ${analytics.acwr === 0 ? '#64748b30' : analytics.acwr < 0.8 ? '#3b82f630' : analytics.acwr <= 1.3 ? '#10b98130' : analytics.acwr <= 1.5 ? '#f59e0b30' : '#f43f5e30'}`
            }}>
            {analytics.acwr === 0 ? <Activity className="w-4 h-4" /> : analytics.acwr <= 1.3 ? <Shield className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{analytics.acwr === 0 ? 'No Data' : analytics.acwr < 0.8 ? 'Under-training' : analytics.acwr <= 1.3 ? 'Optimal' : analytics.acwr <= 1.5 ? 'Caution' : 'Danger Zone'}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Gauge visual */}
          <div className="relative w-40 h-24 flex-shrink-0">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              {/* Background arc */}
              <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="12" strokeLinecap="round" />
              {/* Under-training zone (blue) */}
              <path d="M 15 80 A 65 65 0 0 1 47 30" fill="none" stroke="#3b82f630" strokeWidth="12" strokeLinecap="round" />
              {/* Optimal zone (green) */}
              <path d="M 47 30 A 65 65 0 0 1 113 30" fill="none" stroke="#10b98130" strokeWidth="12" strokeLinecap="round" />
              {/* Caution zone (yellow) */}
              <path d="M 113 30 A 65 65 0 0 1 133 50" fill="none" stroke="#f59e0b30" strokeWidth="12" strokeLinecap="round" />
              {/* Danger zone (red) */}
              <path d="M 133 50 A 65 65 0 0 1 145 80" fill="none" stroke="#f43f5e30" strokeWidth="12" strokeLinecap="round" />
              {/* Needle */}
              {analytics.acwr > 0 && (() => {
                const clampedAcwr = Math.min(Math.max(analytics.acwr, 0), 2);
                const angle = -180 + (clampedAcwr / 2) * 180;
                const rad = (angle * Math.PI) / 180;
                const cx = 80, cy = 80, r = 50;
                const nx = cx + r * Math.cos(rad);
                const ny = cy + r * Math.sin(rad);
                const needleColor = clampedAcwr < 0.8 ? '#3b82f6' : clampedAcwr <= 1.3 ? '#10b981' : clampedAcwr <= 1.5 ? '#f59e0b' : '#f43f5e';
                return (
                  <>
                    <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={needleColor} strokeWidth="3" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="5" fill={needleColor} />
                  </>
                );
              })()}
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <p className="text-2xl font-black" style={{
                color: analytics.acwr === 0 ? '#64748b' : analytics.acwr < 0.8 ? '#3b82f6' : analytics.acwr <= 1.3 ? '#10b981' : analytics.acwr <= 1.5 ? '#f59e0b' : '#f43f5e'
              }}>{analytics.acwr > 0 ? analytics.acwr.toFixed(2) : '—'}</p>
            </div>
          </div>

          {/* Legend and breakdown */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Under-training', range: '< 0.8', color: '#3b82f6', desc: 'Detraining risk' },
              { label: 'Sweet Spot', range: '0.8 – 1.3', color: '#10b981', desc: 'Optimal adaptation' },
              { label: 'Caution', range: '1.3 – 1.5', color: '#f59e0b', desc: 'Elevated risk' },
              { label: 'Danger Zone', range: '> 1.5', color: '#f43f5e', desc: 'Injury likely' },
            ].map(z => (
              <div key={z.label} className="p-3 rounded-xl border" style={{ borderColor: `${z.color}20`, backgroundColor: `${z.color}08` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                  <span className="text-xs font-semibold text-white">{z.label}</span>
                </div>
                <p className="text-xs font-mono" style={{ color: z.color }}>{z.range}</p>
                <p className="text-[10px] text-[#475569] mt-0.5">{z.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Per-event stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {catCards.map(({ key, stats, icon, color }) => {
          const ev = EVENT_LABELS[key];
          return (
            <motion.div key={key} whileHover={{ y: -3 }} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-white">{ev.label}</p>
                  <p className="text-xs text-[#64748b]">{ev.range}</p>
                </div>
                <span className="ml-auto text-2xl font-black" style={{ color }}>{stats.count}</span>
              </div>
              <div className="space-y-2.5">
                {[
                  ["Total Distance", `${stats.totalDistanceKm.toFixed(2)} km`],
                  ["Avg Pace", stats.avgPaceSec > 0 ? fmtPace(stats.avgPaceSec) + "/km" : "—"],
                  ["Best Pace", stats.bestPaceSec > 0 && stats.bestPaceSec !== Infinity ? fmtPace(stats.bestPaceSec) + "/km" : "—"],
                  ["Avg HR", stats.avgHeartRate > 0 ? `${stats.avgHeartRate} bpm` : "—"],
                  ["Avg Fatigue", stats.count > 0 ? `${stats.avgFatigue.toFixed(1)}%` : "—"],
                  ["Avg Speed", stats.avgSpeedMs > 0 ? `${stats.avgSpeedMs.toFixed(2)} m/s` : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[#64748b]">{label}</span>
                    <span className="font-semibold text-white">{val}</span>
                  </div>
                ))}
              </div>
              {stats.count === 0 && <p className="text-center text-[#475569] text-xs mt-4">No {ev.label.toLowerCase()} runs logged</p>}
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <motion.button key={tab.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.key as EventCategory | "all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${activeTab === tab.key ? "text-white border-transparent" : "text-[#64748b] border-white/8 bg-white/4"}`}
              style={activeTab === tab.key ? { backgroundColor: `${tab.color}22`, borderColor: `${tab.color}40`, color: tab.color } : {}}>
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Chart 1 */}
            <div className="glass-card p-7">
              <h2 className="text-xl font-bold text-white mb-1">Pace vs Fatigue Index</h2>
              <p className="text-[#64748b] text-sm mb-6">Historical trend — {activeTab === "all" ? "all events" : EVENT_LABELS[activeTab as EventCategory].label}</p>
              {historicalData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" axisLine={false} tickLine={false} dy={8} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" stroke="#475569" axisLine={false} tickLine={false} dx={-6} domain={["auto","auto"]} reversed={true} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#475569" axisLine={false} tickLine={false} dx={6} domain={[0,100]} tick={{ fontSize: 11 }} />
                      <Tooltip {...tipStyle} formatter={(value: any, name: any) => {
                        const valNum = Number(value);
                        if (name === "Pace") return [`${Math.floor(valNum/60)}:${(valNum%60).toString().padStart(2,"0")}/km`, name];
                        if (name === "Fatigue") return [`${valNum}%`, name];
                        return [value, name];
                      }} />
                      <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                      <Bar yAxisId="right" dataKey="fatigue" name="Fatigue" fill="#f59e0b" fillOpacity={0.5} radius={[4,4,0,0]} />
                      <Line yAxisId="left" type="monotone" dataKey="pace" name="Pace" stroke="#3b82f6" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#0f172a", stroke: "#3b82f6", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} animationDuration={1000} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-64 flex items-center justify-center text-[#475569]">No data for this category</div>}
            </div>

            {/* Chart 2 */}
            <div className="glass-card p-7">
              <h2 className="text-xl font-bold text-white mb-1">Lap Pace & HR Breakdown</h2>
              <p className="text-[#64748b] text-sm mb-6">Latest run — per-split pace degradation and heart rate drift</p>
              {lapData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lapData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="gPace" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gHR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                      <XAxis dataKey="split" stroke="#475569" axisLine={false} tickLine={false} dy={8} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="pace" stroke="#475569" axisLine={false} tickLine={false} dx={-6} domain={["auto","auto"]} reversed={true} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="hr" orientation="right" stroke="#475569" axisLine={false} tickLine={false} dx={6} domain={["auto","auto"]} tick={{ fontSize: 11 }} />
                      <Tooltip {...tipStyle} formatter={(value: any, name: any) => {
                        const valNum = Number(value);
                        if (name === "Pace") return [`${Math.floor(valNum/60)}:${(valNum%60).toString().padStart(2,"0")}/km`, name];
                        if (name === "Heart Rate") return [`${valNum} bpm`, name];
                        return [value, name];
                      }} />
                      <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                      <Area yAxisId="pace" type="monotone" dataKey="pace" name="Pace" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gPace)" animationDuration={1000} 
                        dot={{ r: 4, fill: "#0a0e1a", stroke: "#10b981", strokeWidth: 2 }} />
                      <Area yAxisId="hr" type="monotone" dataKey="hr" name="Heart Rate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#gHR)" animationDuration={1000}
                        dot={{ r: 4, fill: "#0a0e1a", stroke: "#f43f5e", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-64 flex items-center justify-center text-[#475569]">No lap data available</div>}
            </div>

            {/* Chart 3: Radar (all events only) */}
            {activeTab === "all" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-7">
                  <h2 className="text-xl font-bold text-white mb-1">Performance Radar</h2>
                  <p className="text-[#64748b] text-sm mb-6">Normalized multi-metric comparison</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                        <PolarGrid stroke="rgba(148,163,184,0.1)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Sprint" dataKey="sprint" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Mid" dataKey="mid" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                        <Radar name="Long" dataKey="long" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                        <Tooltip {...tipStyle} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-7">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-white">Session Correlations</h2>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      <Share2 className="w-3 h-3" /> Graph DFS/BFS
                    </div>
                  </div>
                  <p className="text-[#64748b] text-sm mb-6">Groups of training sessions with similar physiological profiles</p>
                  
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {clusters.map((cluster, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Cluster {idx + 1}</span>
                          <span className="text-[10px] text-[#475569]">{cluster.length} connected sessions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cluster.map(runId => {
                            const run = runs.find(r => r.id === runId);
                            if (!run) return null;
                            return (
                              <div key={runId} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-[#94a3b8]">
                                {run.date.split('-').slice(1).join('/')} • {run.distance}km
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {clusters.length === 0 && (
                      <div className="text-center py-12 text-[#475569] text-sm">
                        No significant correlations found between training sessions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
