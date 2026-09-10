"""
FastAPI server for the Behavioral Anomaly Detector.

Exposes a /alerts endpoint that runs the detector and returns
its findings as JSON, so the React frontend can fetch and display
them live.

Run this file with:
    uvicorn api:app --reload --port 8000

Then visit http://localhost:8000/alerts in your browser to test it,
or http://localhost:8000/docs for interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from behavioral_detector import generate_dummy_logs, BehavioralAnomalyDetector

app = FastAPI(title="SentinelAA - Behavioral Anomaly API")

# CORS lets the React app (running on a different port, localhost:5173)
# make requests to this API (running on localhost:8000). Without this,
# the browser blocks the request for security reasons.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon speed; in production you'd restrict this
    allow_methods=["*"],
    allow_headers=["*"],
)

# Train the detector once when the server starts, so every request
# doesn't have to retrain the model from scratch (slow).
print("Starting up: generating data and training detector...")
_df = generate_dummy_logs()
_detector = BehavioralAnomalyDetector(contamination=0.05, min_risk_score=60)
_detector.fit(_df)
print("Detector ready.")


@app.get("/")
def root():
    return {"status": "SentinelAA Behavioral Anomaly API is running"}


@app.get("/alerts")
def get_alerts():
    """Returns the current list of detected behavioral anomaly alerts."""
    alerts = _detector.detect(_df)
    return {"count": len(alerts), "alerts": alerts}


@app.get("/simulate-attack")
def simulate_attack():
    """Regenerates a fresh batch of data (with new random attacks) and
    returns freshly detected alerts. Useful as a 'demo trigger' button."""
    global _df
    _df = generate_dummy_logs()
    _detector.fit(_df)
    alerts = _detector.detect(_df)
    return {"count": len(alerts), "alerts": alerts}