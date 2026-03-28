# """
# face_recognition_api.py
# ─────────────────────────────────────────────────────────────
# Flask backend that the Safe Return frontend calls for
# face recognition. Run on port 5000 alongside your existing
# Flask backend on port 5001.

#     pip install flask flask-cors deepface pillow numpy
#     python face_recognition_api.py
# """

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from deepface import DeepFace
# from PIL import Image
# from threshold_optimizer import genetic_algorithm, particle_swarm_optimization
# import numpy as np
# import os, tempfile, functools

# app = Flask(__name__)
# CORS(app)   # allow requests from the HTML frontend

# DB_PATH    = "data"          # folder with inmate photos named <InmateId>.jpg/.png
# EXCEL_PATH = "sheet.xlsx"    # columns: Inmate Id, Name


# # ── load inmate sheet once ────────────────────────────────
# import pandas as pd

# @functools.lru_cache(maxsize=1)
# def load_inmate_df():
#     return pd.read_excel(EXCEL_PATH)


# # ── compute threshold once at startup ────────────────────
# def compute_threshold():
#     try:
#         genuine  = np.load("genuine_distances.npy")
#         imposter = np.load("imposter_distances.npy")
#         ga_thr   = genetic_algorithm(genuine, imposter)
#         pso_thr  = particle_swarm_optimization(genuine, imposter)
#         return (ga_thr + pso_thr) / 2
#     except Exception:
#         return 0.40   # sensible cosine-distance fallback


# THRESHOLD = compute_threshold()
# print(f"[FR API] Using threshold: {THRESHOLD:.4f}")


# # ── /recognize ────────────────────────────────────────────
# @app.route("/recognize", methods=["POST"])
# def recognize():
#     """
#     Frontend sends:  multipart/form-data with field 'file' (image)

#     Returns JSON:
#     {
#         "match":               true | false,
#         "possible_match":      true | false,   # below threshold but closest result
#         "confidence":          0.87,            # float 0-1  (1 - cosine distance)
#         "distance":            0.13,
#         "person_id":           "SR-2024-001",
#         "name":                "Rajesh Kumar",
#         "matched_image_path":  "data/SR-2024-001.jpg"  # relative to server root
#     }

#     On error (no face / no match at all):
#     HTTP 400  { "error": "No face detected" }
#     """
#     if "file" not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     uploaded = request.files["file"]

#     # save to temp file
#     suffix = os.path.splitext(uploaded.filename)[-1] or ".jpg"
#     with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
#         tmp_path = tmp.name
#         uploaded.save(tmp_path)

#     try:
#         results = DeepFace.find(
#             img_path        = tmp_path,
#             db_path         = DB_PATH,
#             model_name      = "ArcFace",
#             detector_backend= "retinaface",
#             distance_metric = "cosine",
#             enforce_detection = True,
#             silent          = True
#         )
#     except Exception as e:
#         os.remove(tmp_path)
#         return jsonify({"error": str(e)}), 400
#     finally:
#         if os.path.exists(tmp_path):
#             os.remove(tmp_path)

#     # DeepFace.find returns a list of DataFrames (one per face in query image)
#     if not results or results[0].empty:
#         return jsonify({"error": "No match found in database"}), 400

#     best        = results[0].iloc[0]
#     distance    = float(best["distance"])
#     confidence  = round(1.0 - distance, 4)

#     # resolve inmate id from filename
#     matched_path = best["identity"]
#     filename     = os.path.basename(matched_path)
#     inmate_id    = os.path.splitext(filename)[0]

#     # look up name
#     df         = load_inmate_df()
#     person_row = df[df["Inmate Id"].astype(str) == str(inmate_id)]
#     person_name = person_row.iloc[0]["Name"] if not person_row.empty else "Unknown"

#     is_match       = distance <= THRESHOLD
#     possible_match = (not is_match) and (distance <= THRESHOLD * 1.35)  # within 35% slack

#     return jsonify({
#         "match":              is_match,
#         "possible_match":     possible_match,
#         "confidence":         confidence,
#         "distance":           round(distance, 6),
#         "person_id":          inmate_id,
#         "name":               person_name,
#         "matched_image_path": matched_path.replace("\\", "/")
#     })


# # ── /image-proxy ──────────────────────────────────────────
# @app.route("/<path:filepath>")
# def serve_file(filepath):
#     """Serve database images so the frontend <img> tags work."""
#     from flask import send_file
#     full = os.path.join(os.getcwd(), filepath)
#     if os.path.isfile(full):
#         return send_file(full)
#     return jsonify({"error": "File not found"}), 404


# if __name__ == "__main__":
#     app.run(port=5000, debug=True)

"""
api.py  –  Flask backend for Safe Return Face Recognition
Matches all features in streamlit_app.py:
  - POST /recognize      → Face recognition against database (with GA+PSO threshold)
  - POST /compare        → Two-image face comparison (with GA+PSO threshold)
  - GET  /threshold      → Returns the current auto-computed threshold
  - GET  /health         → Health check

Run (dev):   python api.py
Run (prod):  gunicorn -w 2 -b 0.0.0.0:5000 api:app
"""

from notification_client import notify_if_match

import os
import io
import base64
import uuid
import logging

import numpy as np
import pandas as pd
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from deepface import DeepFace

# ── Import your GA/PSO threshold optimisers ─────────────────────────────────
from threshold_optimizer import genetic_algorithm, particle_swarm_optimization

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("safe_return")

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=os.path.dirname(os.path.abspath(__file__)), static_url_path="")
CORS(app)

# ── Config (override via environment variables) ───────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH  = os.environ.get("EXCEL_PATH", os.path.join(BASE_DIR, "sheet.xlsx"))
DB_PATH     = os.environ.get("DB_PATH",    os.path.join(BASE_DIR, "data"))
TEMP_DIR    = os.environ.get("TEMP_DIR",   os.path.join(BASE_DIR, "temp_uploads"))
THRESHOLD_CACHE = os.path.join(BASE_DIR, "threshold.npy")

os.makedirs(TEMP_DIR, exist_ok=True)

# ════════════════════════════════════════════════════════════════════════════════
#  GA + PSO Auto Threshold  (mirrors compute_optimal_threshold in streamlit_app)
# ════════════════════════════════════════════════════════════════════════════════
_threshold_cache: float | None = None


def compute_optimal_threshold() -> float:
    """
    Computes the hybrid GA+PSO threshold once and caches it in memory and on disk.
    Falls back to 0.6 if distance files are missing.
    """
    global _threshold_cache
    if _threshold_cache is not None:
        return _threshold_cache

    # Try loading a pre-saved threshold first
    if os.path.exists(THRESHOLD_CACHE):
        _threshold_cache = float(np.load(THRESHOLD_CACHE))
        logger.info("Threshold loaded from cache: %.4f", _threshold_cache)
        return _threshold_cache

    # Compute from genuine / imposter distance files
    genuine_path  = os.path.join(BASE_DIR, "genuine_distances.npy")
    imposter_path = os.path.join(BASE_DIR, "imposter_distances.npy")

    if not os.path.exists(genuine_path) or not os.path.exists(imposter_path):
        logger.warning("Distance files not found – using fallback threshold 0.6")
        _threshold_cache = 0.6
        return _threshold_cache

    try:
        genuine  = np.load(genuine_path)
        imposter = np.load(imposter_path)

        ga_threshold  = genetic_algorithm(genuine, imposter)
        pso_threshold = particle_swarm_optimization(genuine, imposter)

        _threshold_cache = float((ga_threshold + pso_threshold) / 2)
        np.save(THRESHOLD_CACHE, _threshold_cache)
        logger.info("Threshold computed & saved: %.4f", _threshold_cache)
    except Exception as exc:
        logger.error("Threshold computation failed: %s – using 0.6", exc)
        _threshold_cache = 0.6

    return _threshold_cache


# ════════════════════════════════════════════════════════════════════════════════
#  Excel helper  (lazy-loaded, cached in memory)
# ════════════════════════════════════════════════════════════════════════════════
_person_df: pd.DataFrame | None = None


def get_person_df() -> pd.DataFrame:
    global _person_df
    if _person_df is None:
        _person_df = pd.read_excel(EXCEL_PATH)
        logger.info("Excel loaded: %d rows", len(_person_df))
    return _person_df


# ════════════════════════════════════════════════════════════════════════════════
#  Image decode helper
# ════════════════════════════════════════════════════════════════════════════════
def decode_image_to_file(b64_data: str, suffix: str = ".jpg") -> str:
    """Decode a base64 (optionally data-URL) image and save to a temp file."""
    if "," in b64_data:
        b64_data = b64_data.split(",", 1)[1]
    # Clean and fix padding
    b64_data = b64_data.strip().replace(" ", "+").replace("\n", "").replace("\r", "")
    missing = len(b64_data) % 4
    if missing:
        b64_data += "=" * (4 - missing)
    img_bytes = base64.b64decode(b64_data)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}{suffix}")
    img.save(temp_path, "JPEG")
    return temp_path


def cleanup(*paths):
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError:
            pass


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: GET /
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/")
def index():
    return app.send_static_file("index.html")


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: GET /health
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/uploads/photos/<path:filename>")
def proxy_photo(filename):
    """Proxy photo requests to app.py upload folder."""
    import posixpath
    photo_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "photos")
    return send_from_directory(photo_folder, filename)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":    "ok",
        "excel":     os.path.exists(EXCEL_PATH),
        "db":        os.path.exists(DB_PATH),
        "threshold": compute_optimal_threshold(),
    })


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: GET /threshold
#  Returns the current auto-computed GA+PSO threshold.
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/threshold", methods=["GET"])
def get_threshold():
    threshold = compute_optimal_threshold()
    return jsonify({
        "success":   True,
        "threshold": threshold,
    })


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: POST /recognize
#  Body (JSON): { "image": "<base64 or data-URL>" }
#
#  Mirrors Face Recognition page in streamlit_app.py:
#  - Uses ArcFace + RetinaFace + cosine
#  - Applies GA+PSO auto threshold
#  - Looks up Name from Excel by "Inmate Id"
#  - Returns matched DB image as base64 thumbnail
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.get_json(force=True)
    image_data = data.get("image", "")
    location   = data.get("location", "Unknown Camera")

    if not image_data:
        return jsonify({"success": False, "error": "No image provided"}), 400

    temp_path = None
    try:
        temp_path = decode_image_to_file(image_data)
    except Exception as exc:
        return jsonify({"success": False, "error": f"Invalid image data: {exc}"}), 400

    try:
        threshold = compute_optimal_threshold()

        results = DeepFace.find(
            img_path=temp_path,
            db_path=DB_PATH,
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=False,   # mirrors streamlit_app.py (enforce_detection=False)
            silent=True,
        )

        # No match found
        if not results or len(results[0]) == 0:
            return jsonify({
                "success": True,
                "match":   False,
                "message": "No matching face found in the database",
            })

        best_match   = results[0].iloc[0]
        matched_path = best_match["identity"]
        distance     = float(best_match["distance"])
        confidence   = round(1 - distance, 4)           # 0–1  (mirrors streamlit confidence)
        confidence_pct = round(confidence * 100, 2)     # as %

        # Extract person ID from filename  (e.g. data/001.jpg → "001")
        person_id = os.path.splitext(os.path.basename(matched_path))[0]

        # Look up Name in Excel
        df  = get_person_df()
        row = df[df["Inmate Id"].astype(str) == str(person_id)]
        if row.empty:
            return jsonify({
                "success": False,
                "error":   f"Person ID '{person_id}' not found in Excel sheet",
            })

        person_name = str(row.iloc[0]["Name"])
        matched_above_threshold = confidence >= threshold

        # Return matched DB image as base64 thumbnail
        matched_b64 = ""
        try:
            with open(matched_path, "rb") as f:
                matched_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
        except Exception:
            pass

        logger.info(
            "Recognize: person_id=%s name=%s confidence=%.2f%% threshold=%.4f match=%s",
            person_id, person_name, confidence_pct, threshold, matched_above_threshold,
        )

        # ── Build result dict FIRST, THEN notify, THEN return ──────────────
        result = {
            "success":               True,
            "match":                 matched_above_threshold,
            "person_name":           person_name,
            "person_id":             person_id,
            "confidence":            confidence_pct,
            "confidence_raw":        confidence,
            "distance":              distance,
            "threshold":             threshold,
            "matched_image":         matched_b64,
            "low_confidence":        not matched_above_threshold,
        }

        notify_if_match(result, location=location)  # ← BEFORE return
        return jsonify(result)                       # ← single return point

    except Exception as exc:
        logger.exception("Recognition error")
        return jsonify({"success": False, "error": str(exc)})

    finally:
        cleanup(temp_path)


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: POST /compare
#  Body (JSON): { "image1": "<base64>", "image2": "<base64>" }
#
#  Mirrors Image Comparison page in streamlit_app.py:
#  - Uses ArcFace + RetinaFace + cosine
#  - Applies GA+PSO auto threshold  (distance <= threshold → same person)
#  - Returns verified, confidence, distance, threshold, confidence bar value
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/compare", methods=["POST"])
def compare():
    data     = request.get_json(force=True)
    img1_b64 = data.get("image1", "")
    img2_b64 = data.get("image2", "")
    location   = data.get("location", "Unknown Camera")

    if not img1_b64 or not img2_b64:
        return jsonify({"success": False, "error": "Two images required"}), 400

    path1 = path2 = None
    try:
        path1 = decode_image_to_file(img1_b64)
        path2 = decode_image_to_file(img2_b64)
    except Exception as exc:
        cleanup(path1, path2)
        return jsonify({"success": False, "error": f"Invalid image data: {exc}"}), 400

    try:
        threshold = compute_optimal_threshold()

        result = DeepFace.verify(
            img1_path=path1,
            img2_path=path2,
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=True,
        )

        distance   = float(result["distance"])
        confidence = round(1 - distance, 4)                # 0–1
        confidence_pct = round(confidence * 100, 2)        # %

        # Use GA+PSO threshold (mirrors streamlit: verified = distance <= auto_threshold)
        verified = distance <= threshold

        # Confidence level label  (mirrors streamlit logic)
        if verified and confidence > 0.75:
            level = "high"
        elif verified:
            level = "borderline"
        else:
            level = "no_match"

        logger.info(
            "Compare: distance=%.4f threshold=%.4f confidence=%.2f%% verified=%s",
            distance, threshold, confidence_pct, verified,
        )

        return jsonify({
            "success":         True,
            "verified":        verified,          # True = same person
            "confidence":      confidence_pct,    # percentage
            "confidence_raw":  confidence,        # 0–1 (use for progress bar)
            "distance":        distance,
            "threshold":       threshold,         # GA+PSO auto threshold
            "deepface_threshold": float(result.get("threshold", threshold)),
            "confidence_level": level,            # "high" | "borderline" | "no_match"
        })

    except Exception as exc:
        logger.exception("Comparison error")
        return jsonify({"success": False, "error": str(exc)})

    finally:
        cleanup(path1, path2)


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: POST /reload-excel
#  Forces a reload of the Excel person database (useful after updating sheet.xlsx)
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/reload-excel", methods=["POST"])
def reload_excel():
    global _person_df
    try:
        _person_df = pd.read_excel(EXCEL_PATH)
        logger.info("Excel reloaded: %d rows", len(_person_df))
        return jsonify({"success": True, "rows": len(_person_df)})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)})


# ════════════════════════════════════════════════════════════════════════════════
#  ROUTE: POST /reload-threshold
#  Forces recomputation of the GA+PSO threshold (after updating distance files)
# ════════════════════════════════════════════════════════════════════════════════
@app.route("/reload-threshold", methods=["POST"])
def reload_threshold():
    global _threshold_cache
    _threshold_cache = None
    # Also delete cached file so it recomputes
    if os.path.exists(THRESHOLD_CACHE):
        os.remove(THRESHOLD_CACHE)
    threshold = compute_optimal_threshold()
    return jsonify({"success": True, "threshold": threshold})


# ════════════════════════════════════════════════════════════════════════════════
#  Dev entry point
# ════════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    logger.info("Excel  : %s  %s", EXCEL_PATH, "✓" if os.path.exists(EXCEL_PATH) else "✗ NOT FOUND")
    logger.info("DB     : %s  %s", DB_PATH,    "✓" if os.path.exists(DB_PATH)    else "✗ NOT FOUND")
    logger.info("Threshold will be auto-computed on first request.")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)