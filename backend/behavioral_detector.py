"""
Behavioral Anomaly Detector (v2 - realistic simulator)
--------------------------------------------------------
Detects when a FinTech app (FIU) behaves abnormally compared to its
own historical baseline.

Key upgrade from v1: each simulated app now has its own realistic
"personality" (normal volume, active hours, typical data size) instead
of pure randomness. This makes anomalies clearly stand out, which is
much stronger for a live demo.

Run this file directly to test it end-to-end:
    python behavioral_detector.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from sklearn.ensemble import IsolationForest


# ---------------------------------------------------------------------
# STEP A: Realistic data simulator
# ---------------------------------------------------------------------

APP_PROFILES = {
    "MoneyTracker": {
        "active_hours": list(range(7, 23)),
        "requests_per_active_hour": (3, 10),
        "records_per_request": (10, 60),
        "accounts_pool": 60,
    },
    "BudgetBuddy": {
        "active_hours": list(range(8, 21)),
        "requests_per_active_hour": (2, 8),
        "records_per_request": (5, 40),
        "accounts_pool": 40,
    },
    "LoanEasy": {
        "active_hours": list(range(9, 18)),
        "requests_per_active_hour": (1, 6),
        "records_per_request": (10, 50),
        "accounts_pool": 30,
    },
    "InvestPro": {
        "active_hours": list(range(6, 22)),
        "requests_per_active_hour": (2, 7),
        "records_per_request": (15, 70),
        "accounts_pool": 50,
    },
}

DAYS_OF_HISTORY = 10
START_DATE = datetime(2026, 9, 1)


def _random_ip(normal=True):
    if normal:
        return f"103.21.45.{random.randint(1, 20)}"
    return f"45.9.9.{random.randint(1, 5)}"


def generate_normal_logs():
    logs = []
    for day in range(DAYS_OF_HISTORY):
        for hour in range(24):
            ts_base = START_DATE + timedelta(days=day, hours=hour)
            for fiu, profile in APP_PROFILES.items():
                if hour not in profile["active_hours"]:
                    continue

                n_requests = random.randint(*profile["requests_per_active_hour"])
                for _ in range(n_requests):
                    ts = ts_base + timedelta(minutes=random.randint(0, 59))
                    logs.append({
                        "fiu_name": fiu,
                        "account_id": f"ACC{random.randint(1, profile['accounts_pool']):03d}",
                        "timestamp": ts,
                        "records_fetched": random.randint(*profile["records_per_request"]),
                        "ip_address": _random_ip(normal=True),
                        "auth_success": True
                    })
    return logs


def inject_attack_patterns(logs):
    attack_day = 4
    for _ in range(8):
        ts = START_DATE + timedelta(days=attack_day, hours=random.choice([2, 3, 4]),
                                     minutes=random.randint(0, 59))
        logs.append({
            "fiu_name": "MoneyTracker",
            "account_id": f"ACC{random.randint(1, 60):03d}",
            "timestamp": ts,
            "records_fetched": random.randint(600, 2000),
            "ip_address": _random_ip(normal=False),
            "auth_success": True
        })

    attack_day = 6
    for _ in range(6):
        ts = START_DATE + timedelta(days=attack_day, hours=3, minutes=random.randint(0, 59))
        logs.append({
            "fiu_name": "LoanEasy",
            "account_id": f"ACC{random.randint(1, 30):03d}",
            "timestamp": ts,
            "records_fetched": random.randint(10, 50),
            "ip_address": _random_ip(normal=False),
            "auth_success": True
        })

    attack_day = 8
    ts_base = START_DATE + timedelta(days=attack_day, hours=14)
    for i in range(25):
        ts = ts_base + timedelta(minutes=random.randint(0, 59))
        logs.append({
            "fiu_name": "InvestPro",
            "account_id": f"ACC{random.randint(1, 50):03d}",
            "timestamp": ts,
            "records_fetched": random.randint(15, 70),
            "ip_address": _random_ip(normal=True),
            "auth_success": True
        })

    return logs


def generate_dummy_logs():
    logs = generate_normal_logs()
    logs = inject_attack_patterns(logs)
    df = pd.DataFrame(logs)
    return df.sort_values("timestamp").reset_index(drop=True)


# ---------------------------------------------------------------------
# STEP B: The detector class (threshold filtering + explanations)
# ---------------------------------------------------------------------
class BehavioralAnomalyDetector:
    def __init__(self, contamination=0.05, min_risk_score=60):
        self.model = None
        self.feature_cols = [
            'requests_per_hour', 'unique_accounts',
            'avg_records', 'max_records', 'unique_ips'
        ]
        self.contamination = contamination
        self.min_risk_score = min_risk_score
        self.baselines = {}

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

    def _compute_baselines(self, features):
        baselines = {}
        for fiu, group in features.groupby('fiu_name'):
            baselines[fiu] = {
                col: {
                    "mean": group[col].mean(),
                    "std": group[col].std() if group[col].std() > 0 else 1e-6
                }
                for col in self.feature_cols
            }
        return baselines

    def fit(self, df):
        features = self.build_features(df)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )
        self.model.fit(features[self.feature_cols])
        self.baselines = self._compute_baselines(features)
        return features

    def detect(self, df):
        features = self.build_features(df)
        features['anomaly_score'] = self.model.decision_function(features[self.feature_cols])
        features['is_anomaly'] = self.model.predict(features[self.feature_cols])
        return self._generate_alerts(features)

    def _explain(self, fiu, row):
        readable_names = {
            'requests_per_hour': 'number of requests',
            'unique_accounts': 'number of accounts accessed',
            'avg_records': 'average data pulled per request',
            'max_records': 'largest single data pull',
            'unique_ips': 'number of different IPs used'
        }

        if fiu not in self.baselines:
            return "Behavior differs from typical pattern for this app."

        deviations = []
        for col in self.feature_cols:
            base = self.baselines[fiu][col]
            z = (row[col] - base["mean"]) / base["std"]
            if z > 1.5:
                multiplier = row[col] / base["mean"] if base["mean"] > 0 else float('inf')
                deviations.append((abs(z), (
                    f"{readable_names[col]} was {multiplier:.1f}x higher than "
                    f"{fiu}'s normal average ({row[col]:.0f} vs ~{base['mean']:.0f})"
                )))

        if not deviations:
            return "Behavior differs from typical pattern for this app."

        deviations.sort(key=lambda d: d[0], reverse=True)
        return deviations[0][1]

    def _generate_alerts(self, features_df):
        anomalies = features_df[features_df['is_anomaly'] == -1].copy()
        if anomalies.empty:
            return []

        min_score = features_df['anomaly_score'].min()
        max_score = features_df['anomaly_score'].max()
        denom = (max_score - min_score) if max_score != min_score else 1

        anomalies['risk_score'] = ((max_score - anomalies['anomaly_score']) / denom * 100).round(1)

        anomalies = anomalies[anomalies['risk_score'] >= self.min_risk_score]

        alerts = []
        for _, row in anomalies.iterrows():
            alerts.append({
                "detector": "Behavioral Anomaly",
                "fiu_name": row['fiu_name'],
                "time_window": str(row['hour_window']),
                "risk_score": row['risk_score'],
                "reason": self._explain(row['fiu_name'], row),
                "severity": "High" if row['risk_score'] > 75 else "Medium"
            })
        alerts.sort(key=lambda a: a['risk_score'], reverse=True)
        return alerts


# ---------------------------------------------------------------------
# STEP C: Run it end-to-end
# ---------------------------------------------------------------------
if __name__ == "__main__":
    print("Generating realistic simulated log data across "
          f"{DAYS_OF_HISTORY} days for {len(APP_PROFILES)} apps...")
    df = generate_dummy_logs()
    print(f"Generated {len(df)} log rows.\n")

    print("Training detector on this data...")
    detector = BehavioralAnomalyDetector(contamination=0.05)
    detector.fit(df)
    print("Training complete.\n")

    print("Running detection...")
    alerts = detector.detect(df)

    print(f"\nFound {len(alerts)} anomaly alert(s), sorted by risk score:\n")
    for a in alerts:
        print(a)