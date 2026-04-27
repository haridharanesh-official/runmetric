import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from "./routes/auth";
import athleteRoutes from "./routes/athlete";
import performanceRoutes from "./routes/performance";
import dsaRoutes from "./routes/dsa";

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api/athlete", athleteRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/dsa", dsaRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Athlete Performance Analytics API");
});

// Export for Vercel
export default app;

// Start Server & Connect to DB
const startServer = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (dbUri) {
      await mongoose.connect(dbUri);
      console.log("Connected to MongoDB");
    } else {
      console.warn("MONGODB_URI not provided. Skipping DB connection.");
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
  }
};

startServer();
