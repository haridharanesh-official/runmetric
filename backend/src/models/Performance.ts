import mongoose, { Document, Schema } from "mongoose";

export interface IPerformance extends Document {
  athleteId: mongoose.Types.ObjectId;
  date: Date;
  distance: number; // in km
  timeStr: string;
  duration: number; // in seconds
  avgPace: string;
  avgHeartRate: number;
  calories: number;
  fatigueIndex: number;
  eventCategory: "sprint" | "mid" | "long";
  laps: {
    lapNumber: number;
    timeStr: string;
    duration: number;
    heartRate: number;
    paceStr: string;
  }[];
}

const PerformanceSchema: Schema = new Schema({
  athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
  date: { type: Date, default: Date.now },
  distance: { type: Number, required: true },
  timeStr: { type: String, required: true },
  duration: { type: Number, required: true },
  avgPace: { type: String, required: true },
  avgHeartRate: { type: Number, required: true },
  calories: { type: Number, required: true },
  fatigueIndex: { type: Number, default: 0 },
  eventCategory: { type: String, enum: ["sprint", "mid", "long"], required: true },
  laps: [
    {
      lapNumber: { type: Number },
      timeStr: { type: String },
      duration: { type: Number },
      heartRate: { type: Number },
      paceStr: { type: String },
    },
  ],
});

export const Performance = mongoose.model<IPerformance>("Performance", PerformanceSchema);

