from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app)

# Firebase connection
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


@app.route("/")
def home():
    return jsonify({
        "message": "Open Banking Security Monitor Backend",
        "status": "running",
        "firebase": "connected"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "online",
        "message": "Backend and Firebase are working"
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():

    data = request.json

    endpoint = data.get("endpoint", "")
    third_party = data.get("third_party", "")
    amount = float(data.get("amount", 0))

    risk_score = 10
    reasons = []

    if "customer-data" in endpoint:
        risk_score += 40
        reasons.append("Sensitive customer data accessed")

    if third_party.lower() == "unknown partner":
        risk_score += 30
        reasons.append("Unknown third party")

    if amount > 50000:
        risk_score += 20
        reasons.append("High transaction amount")

    if risk_score >= 70:
        risk = "HIGH"
        status = "BLOCKED"

    elif risk_score >= 40:
        risk = "MEDIUM"
        status = "REVIEW"

    else:
        risk = "LOW"
        status = "SUCCESS"

    result = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "third_party": third_party,
        "endpoint": endpoint,
        "method": "GET",
        "risk": risk,
        "risk_score": risk_score,
        "status": status
    }

    # Save API request to Firestore
    db.collection("api_requests").add(result)

    # Save high-risk request as security alert
    if risk == "HIGH":

        alert = {
            "third_party": third_party,
            "endpoint": endpoint,
            "risk": risk,
            "risk_score": risk_score,
            "reason": ", ".join(reasons),
            "created_at": datetime.now()
        }

        db.collection("security_alerts").add(alert)

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)