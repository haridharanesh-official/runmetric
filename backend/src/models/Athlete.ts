import mongoose, { Document, Schema } from "mongoose";

export interface IAthlete extends Document {
  userId: mongoose.Types.ObjectId;
  age: number;
  sport: string;
  heightCm: number;
  weightKg: number;
}

const AthleteSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  age: { type: Number, required: true },
  sport: { type: String, required: true },
  heightCm: { type: Number },
  weightKg: { type: Number }
});

export const Athlete = mongoose.model<IAthlete>("Athlete", AthleteSchema);
