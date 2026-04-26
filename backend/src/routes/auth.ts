import express from "express";
import { User } from "../models/User";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/register", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      user = new User({
        firebaseUid: req.user.uid,
        email: req.user.email,
        name: name || req.user.name || "Unknown"
      });
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register." });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
