"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePerformance, Verdict } from "@/lib/PerformanceContext";
import { Shield, Flame, Zap, Trophy, Brain, ChevronRight, Dumbbell, Send, Loader2, Bot, User } from "lucide-react";

const VERDICT_CONFIG: Record<Verdict, { label: string; sub: string; icon: typeof Shield; color: string; gradient: string }> = {
  recover: { label: "Recovery Phase", sub: "Your body is signalling fatigue. Prioritise sleep and light movement.", icon: Shield, color: "#f59e0b", gradient: "from-amber-500/20 to-orange-600/5" },
  maintain: { label: "Maintenance Phase", sub: "Training load is balanced. Consolidate fitness before escalating volume.", icon: Flame, color: "#3b82f6", gradient: "from-blue-500/20 to-indigo-600/5" },
  push: { label: "Progressive Overload", sub: "Fatigue is controlled. Safe to increase intensity or volume.", icon: Zap, color: "#10b981", gradient: "from-emerald-500/20 to-teal-600/5" },
  peak: { label: "Peak Performance", sub: "You are at a physiological high. Race or time-trial is optimal.", icon: Trophy, color: "#8b5cf6", gradient: "from-violet-500/20 to-purple-600/5" },
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function CoachPage() {
  const { analytics, latestRun } = usePerformance();
  const verdict = analytics.verdict;
  const cfg = VERDICT_CONFIG[verdict];
  const Icon = cfg.icon;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: `Hello! I'm your AI Coach. I'm currently analyzing your ${analytics.totalRuns} logged runs. Your fatigue index is at ${analytics.avgFatigue.toFixed(1)}%. How can I help you adjust your training today?` }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsg = inputMessage.trim();
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setInputMessage("");
    setIsTyping(true);

    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";
      const res = await fetch(`${aiUrl}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            verdict: analytics.verdict,
            avgFatigue: analytics.avgFatigue,
            weeklyDistanceKm: analytics.weeklyDistanceKm,
            paceTrend: analytics.paceTrend,
            lastRunHRZone: analytics.lastRunHRZone,
            lastRunLapDegradation: analytics.lastRunLapDegradation,
            totalRuns: analytics.totalRuns,
            latestRunWeakness: latestRun?.aiMetrics?.weakness || "None",
            latestRunSuggestion: latestRun?.aiMetrics?.suggestion || "None"
          }
        }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response || "No response received." }]);
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting to the AI service right now. Please make sure the backend is running." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-[#f1f5f9]">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Brain className="w-7 h-7 text-[#3b82f6]" />
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">AI Coach Chatbot</h1>
        </div>
        <p className="text-[#64748b] font-light">Interactive performance advice powered by Gemini.</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        {/* Left Panel: Context Overview */}
        <div className="space-y-4 lg:col-span-1">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} 
            className={`glass-card p-6 bg-gradient-to-br ${cfg.gradient} border-0`}
            style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${cfg.color}20`, boxShadow: `0 0 20px -5px ${cfg.color}` }}>
                <Icon className="w-6 h-6" style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#64748b] mb-0.5">AI Verdict</p>
                <h2 className="text-xl font-black text-white leading-tight">{cfg.label}</h2>
              </div>
            </div>
            <p className="text-[#94a3b8] text-sm mb-4">{cfg.sub}</p>
            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
              <span className="text-xs text-[#64748b] uppercase tracking-wider">Fatigue Index</span>
              <span className="font-bold text-lg" style={{ color: cfg.color }}>{analytics.avgFatigue.toFixed(0)}%</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pace Trend", value: analytics.paceTrend === "insufficient_data" ? "No Data" : analytics.paceTrend === "improving" ? `↑ Fast` : analytics.paceTrend === "degrading" ? `↓ Slow` : "Stable", color: analytics.paceTrend === "improving" ? "#10b981" : analytics.paceTrend === "degrading" ? "#f43f5e" : "#3b82f6" },
              { label: "HR Zone", value: analytics.lastRunHRZone, color: "#f43f5e" },
              { label: "Degradation", value: `${analytics.lastRunLapDegradation >= 0 ? "+" : ""}${analytics.lastRunLapDegradation.toFixed(1)}%`, color: analytics.lastRunLapDegradation > 5 ? "#f43f5e" : analytics.lastRunLapDegradation > 2 ? "#f59e0b" : "#10b981" },
              { label: "Weekly", value: `${analytics.weeklyDistanceKm.toFixed(1)} km`, color: "#8b5cf6" },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card p-4">
                <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">{m.label}</p>
                <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
              </motion.div>
            ))}
          </div>
          
          {latestRun?.aiMetrics && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-5 border border-[#3b82f6]/20 bg-[#3b82f6]/5">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="font-bold text-white text-sm">Last Run Insight</h3>
              </div>
              <p className="text-xs text-[#94a3b8] mb-2 leading-relaxed">
                <span className="font-semibold text-[#f1f5f9]">Weakness:</span> {latestRun.aiMetrics.weakness}
              </p>
              <p className="text-xs text-[#10b981] leading-relaxed">
                <span className="font-semibold text-[#f1f5f9]">Advice:</span> {latestRun.aiMetrics.suggestion}
              </p>
            </motion.div>
          )}
        </div>

        {/* Right Panel: Chatbot Interface */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-card flex flex-col overflow-hidden relative">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <h2 className="font-semibold text-white">Coach is Online</h2>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white" : "bg-white/10 text-white"}`}>
                    {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "user" 
                      ? "bg-[#3b82f6] text-white rounded-tr-sm" 
                      : "bg-white/5 border border-white/10 text-[#e2e8f0] rounded-tl-sm"
                  }`}>
                    {/* Render message with basic markdown support (new lines to br) */}
                    {msg.content.split('\n').map((line, k) => (
                      <span key={k}>
                        {line}
                        {k < msg.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5">
                  <motion.div className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about your performance or training plan..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 p-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#3b82f6]/50 disabled:cursor-not-allowed text-white transition-colors"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
