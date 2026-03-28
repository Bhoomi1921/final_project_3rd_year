"""
face_recognition_api.py
─────────────────────────────────────────────────────────────
Flask backend that the Safe Return frontend calls for
face recognition. Run on port 5000 alongside your existing
Flask backend on port 5001.

    pip install flask flask-cors deepface pillow numpy
    python face_recognition_api.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from PIL import Image
from threshold_optimizer import genetic_algorithm, particle_swarm_optimization
import numpy as np
import os, tempfile, functools

app = Flask(__name__)
CORS(app)   # allow requests from the HTML frontend

DB_PATH    = "data"          # folder with inmate photos named <InmateId>.jpg/.png
EXCEL_PATH = "sheet.xlsx"    # columns: Inmate Id, Name


# ── load inmate sheet once ────────────────────────────────
import pandas as pd

@functools.lru_cache(maxsize=1)
def load_inmate_df():
    return pd.read_excel(EXCEL_PATH)


# ── compute threshold once at startup ────────────────────
def compute_threshold():
    try:
        genuine  = np.load("genuine_distances.npy")
        imposter = np.load("imposter_distances.npy")
        ga_thr   = genetic_algorithm(genuine, imposter)
        pso_thr  = particle_swarm_optimization(genuine, imposter)
        return (ga_thr + pso_thr) / 2
    except Exception:
        return 0.40   # sensible cosine-distance fallback


THRESHOLD = compute_threshold()
print(f"[FR API] Using threshold: {THRESHOLD:.4f}")


# ── /recognize ────────────────────────────────────────────
@app.route("/recognize", methods=["POST"])
def recognize():
    """
    Frontend sends:  multipart/form-data with field 'file' (image)

    Returns JSON:
    {
        "match":               true | false,
        "possible_match":      true | false,   # below threshold but closest result
        "confidence":          0.87,            # float 0-1  (1 - cosine distance)
        "distance":            0.13,
        "person_id":           "SR-2024-001",
        "name":                "Rajesh Kumar",
        "matched_image_path":  "data/SR-2024-001.jpg"  # relative to server root
    }

    On error (no face / no match at all):
    HTTP 400  { "error": "No face detected" }
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded = request.files["file"]

    # save to temp file
    suffix = os.path.splitext(uploaded.filename)[-1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = tmp.name
        uploaded.save(tmp_path)

    try:
        results = DeepFace.find(
            img_path        = tmp_path,
            db_path         = DB_PATH,
            model_name      = "ArcFace",
            detector_backend= "retinaface",
            distance_metric = "cosine",
            enforce_detection = True,
            silent          = True
        )
    except Exception as e:
        os.remove(tmp_path)
        return jsonify({"error": str(e)}), 400
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    # DeepFace.find returns a list of DataFrames (one per face in query image)
    if not results or results[0].empty:
        return jsonify({"error": "No match found in database"}), 400

    best        = results[0].iloc[0]
    distance    = float(best["distance"])
    confidence  = round(1.0 - distance, 4)

    # resolve inmate id from filename
    matched_path = best["identity"]
    filename     = os.path.basename(matched_path)
    inmate_id    = os.path.splitext(filename)[0]

    # look up name
    df         = load_inmate_df()
    person_row = df[df["Inmate Id"].astype(str) == str(inmate_id)]
    person_name = person_row.iloc[0]["Name"] if not person_row.empty else "Unknown"

    is_match       = distance <= THRESHOLD
    possible_match = (not is_match) and (distance <= THRESHOLD * 1.35)  # within 35% slack

    return jsonify({
        "match":              is_match,
        "possible_match":     possible_match,
        "confidence":         confidence,
        "distance":           round(distance, 6),
        "person_id":          inmate_id,
        "name":               person_name,
        "matched_image_path": matched_path.replace("\\", "/")
    })


# ── /image-proxy ──────────────────────────────────────────
@app.route("/<path:filepath>")
def serve_file(filepath):
    """Serve database images so the frontend <img> tags work."""
    from flask import send_file
    full = os.path.join(os.getcwd(), filepath)
    if os.path.isfile(full):
        return send_file(full)
    return jsonify({"error": "File not found"}), 404


if __name__ == "__main__":
    app.run(port=5000, debug=True)