from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PerformanceData(BaseModel):
    distance: float
    totalTime: float
    splits: list[float]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: dict

@app.get("/")
def read_root():
    return {"message": "AI Coach Service API"}

@app.post("/api/ai/analyze")
def analyze_performance(data: PerformanceData):
    if not data.splits or len(data.splits) < 2:
        return {
            "fatigue_index": 0.0,
            "weakness": "Insufficient split data",
            "suggestion": "Record at least 2 laps to get deep physiological insights.",
            "metrics": {
                "vo2_max_est": 0,
                "lactate_threshold_est": 0,
                "efficiency_score": 0
            }
        }

    # Convert splits to numpy for calculations
    splits = np.array(data.splits)
    avg_pace = data.totalTime / data.distance if data.distance > 0 else 0
    
    # 1. Improved Fatigue Index (Variance + Trend)
    # How much did the pace drift from the start?
    first_split = splits[0]
    last_split = splits[-1]
    drift = (last_split - first_split) / first_split * 100
    
    # Variability (Consistency)
    variability = np.std(splits) / np.mean(splits) * 100
    
    # Final Fatigue Index (weighted)
    fatigue_index = round(max(0, (drift * 0.7) + (variability * 0.3)), 2)
    
    # 2. VO2 Max Estimation (Storer or simple Cooper approximation)
    # Using a simplified model based on pace and distance
    # VO2max = (distance_in_meters - 504.9) / 44.73
    # We'll adapt this for the run duration
    speed_kph = (data.distance / (data.totalTime / 3600)) if data.totalTime > 0 else 0
    vo2_max_est = round(speed_kph * 3.5, 1) # Very rough heuristic: Speed (km/h) * 3.5
    
    # 3. Lactate Threshold Estimation (Heuristic: ~85-90% of max speed sustained)
    lactate_threshold_est = round(speed_kph * 0.88, 2)
    
    # 4. Efficiency Score (Consistency over time)
    efficiency_score = round(100 - variability, 1)

    # Anomaly Detection (Extreme pace drops)
    median_split = np.median(splits)
    anomalies = np.where(splits > median_split * 1.25)[0] # 25% slower than median
    
    weakness = "None"
    suggestion = "Maintain your current training volume."
    
    if fatigue_index > 15:
        weakness = f"High pace degradation ({fatigue_index}%). Anaerobic capacity reached early."
        suggestion = "Focus on interval training at threshold pace to improve lactate clearance."
    elif variability > 10:
        weakness = "Inconsistent pacing (high variance)."
        suggestion = "Work on rhythm drills and maintain a steady cadence."
    elif speed_kph < 10 and data.distance > 5:
        weakness = "Low aerobic base for this distance."
        suggestion = "Increase weekly volume with Zone 2 base runs."
    else:
        suggestion = "Excellent pacing! Consider increasing intensity in your next session."

    if len(anomalies) > 0:
        weakness += f" Anomaly detected at split {anomalies[0] + 1}."

    # Data Science: Race Time Prediction (Peter Riegel's Formula)
    # T2 = T1 * (D2 / D1)^1.06
    # Where D is in km and T is in seconds
    t1 = data.totalTime
    d1 = data.distance
    
    predictions = {}
    if d1 > 0 and t1 > 0:
        target_distances = {
            "5K": 5.0,
            "10K": 10.0,
            "Half Marathon": 21.0975,
            "Marathon": 42.195
        }
        for race, d2 in target_distances.items():
            # Only predict for distances greater than or equal to current run distance, or at least predict all if d1 >= 1
            t2 = t1 * ((d2 / d1) ** 1.06)
            predictions[race] = int(t2) # store as total seconds

    return {
        "fatigue_index": fatigue_index,
        "weakness": weakness,
        "suggestion": suggestion,
        "anomalies_found": len(anomalies),
        "predicted_race_times": predictions,
        "metrics": {
            "vo2_max_est": vo2_max_est,
            "lactate_threshold_est": lactate_threshold_est,
            "efficiency_score": efficiency_score,
            "avg_speed_kph": round(speed_kph, 2),
            "pacing_strategy": "Positive Split" if drift > 5 else "Negative Split" if drift < -5 else "Even Split"
        }
    }

@app.post("/api/ai/chat")
def chat_with_coach(req: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "paste_your_gemini_api_key_here":
        return {
            "response": "I see you're trying to reach your AI Coach. To unlock personalized conversational insights, please add your Gemini API key to the `ai-service/.env` file."
        }

    try:
        client = genai.Client(api_key=api_key)
        
        # Build the system instruction using the athlete's context
        system_instruction = (
            "You are an elite AI running coach for AthleteOS. "
            "You provide concise, actionable, and encouraging advice based on the athlete's data.\n\n"
            f"Current Athlete Context: {req.context}\n\n"
            "Keep your responses focused, use bullet points if helpful, and always relate your advice back to their specific metrics like fatigue index, recent pace trends, or weekly volume."
        )

        # Convert the history into the format expected by google-genai
        contents = []
        for msg in req.messages:
            # Map roles if necessary, though 'user' and 'model' are standard
            role = "model" if msg.role == "assistant" else "user"
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
            )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
            ),
        )
        return {"response": response.text}
    except Exception as e:
        print(f"Chat API Error: {e}")
        return {"response": "Sorry, I encountered an error processing your request. Please try again later."}
