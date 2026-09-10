"""
Behavioral Anomaly Detector
----------------------------
Detects when a FinTech app (FIU) behaves abnormally compared to its
historical baseline — e.g. sudden spike in requests, accounts accessed,
or data volume.

Run this file directly to test it end-to-end with dummy data:
    python behavioral_detector.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from sklearn.ensemble import IsolationForest


def generate_dummy_logs(n=2000):
    fius = ["MoneyTracker", "BudgetBuddy", "LoanEasy", "InvestPro"]
    logs = []
    start = datetime(2026, 9, 1)

    for i in range(n):
        fiu = random.choice(fius)
        ts = start + timedelta(minutes=random.randint(0, 10000))
        logs.append({
            "fiu_name": fiu,
            "account_id": f"ACC{random.randint(1, 50):03d}",
            "timestamp": ts,
            "records_fetched": random.randint(5, 60),
            "ip_address": f"103.21.45.{random.randint(1, 20)}",
            "auth_success": True
        })

    for i in range(15):
        ts = start + timedelta(minutes=random.randint(0, 10000))
        logs.append({
            "fiu_name": "MoneyTracker",
            "account_id": f"ACC{random.randint(1, 50):03d}",
            "timestamp": ts,
            "records_fetched": random.randint(500, 2000),
            "ip_address": f"45.9.9.{random.randint(1, 5)}",
            "auth_success": True
        })

    return pd.DataFrame(logs)


class BehavioralAnomalyDetector:
    def __init__(self, contamination=0.05):
        self.model = None
        self.feature_cols = [
            'requests_per_hour', 'unique_accounts',
            'avg_records', 'max_records', 'unique_ips'
        ]
        self.contamination = contamination

    def build_features(self, df):
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour_window'] = df['timestamp'].dt.floor('h')

        features = df.groupby(['fiu_name', 'hour_window']).agg(
            requests_per_hour=('account_id', 'count'),
            unique_accounts=('account_id', 'nunique'),
            avg_records=('records_fetched', 'mean'),
            max_records=('records_fetched', 'max'),
            unique_ips=('ip_address', 'nunique')
        ).reset_index()

        return features

    def fit(self, df):
        features = self.build_features(df)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )
        self.model.fit(features[self.feature_cols])
        return features

    def detect(self, df):
        features = self.build_features(df)
        features['anomaly_score'] = self.model.decision_function(features[self.feature_cols])
        features['is_anomaly'] = self.model.predict(features[self.feature_cols])
        return self._generate_alerts(features)

    def _generate_alerts(self, features_df):
        anomalies = features_df[features_df['is_anomaly'] == -1].copy()
        if anomalies.empty:
            return []

        min_score = features_df['anomaly_score'].min()
        max_score = features_df['anomaly_score'].max()
        denom = (max_score - min_score) if max_score != min_score else 1

        anomalies['risk_score'] = ((max_score - anomalies['anomaly_score']) / denom * 100).round(1)

        alerts = []
        for _, row in anomalies.iterrows():
            alerts.append({
                "detector": "Behavioral Anomaly",
                "fiu_name": row['fiu_name'],
                "time_window": str(row['hour_window']),
                "risk_score": row['risk_score'],
                "reason": (
                    f"Unusual activity: {row['requests_per_hour']} requests, "
                    f"{row['unique_accounts']} accounts, "
                    f"avg {row['avg_records']:.0f} records/request"
                ),
                "severity": "High" if row['risk_score'] > 75 else "Medium"
            })
        return alerts


if __name__ == "__main__":
    print("Generating dummy log data...")
    df = generate_dummy_logs()
    print(f"Generated {len(df)} log rows.\n")

    print("Training detector on this data...")
    detector = BehavioralAnomalyDetector(contamination=0.05)
    detector.fit(df)
    print("Training complete.\n")

    print("Running detection...")
    alerts = detector.detect(df)

    print(f"\nFound {len(alerts)} anomaly alert(s):\n")
    for a in alerts:
        print(a)