"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, List, ArrowDownWideNarrow, Play, RefreshCw, 
  ChevronRight, Circle, Network
} from "lucide-react";

// Types
type AlgorithmType = "sorting" | "linkedlist" | "graph";

export default function DSAPage() {
  const [activeTab, setActiveTab] = useState<AlgorithmType>("sorting");
  const [loading, setLoading] = useState(false);
  const [sortingData, setSortingData] = useState<number[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [listData, setListData] = useState<any>(null);

  useEffect(() => {
    generateRandomData();
  }, []);

  const generateRandomData = () => {
    setSortingData(Array.from({ length: 15 }, () => Math.floor(Math.random() * 80) + 10));
  };

  const runAlgorithm = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "sorting" ? "test-sorting" : 
                       activeTab === "linkedlist" ? "test-linkedlist" : "test-graph";
      
      const res = await fetch(`http://localhost:5000/api/dsa/${endpoint}`);
      const data = await res.json();
      
      if (activeTab === "sorting") setSortingData(data.quickSort);
      if (activeTab === "linkedlist") setListData(data);
      if (activeTab === "graph") setGraphData(data);
    } catch (err) {
      console.error("Failed to run algorithm:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-[#f1f5f9]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
          DSA Laboratory
        </h1>
        <p className="text-[#64748b] mt-1 font-light">Interactive data structure and algorithm visualizer.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/8 w-fit">
        {[
          { id: "sorting", label: "Sorting", icon: ArrowDownWideNarrow },
          { id: "linkedlist", label: "Linked List", icon: List },
          { id: "graph", label: "Graph", icon: Network },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AlgorithmType)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active 
                  ? "bg-white/10 text-white shadow-xl border border-white/10" 
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Visualization Area */}
        <motion.div 
          layout
          className="lg:col-span-3 glass-card p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeTab === "sorting" && (
              <motion.div 
                key="sorting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-end gap-2 w-full max-w-2xl h-64"
              >
                {sortingData.map((val, i) => (
                  <motion.div
                    key={i}
                    layout
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-[#3b82f6] to-[#8b5cf6]"
                    style={{ height: `${val}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === "linkedlist" && (
              <motion.div 
                key="linkedlist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                {(listData?.singlyLinkedList || ["Head", "Node 1", "Node 2", "Tail"]).map((node: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center shadow-xl"
                    >
                      <span className="text-xs text-[#64748b] uppercase font-bold mb-1">Value</span>
                      <span className="text-lg font-mono font-bold text-white">{node}</span>
                    </motion.div>
                    {i < 3 && <ChevronRight className="text-[#3b82f6] w-6 h-6 animate-pulse" />}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "graph" && (
              <motion.div 
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-80 flex items-center justify-center"
              >
                {/* Simplified Graph Representation */}
                <div className="grid grid-cols-3 gap-12">
                  {["A", "B", "C", "D", "E", "F"].map((node, i) => (
                    <motion.div
                      key={node}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563eb] to-[#7c3aed] flex items-center justify-center text-xl font-bold border-4 border-[#0a0e1a] shadow-2xl relative z-10"
                    >
                      {node}
                    </motion.div>
                  ))}
                </div>
                {/* SVG Connections could be added here for a better graph visual */}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls Panel */}
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold mb-4">Controls</h2>
            <div className="space-y-4">
              <button
                onClick={generateRandomData}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Randomize Data
              </button>
              <button
                onClick={runAlgorithm}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run Algorithm
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 flex-1"
          >
            <h2 className="text-xl font-bold mb-2">Algorithm Specs</h2>
            <div className="space-y-4 text-sm text-[#94a3b8]">
              {activeTab === "sorting" && (
                <>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-white font-semibold">QuickSort</p>
                    <p className="text-xs">Time: O(n log n) · Space: O(log n)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-white font-semibold">MergeSort</p>
                    <p className="text-xs">Time: O(n log n) · Space: O(n)</p>
                  </div>
                </>
              )}
              {activeTab === "linkedlist" && (
                <p>Demonstrates a sequential chain of nodes. Singly linked list supports forward traversal, while Doubly supports bi-directional.</p>
              )}
              {activeTab === "graph" && (
                <p>Visualizing BFS and DFS traversals on a 6-node adjacency list graph.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
