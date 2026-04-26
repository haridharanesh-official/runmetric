"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";

export type LapData = {
  lapNumber: number;
  timeStr: string;
  duration: number;
  heartRate: number;
  paceStr: string;
};

export type RunData = {
  id: string;
  date: string;
  distance: number;
  timeStr: string;
  duration: number;
  avgPace: string;
  avgHeartRate: number;
  calories: number;
  fatigueIndex: number;
  laps: LapData[];
  eventCategory: EventCategory;
  aiMetrics?: any;
};

export type EventCategory = "sprint" | "mid" | "long";
export type Verdict = "recover" | "maintain" | "push" | "peak";
export type FatigueLevel = "low" | "moderate" | "high" | "extreme";
export type TrainingLoad = "low" | "optimal" | "high" | "overloaded";
export type PaceTrend = "improving" | "degrading" | "stable" | "insufficient_data";

export interface CategoryStats {
  count: number;
  totalDistanceKm: number;
  avgPaceSec: number;
  avgHeartRate: number;
  avgFatigue: number;
  bestPaceSec: number;
  worstPaceSec: number;
  avgSpeedMs: number;
}

export interface RunAnalytics {
  paceTrend: PaceTrend;
  paceChangePercent: number;
  lastRunLapDegradation: number;
  lastRunFatigueLevel: FatigueLevel;
  lastRunHRZone: string;
  lastRunAvgSpeedMs: number;
  daysSinceLastRun: number;
  suggestedRecoveryDays: number;
  weeklyRunCount: number;
  weeklyDistanceKm: number;
  trainingLoad: TrainingLoad;
  hrEfficiency: number;
  avgFatigue: number;
  totalRuns: number;
  verdict: Verdict;
  verdictReason: string;
  sprintStats: CategoryStats;
  midStats: CategoryStats;
  longStats: CategoryStats;
  acwr: number;
}

interface PerformanceContextType {
  runs: RunData[];
  analytics: RunAnalytics;
  latestRun: RunData | null;
  addRun: (run: Omit<RunData, "id" | "date" | "duration" | "avgPace" | "calories" | "fatigueIndex" | "eventCategory" | "aiMetrics">) => Promise<void>;
  clearData: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number).filter(n => !isNaN(n));
  if (parts.length === 1) return parts[0]; // SS
  if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  return 0;
};

const formatTime = (totalSeconds: number) => {
  const rounded = Math.round(totalSeconds);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const classifyEvent = (distanceKm: number): EventCategory => {
  if (distanceKm <= 0.8) return "sprint";
  if (distanceKm <= 3) return "mid";
  return "long";
};

export const EVENT_LABELS: Record<EventCategory, { label: string; range: string; color: string; icon: string }> = {
  sprint: { label: "Sprint", range: "≤ 800 m", color: "#f43f5e", icon: "⚡" },
  mid:    { label: "Mid-Distance", range: "800 m – 3 km", color: "#f59e0b", icon: "🔥" },
  long:   { label: "Long Distance", range: "> 3 km", color: "#10b981", icon: "🏃" },
};

const getHRZone = (hr: number): string => {
  if (hr < 114) return "Zone 1 — Recovery";
  if (hr < 133) return "Zone 2 — Aerobic Base";
  if (hr < 152) return "Zone 3 — Tempo";
  if (hr < 171) return "Zone 4 — Threshold";
  return "Zone 5 — VO₂ Max";
};

const getFatigueLevel = (fi: number): FatigueLevel => {
  if (fi <= 20) return "low";
  if (fi <= 40) return "moderate";
  if (fi <= 65) return "high";
  return "extreme";
};

const parsePaceToSec = (paceStr: string): number => {
  if (!paceStr || paceStr === "—") return 0;
  const cleanStr = paceStr.split("/")[0].trim();
  const parts = cleanStr.split(":").map(Number).filter(n => !isNaN(n));
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const emptyCategoryStats = (): CategoryStats => ({
  count: 0, totalDistanceKm: 0, avgPaceSec: 0, avgHeartRate: 0,
  avgFatigue: 0, bestPaceSec: Infinity, worstPaceSec: 0, avgSpeedMs: 0,
});

const computeCategoryStats = (runs: RunData[], cat: EventCategory): CategoryStats => {
  const filtered = runs.filter(r => r.eventCategory === cat);
  if (filtered.length === 0) return emptyCategoryStats();

  const count = filtered.length;
  const totalDistanceKm = filtered.reduce((a, r) => a + r.distance, 0);
  const paces = filtered.map(r => parsePaceToSec(r.avgPace)).filter(p => p > 0);
  
  const avgPaceSec = paces.length > 0 ? paces.reduce((a, p) => a + p, 0) / paces.length : 0;
  const avgHeartRate = Math.round(filtered.reduce((a, r) => a + r.avgHeartRate, 0) / count);
  const avgFatigue = parseFloat((filtered.reduce((a, r) => a + r.fatigueIndex, 0) / count).toFixed(1));
  const bestPaceSec = paces.length > 0 ? Math.min(...paces) : Infinity;
  const worstPaceSec = paces.length > 0 ? Math.max(...paces) : 0;
  const totalDuration = filtered.reduce((a, r) => a + r.duration, 0);
  const avgSpeedMs = totalDuration > 0 ? (totalDistanceKm * 1000) / totalDuration : 0;

  return { count, totalDistanceKm, avgPaceSec, avgHeartRate, avgFatigue, bestPaceSec, worstPaceSec, avgSpeedMs };
};

const computeAnalytics = (runs: RunData[]): RunAnalytics => {
  const base: RunAnalytics = {
    paceTrend: "insufficient_data", paceChangePercent: 0, lastRunLapDegradation: 0,
    lastRunFatigueLevel: "low", lastRunHRZone: "N/A", lastRunAvgSpeedMs: 0,
    daysSinceLastRun: 0, suggestedRecoveryDays: 1, weeklyRunCount: 0, weeklyDistanceKm: 0,
    trainingLoad: "low", hrEfficiency: 0, avgFatigue: 0, totalRuns: 0,
    verdict: "maintain", verdictReason: "Log your first run to get personalised AI directives.",
    sprintStats: emptyCategoryStats(), midStats: emptyCategoryStats(), longStats: emptyCategoryStats(),
    acwr: 0,
  };

  if (runs.length === 0) return base;

  const latestRun = runs[0];
  const now = Date.now();

  let paceTrend: PaceTrend = "insufficient_data";
  let paceChangePercent = 0;
  if (runs.length >= 2) {
    const oldest = runs[runs.length - 1];
    const oldP = parsePaceToSec(oldest.avgPace);
    const newP = parsePaceToSec(latestRun.avgPace);
    if (oldP > 0) {
      paceChangePercent = ((newP - oldP) / oldP) * 100;
      paceTrend = Math.abs(paceChangePercent) < 2 ? "stable" : paceChangePercent < 0 ? "improving" : "degrading";
    }
  }

  let lastRunLapDegradation = 0;
  if (latestRun.laps.length >= 2) {
    const f = latestRun.laps[0].duration || parseTime(latestRun.laps[0].timeStr);
    const l = latestRun.laps[latestRun.laps.length - 1].duration || parseTime(latestRun.laps[latestRun.laps.length - 1].timeStr);
    if (f > 0) lastRunLapDegradation = ((l - f) / f) * 100;
  }

  const lastRunFatigueLevel = getFatigueLevel(latestRun.fatigueIndex);
  const lastRunHRZone = getHRZone(latestRun.avgHeartRate);
  const lastRunAvgSpeedMs = latestRun.duration > 0 ? (latestRun.distance * 1000) / latestRun.duration : 0;
  const hrEfficiency = latestRun.avgHeartRate > 0 ? lastRunAvgSpeedMs / latestRun.avgHeartRate : 0;
  const daysSinceLastRun = Math.floor((now - new Date(latestRun.date).getTime()) / 86400000);

  const oneWeekAgo = now - 7 * 86400000;
  const fourWeeksAgo = now - 28 * 86400000;
  const weeklyRuns = runs.filter(r => new Date(r.date).getTime() > oneWeekAgo);
  const weeklyRunCount = weeklyRuns.length;
  const weeklyDistanceKm = weeklyRuns.reduce((a, r) => a + r.distance, 0);
  
  const fourWeekRuns = runs.filter(r => new Date(r.date).getTime() > fourWeeksAgo);
  const fourWeekDistanceKm = fourWeekRuns.reduce((a, r) => a + r.distance, 0);
  
  // Normalise Chronic Load for new users (less than 4 weeks of data)
  const firstRunDate = new Date(runs[runs.length - 1].date).getTime();
  const weeksSinceStart = Math.max(1, Math.min(4, Math.ceil((now - firstRunDate) / (7 * 86400000))));
  
  const acuteLoad = weeklyDistanceKm;
  const chronicLoad = fourWeekDistanceKm / weeksSinceStart;
  const acwr = (chronicLoad > 0) ? parseFloat((acuteLoad / chronicLoad).toFixed(2)) : 0;

  let trainingLoad: TrainingLoad = "low";
  if (weeklyDistanceKm >= 60) trainingLoad = "overloaded";
  else if (weeklyDistanceKm >= 40) trainingLoad = "high";
  else if (weeklyDistanceKm >= 20) trainingLoad = "optimal";

  let suggestedRecoveryDays = 1;
  if (lastRunFatigueLevel === "extreme") suggestedRecoveryDays = 3;
  else if (lastRunFatigueLevel === "high") suggestedRecoveryDays = 2;
  else if (trainingLoad === "overloaded") suggestedRecoveryDays = 2;

  const avgFatigue = runs.reduce((a, r) => a + r.fatigueIndex, 0) / runs.length;

  let verdict: Verdict = "maintain";
  let verdictReason = "";
  if (lastRunFatigueLevel === "extreme") {
    verdict = "recover";
    verdictReason = `Your last run fatigue index was critical (${latestRun.fatigueIndex}%). Mandatory recovery protocol required.`;
  } else if (trainingLoad === "overloaded") {
    verdict = "recover";
    verdictReason = `${weeklyDistanceKm.toFixed(1)} km this week — above the safe adaptive threshold. Reduce volume.`;
  } else if (daysSinceLastRun === 0 && lastRunFatigueLevel === "high") {
    verdict = "recover";
    verdictReason = `You ran today with high fatigue (${latestRun.fatigueIndex}%). Allow ${suggestedRecoveryDays} days before the next hard effort.`;
  } else if (paceTrend === "improving" && lastRunFatigueLevel === "low" && trainingLoad === "optimal") {
    verdict = "peak";
    verdictReason = `Pace improved ${Math.abs(paceChangePercent).toFixed(1)}% and fatigue is controlled. Schedule a race or time trial.`;
  } else if (lastRunFatigueLevel === "low" && trainingLoad !== "high") {
    verdict = "push";
    verdictReason = `Fatigue is low (${latestRun.fatigueIndex}%) and weekly load has room. Progressive overload is safe.`;
  } else if (paceTrend === "degrading") {
    verdict = "maintain";
    verdictReason = `Pace slowed ${paceChangePercent.toFixed(1)}%. Consolidate before increasing load.`;
  } else {
    verdict = "maintain";
    verdictReason = `Training load is ${trainingLoad}, fatigue is ${lastRunFatigueLevel}. Maintain volume, focus on quality.`;
  }

  return {
    paceTrend, paceChangePercent, lastRunLapDegradation,
    lastRunFatigueLevel, lastRunHRZone, lastRunAvgSpeedMs,
    daysSinceLastRun, suggestedRecoveryDays,
    weeklyRunCount, weeklyDistanceKm, trainingLoad,
    hrEfficiency, avgFatigue, totalRuns: runs.length,
    verdict, verdictReason,
    sprintStats: computeCategoryStats(runs, "sprint"),
    midStats: computeCategoryStats(runs, "mid"),
    longStats: computeCategoryStats(runs, "long"),
    acwr,
  };
};

const initialMockRuns: RunData[] = [
  {
    id: "run-s1", date: new Date(Date.now() - 86400000 * 5).toISOString(),
    distance: 0.4, timeStr: "00:52", duration: 52,
    avgPace: "02:10", avgHeartRate: 178, calories: 42, fatigueIndex: 35,
    eventCategory: "sprint",
    laps: [
      { lapNumber: 1, timeStr: "00:25", duration: 25, heartRate: 172, paceStr: "02:05" },
      { lapNumber: 2, timeStr: "00:27", duration: 27, heartRate: 184, paceStr: "02:15" },
    ],
  },
  {
    id: "run-m1", date: new Date(Date.now() - 86400000 * 4).toISOString(),
    distance: 1.5, timeStr: "05:48", duration: 348,
    avgPace: "03:52", avgHeartRate: 172, calories: 130, fatigueIndex: 42,
    eventCategory: "mid",
    laps: [
      { lapNumber: 1, timeStr: "03:45", duration: 225, heartRate: 168, paceStr: "03:45" },
      { lapNumber: 2, timeStr: "02:03", duration: 123, heartRate: 176, paceStr: "04:06" },
    ],
  },
  {
    id: "run-001", date: new Date(Date.now() - 86400000 * 2).toISOString(),
    distance: 5.0, timeStr: "25:30", duration: 1530,
    avgPace: "05:06", avgHeartRate: 155, calories: 420, fatigueIndex: 12,
    eventCategory: "long",
    laps: [
      { lapNumber: 1, timeStr: "05:00", duration: 300, heartRate: 140, paceStr: "05:00" },
      { lapNumber: 2, timeStr: "05:05", duration: 305, heartRate: 152, paceStr: "05:05" },
      { lapNumber: 3, timeStr: "05:10", duration: 310, heartRate: 158, paceStr: "05:10" },
      { lapNumber: 4, timeStr: "05:12", duration: 312, heartRate: 161, paceStr: "05:12" },
      { lapNumber: 5, timeStr: "05:03", duration: 303, heartRate: 165, paceStr: "05:03" },
    ],
  },
  {
    id: "run-002", date: new Date(Date.now() - 86400000).toISOString(),
    distance: 8.0, timeStr: "42:15", duration: 2535,
    avgPace: "05:16", avgHeartRate: 160, calories: 650, fatigueIndex: 25,
    eventCategory: "long",
    laps: [
      { lapNumber: 1, timeStr: "05:10", duration: 310, heartRate: 145, paceStr: "05:10" },
      { lapNumber: 2, timeStr: "05:15", duration: 315, heartRate: 155, paceStr: "05:15" },
      { lapNumber: 3, timeStr: "05:12", duration: 312, heartRate: 158, paceStr: "05:12" },
      { lapNumber: 4, timeStr: "05:18", duration: 318, heartRate: 162, paceStr: "05:18" },
      { lapNumber: 5, timeStr: "05:20", duration: 320, heartRate: 165, paceStr: "05:20" },
      { lapNumber: 6, timeStr: "05:22", duration: 322, heartRate: 168, paceStr: "05:22" },
      { lapNumber: 7, timeStr: "05:15", duration: 315, heartRate: 166, paceStr: "05:15" },
      { lapNumber: 8, timeStr: "05:23", duration: 323, heartRate: 170, paceStr: "05:23" },
    ],
    aiMetrics: {
      fatigue_index: 25.0,
      predicted_race_times: {
        "5K": 1500,
        "10K": 3100,
        "Half Marathon": 6900,
        "Marathon": 14500
      },
      metrics: {
        vo2_max_est: 48.5,
        lactate_threshold_est: 12.5,
        efficiency_score: 92.0
      }
    }
  },
];

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  
  const [runs, setRuns] = useState<RunData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (token) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/performance/history`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const history = await res.json();
            setRuns(history);
            setIsLoaded(true);
            return;
          }
        } catch (err) {
          console.error("Failed to fetch history:", err);
        }
      }
      
      const stored = localStorage.getItem("athlete_runs_v2");
      setRuns(stored ? JSON.parse(stored) : initialMockRuns);
      setIsLoaded(true);
    };

    loadData();
  }, [token]);

  const analytics = useMemo(() => computeAnalytics(runs), [runs]);
  const latestRun = runs[0] ?? null;

  const addRun = async (runInput: Omit<RunData, "id" | "date" | "duration" | "avgPace" | "calories" | "fatigueIndex" | "eventCategory" | "aiMetrics">) => {
    const duration = parseTime(runInput.timeStr);
    const avgPaceSec = duration / runInput.distance;
    const avgPace = formatTime(avgPaceSec);
    const calories = Math.round(runInput.distance * 70 * 1.036);
    const eventCategory = classifyEvent(runInput.distance);
    const processedLaps = runInput.laps.map(lap => ({ ...lap, duration: lap.duration || parseTime(lap.timeStr) }));

    if (token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/performance/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            distance: runInput.distance,
            timeStr: runInput.timeStr,
            duration,
            avgPace,
            avgHeartRate: runInput.avgHeartRate,
            calories,
            eventCategory,
            laps: processedLaps
          })
        });
        if (res.ok) {
          const { performance } = await res.json();
          setRuns(prev => [performance, ...prev]);
          return;
        }
      } catch (err) {
        console.error("Failed to save run to backend:", err);
      }
    }

    // Fallback to local storage and manual AI call if not authenticated or backend fails
    let fatigueIndex = Math.max(0, Math.min(100, Math.round(((runInput.avgHeartRate - 120) / 80) * 100)));
    let aiMetrics = undefined;

    try {
      const splits = processedLaps.map(l => l.duration);
      const aiUrl = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";
      const res = await fetch(`${aiUrl}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distance: runInput.distance, totalTime: duration, splits })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.fatigue_index !== undefined) {
          fatigueIndex = data.fatigue_index;
          aiMetrics = data;
        }
      }
    } catch (err) {
      console.warn("Could not reach Python AI service. Using fallback analysis.", err);
    }

    const newRun: RunData = {
      ...runInput, laps: processedLaps, id: `run-${Date.now()}`,
      date: new Date().toISOString(), duration, avgPace, calories, fatigueIndex, eventCategory,
      aiMetrics
    };
    const updatedRuns = [newRun, ...runs];
    setRuns(updatedRuns);
    localStorage.setItem("athlete_runs_v2", JSON.stringify(updatedRuns));
  };

  const clearData = () => {
    localStorage.removeItem("athlete_runs_v2");
    setRuns(initialMockRuns);
  };

  if (!isLoaded) return null;

  return (
    <PerformanceContext.Provider value={{ runs, analytics, latestRun, addRun, clearData }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) throw new Error("usePerformance must be used within a PerformanceProvider");
  return context;
};
