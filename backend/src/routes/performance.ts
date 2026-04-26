import express from "express";

import { Performance } from "../models/Performance";
import { Athlete } from "../models/Athlete";
import { User } from "../models/User";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

router.post("/add", verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const athlete = await Athlete.findOne({ userId: user._id });
    if (!athlete) return res.status(404).json({ message: "Athlete profile not found" });

    const { distance, timeStr, avgHeartRate, laps, duration, avgPace, calories, eventCategory } = req.body;

    // Call AI Service
    let fatigueIndex = 0;
    let aiInsights = null;
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          distance, 
          totalTime: duration, 
          splits: laps.map((l: any) => l.duration) 
        })
      });
      aiInsights = await response.json();
      fatigueIndex = aiInsights.fatigue_index;
    } catch (aiError) {
      console.error("AI Service call failed:", aiError);
    }

    const performance = new Performance({
      athleteId: athlete._id,
      distance,
      timeStr,
      duration,
      avgPace,
      avgHeartRate,
      calories,
      fatigueIndex,
      eventCategory,
      laps
    });
    await performance.save();

    res.status(201).json({ performance, aiInsights });
  } catch (error) {
    console.error("Error adding performance:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/history", verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const athlete = await Athlete.findOne({ userId: user._id });
    if (!athlete) return res.status(404).json({ message: "Athlete profile not found" });

    const history = await Performance.find({ athleteId: athlete._id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
