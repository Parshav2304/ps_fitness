"""
Jev Decision Router
Sub-10ms intent, domain, and safety classification engine for PS Fitness.
Directs incoming user queries to specialized RAG knowledge retreival, food vision,
or deterministic safety protocols before hitting the LLM generation loop.
"""

import re
import time
from typing import Dict, Any, List

class JevDecisionRouter:
    """
    Sub-10ms deterministic intent & safety router.
    Evaluates regex patterns and vocabulary heuristics to tag queries.
    """

    # Safety red-flags that require immediate medical disclaimers
    CRITICAL_SAFETY_KEYWORDS = [
        r"\bchest pain\b",
        r"\bsharp tearing\b",
        r"\bjoint dislocat\w*\b",
        r"\bdizzi(ness|ed)\b",
        r"\bfaint(ing|ed)?\b",
        r"\bheart palpitat\w*\b",
        r"\bnumb(ness)?\b",
        r"\btendon snap\b",
        r"\bblackout\b",
        r"\bvomit\w*\b",
    ]

    # Intent routing rules
    ROUTES = [
        (
            "EXERCISE_INJURY_RAG",
            [
                r"\b(knee|shoulder|elbow|wrist|hip|lower back|spine|rotator cuff)\s+(pain|hurts|ache|injury|pinching|tweak|pop)\b",
                r"\b(squat|bench|deadlift|overhead press|lunge)\s+hurts\b",
                r"\b(biomechanic|subacromial|patellofemoral|scapular plane)\b",
                r"\balternative\s+(to|for)\s+(squat|bench|deadlift|press|lunge)\b",
                r"\bexercise\s+substitution\b",
            ]
        ),
        (
            "VOLUME_OPTIMIZATION",
            [
                r"\bhow many sets\b",
                r"\bsets? per (week|muscle|bodypart)\b",
                r"\b(rir|rpe|reps in reserve)\b",
                r"\bprogressive overload\b",
                r"\b(hypertrophy|volume)\s+threshold\b",
                r"\bdiminishing returns\b",
                r"\btraining volume\b",
            ]
        ),
        (
            "TDEE_ADVICE",
            [
                r"\b(tdee|metabolic rate|energy expenditure)\b",
                r"\bweight plateau\b",
                r"\b(cut|bulk|maintenance)\s+calories\b",
                r"\bcalorie deficit\b",
                r"\bcalorie surplus\b",
                r"\bweight not moving\b",
                r"\bhow much should i eat\b",
            ]
        ),
        (
            "NUTRITION_RAG",
            [
                r"\bprotein\s+(intake|per day|timing|requirement|synthesis)\b",
                r"\bleucine threshold\b",
                r"\bcreatine\s+(dose|timing|monohydrate)\b",
                r"\bmacronutrient\b",
                r"\bpre[- ]workout meal\b",
                r"\bpost[- ]workout meal\b",
            ]
        ),
        (
            "FOOD_LOGGING_VISION",
            [
                r"\blog\s+(this|my)\s+(food|meal|breakfast|lunch|dinner|snack)\b",
                r"\bcalories\s+in\s+",
                r"\bhow many calories\b",
                r"\btrack\s+food\b",
                r"\bscan\s+(meal|food|plate)\b",
            ]
        ),
    ]

    def __init__(self):
        # Precompile regular expressions for microsecond execution
        self.safety_patterns = [re.compile(p, re.IGNORECASE) for p in self.CRITICAL_SAFETY_KEYWORDS]
        self.compiled_routes = [
            (label, [re.compile(p, re.IGNORECASE) for p in patterns])
            for label, patterns in self.ROUTES
        ]

    def route(self, query: str) -> Dict[str, Any]:
        """
        Routes the user message in under 10ms.
        Returns:
            {
                "route": str,
                "needs_rag": bool,
                "safety_alert": bool,
                "latency_ms": float,
                "confidence": float
            }
        """
        start = time.perf_counter()
        normalized = query.strip()

        # Step 1: High-priority safety assessment
        safety_alert = False
        for pattern in self.safety_patterns:
            if pattern.search(normalized):
                safety_alert = True
                break

        # Step 2: Intent classification
        matched_route = "GENERAL_COACH_CHAT"
        needs_rag = False
        confidence = 0.70

        for route_label, patterns in self.compiled_routes:
            for pattern in patterns:
                if pattern.search(normalized):
                    matched_route = route_label
                    needs_rag = route_label in [
                        "EXERCISE_INJURY_RAG",
                        "VOLUME_OPTIMIZATION",
                        "TDEE_ADVICE",
                        "NUTRITION_RAG",
                    ]
                    confidence = 0.95
                    break
            if matched_route != "GENERAL_COACH_CHAT":
                break

        latency_ms = round((time.perf_counter() - start) * 1000, 2)

        return {
            "route": matched_route,
            "needs_rag": needs_rag,
            "safety_alert": safety_alert,
            "latency_ms": latency_ms,
            "confidence": confidence,
        }

# Global singleton router instance
jev_router = JevDecisionRouter()
