import express from "express";
import { Athlete } from "../models/Athlete";
import { User } from "../models/User";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/profile", verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const athlete = await Athlete.findOne({ userId: user._id });
    res.status(200).json(athlete);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { age, sport, heightCm, weightKg } = req.body;
    let athlete = await Athlete.findOne({ userId: user._id });
    if (athlete) {
      athlete.age = age ?? athlete.age;
      athlete.sport = sport ?? athlete.sport;
      athlete.heightCm = heightCm ?? athlete.heightCm;
      athlete.weightKg = weightKg ?? athlete.weightKg;
      await athlete.save();
    } else {
      athlete = new Athlete({ userId: user._id, age, sport, heightCm, weightKg });
      await athlete.save();
    }
    res.status(200).json(athlete);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
