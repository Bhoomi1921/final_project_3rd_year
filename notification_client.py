"""
notification_client.py
─────────────────────────────────────────────────────────────────────────────
Drop this file next to your api.py.
It sends face-match results to the Spring Boot notification service.

Usage: just import and call  notify_if_match(result_dict)  after /recognize.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import requests
from datetime import datetime

log = logging.getLogger("safe_return.notifications")

# URL of the Spring Boot notification service
NOTIFICATION_SERVICE_URL = "http://localhost:8080/api/notify"

# Minimum confidence % to trigger a notification (mirrors Spring Boot config)
CONFIDENCE_THRESHOLD = 70.0


def notify_if_match(recognize_result: dict, location: str = "Unknown Camera") -> bool:
    """
    Call after a successful /recognize response.
    Sends a notification to the Spring Boot service if confidence >= 70%.

    Args:
        recognize_result:  the dict returned by /recognize  (already jsonified)
        location:          optional camera / location label

    Returns:
        True if notification was sent, False otherwise.

    Example usage inside api.py /recognize route:
        from notification_client import notify_if_match
        ...
        response_data = { "success": True, "match": True, ... }
        notify_if_match(response_data, location="Main Gate")
        return jsonify(response_data)
    """
    try:
        confidence = float(recognize_result.get("confidence", 0))

        if confidence < CONFIDENCE_THRESHOLD:
            log.debug("Confidence %.1f%% below threshold %.1f%% – skipping notification",
                      confidence, CONFIDENCE_THRESHOLD)
            return False

        payload = {
            "person_id":   recognize_result.get("person_id", ""),
            "person_name": recognize_result.get("person_name", "Unknown"),
            "confidence":  confidence,
            "distance":    recognize_result.get("distance", 0),
            "threshold":   recognize_result.get("threshold", 0),
            "match":       recognize_result.get("match", False),
            "location":    location,
            "timestamp":   datetime.now().isoformat(),
        }

        response = requests.post(
            NOTIFICATION_SERVICE_URL,
            json=payload,
            timeout=10   # don't block face recognition for too long
        )

        if response.status_code == 200:
            data = response.json()
            log.info("Notification dispatched: %s → channels: %s",
                     payload["person_name"], data.get("channelResults", []))
            return True
        else:
            log.warning("Notification service returned HTTP %d: %s",
                        response.status_code, response.text)
            return False

    except requests.exceptions.ConnectionError:
        log.warning("Notification service not reachable at %s – continuing without notification",
                    NOTIFICATION_SERVICE_URL)
        return False
    except Exception as e:
        log.error("Unexpected error sending notification: %s", e)
        return False


# ─────────────────────────────────────────────────────────────────────────────
#  HOW TO INTEGRATE INTO YOUR EXISTING api.py /recognize ROUTE
# ─────────────────────────────────────────────────────────────────────────────
#
#  Step 1: At the top of api.py add:
#      from notification_client import notify_if_match
#
#  Step 2: In your /recognize route, BEFORE the final return jsonify(...),
#  add these two lines:
#
#      # ── Send notification if confidence >= 70% ──
#      notify_if_match(response_dict, location="Main Gate Camera")
#      return jsonify(response_dict)
#
#  Here is the exact section of api.py to modify (around line 378–390):
#
#  BEFORE:
#      return jsonify({
#          "success":               True,
#          "match":                 matched_above_threshold,
#          "person_name":           person_name,
#          "person_id":             person_id,
#          "confidence":            confidence_pct,
#          "confidence_raw":        confidence,
#          "distance":              distance,
#          "threshold":             threshold,
#          "matched_image":         matched_b64,
#          "low_confidence":        not matched_above_threshold,
#      })
#
#  AFTER:
#      result = {
#          "success":               True,
#          "match":                 matched_above_threshold,
#          "person_name":           person_name,
#          "person_id":             person_id,
#          "confidence":            confidence_pct,
#          "confidence_raw":        confidence,
#          "distance":              distance,
#          "threshold":             threshold,
#          "matched_image":         matched_b64,
#          "low_confidence":        not matched_above_threshold,
#      }
#      notify_if_match(result, location="Main Gate Camera")   # ← ADD THIS
#      return jsonify(result)
