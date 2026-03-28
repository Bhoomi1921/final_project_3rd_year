
# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import HTMLResponse, FileResponse
# from pymongo import MongoClient
# from bson import ObjectId
# from datetime import datetime, date
# import os
# import re
# import uuid
# from typing import Optional

# app = FastAPI()

# # ===========================
# # CORS
# # ===========================
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ===========================
# # MongoDB Connection
# # ===========================
# MONGO_URI = os.getenv("MONGO_URI")
# if not MONGO_URI:
#     raise RuntimeError("MONGO_URI environment variable is not set!")

# client = MongoClient(MONGO_URI)

# try:
#     client.server_info()
#     print("✅ MongoDB Connected Successfully")
# except Exception as e:
#     print("❌ MongoDB Connection Failed:", e)

# db = client["missing_person_db"]

# # ── Two separate collections ──────────────────────────
# # 1. Public lost-person reports  →  missing_reports
# # 2. Admin inmate registrations  →  inmates
# missing_collection = db["user_login_details"]
# collection   = db["inmates"]
# found_collection   = db["found_persons"]

# # ===========================
# # Upload Folder Setup
# # ===========================
# UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads/photos")
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# STATIC_DIR = os.path.join(os.getcwd(), "static")

# # ===========================
# # Mount Static Files
# # Order matters: mount /uploads BEFORE /static
# # ===========================
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# if os.path.exists(STATIC_DIR):
#     app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# # ===========================
# # Serve index.html  (lives inside /static/)
# # ===========================
# @app.get("/", response_class=HTMLResponse)
# async def serve_index():
#     index_path = os.path.join(STATIC_DIR, "index.html")
#     if not os.path.exists(index_path):
#         return HTMLResponse(
#             content="<h2>Frontend not found. Place index.html inside the /static folder.</h2>",
#             status_code=404
#         )
#     with open(index_path, "r", encoding="utf-8") as f:
#         return HTMLResponse(content=f.read())

# # ===========================
# # Health Check
# # ===========================
# @app.get("/health")
# def health():
#     return {"status": "ok", "message": "Safe Return API is running"}


# # ══════════════════════════════════════════════════════
# #  PUBLIC  —  Submit Lost Person Report
# #  Frontend JS calls:  POST /submit
# # ══════════════════════════════════════════════════════
# @app.post("/submit")
# async def submit(
#     public_fullName:      str            = Form(...),
#     public_age:           str            = Form(...),
#     gender:               str            = Form(...),
#     language_spoken:      Optional[str]  = Form(None),
#     public_location:      str            = Form(...),
#     public_dateTime:      str            = Form(...),
#     clothing_description: Optional[str]  = Form(None),
#     general_description:  Optional[str]  = Form(None),
#     medical_condition:    Optional[str]  = Form(None),
#     public_familyName:    str            = Form(...),
#     public_familyPhone:   str            = Form(...),
#     photo: Optional[UploadFile]          = File(None)
# ):
#     # ── Phone validation ──────────────────────────────
#     phone = public_familyPhone.strip()
#     if not re.match(r'^[6-9]\d{9}$', phone):
#         raise HTTPException(status_code=400, detail="Invalid Indian phone number")

#     # ── Date validation ───────────────────────────────
#     if not public_dateTime:
#         raise HTTPException(status_code=400, detail="Date & time is required")
#     try:
#         selected_dt = datetime.fromisoformat(public_dateTime)
#         if selected_dt > datetime.now():
#             raise HTTPException(status_code=400, detail="Future date is not allowed")
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid date format")

#     # ── Save photo ────────────────────────────────────
#     photo_path = None
#     if photo and photo.filename:
#         ext             = os.path.splitext(photo.filename)[1].lower()
#         unique_filename = f"{uuid.uuid4().hex}{ext}"
#         file_path       = os.path.join(UPLOAD_FOLDER, unique_filename)
#         with open(file_path, "wb") as f:
#             f.write(await photo.read())
#         photo_path = f"uploads/photos/{unique_filename}"

#     # ── Save to MongoDB  (missing_reports collection) ─
#     document = {
#         "full_name":             public_fullName,
#         "age":                   public_age,
#         "gender":                gender,
#         "language_spoken":       language_spoken,
#         "last_seen_location":    public_location,
#         "last_seen_datetime":    public_dateTime,
#         "clothing_description":  clothing_description,
#         "general_description":   general_description,
#         "medical_condition":     medical_condition,
#         "contact_name":          public_familyName,
#         "contact_phone":         phone,
#         "photo_path":            photo_path,
#         "status":                "Missing",
#         "created_at":            datetime.now().isoformat()
#     }

#     try:
#         result = missing_collection.insert_one(document)
#         print("✅ Lost report inserted:", result.inserted_id)
#     except Exception as e:
#         print("❌ MongoDB insert failed:", e)
#         raise HTTPException(status_code=500, detail="Database error. Could not save report.")

#     return {"message": "Report submitted successfully"}


# # ══════════════════════════════════════════════════════
# #  ADMIN  —  Register Inmate
# #  Frontend JS calls:  POST /register-inmate
# # ══════════════════════════════════════════════════════
# @app.post("/register-inmate")
# async def register_inmate(
#     inmate_id:       str            = Form(...),
#     registration_no: str            = Form(...),
#     unique_id:       Optional[str]  = Form(None),
#     status:          str            = Form(...),
#     full_name:       str            = Form(...),
#     dob:             str            = Form(...),
#     gender:          str            = Form(...),
#     languages:       Optional[str]  = Form(None),
#     address:         Optional[str]  = Form(None),
#     joining_date:    str            = Form(...),
#     photo: Optional[UploadFile]     = File(None)
# ):
#     # ── Date validation ───────────────────────────────
#     try:
#         dob_date         = date.fromisoformat(dob)
#         joining_date_obj = date.fromisoformat(joining_date)
#         today            = date.today()

#         if dob_date > today:
#             raise HTTPException(status_code=400, detail="Future Date of Birth is not allowed")
#         if joining_date_obj > today:
#             raise HTTPException(status_code=400, detail="Future Joining Date is not allowed")
#         if joining_date_obj < dob_date:
#             raise HTTPException(status_code=400, detail="Joining date cannot be before Date of Birth")

#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

#     # ── Save photo ────────────────────────────────────
#     photo_path = None
#     if photo and photo.filename:
#         ext             = os.path.splitext(photo.filename)[1].lower()
#         unique_filename = f"{uuid.uuid4().hex}{ext}"
#         file_path       = os.path.join(UPLOAD_FOLDER, unique_filename)
#         contents        = await photo.read()
#         with open(file_path, "wb") as f:
#             f.write(contents)
#         photo_path = f"uploads/photos/{unique_filename}"

#     # ── Save to MongoDB  (inmates collection) ─────────
#     inmate_document = {
#         "inmate_id":       inmate_id,
#         "registration_no": registration_no,
#         "unique_id":       unique_id,
#         "status":          status,
#         "full_name":       full_name,
#         "dob":             dob,
#         "gender":          gender,
#         "languages":       languages,
#         "address":         address,
#         "joining_date":    joining_date,
#         "photo_path":      photo_path,
#         "created_at":      datetime.now().isoformat()
#     }

#     try:
#         result = collection.insert_one(inmate_document)
#         print("✅ Inmate inserted:", result.inserted_id)
#     except Exception as e:
#         print("❌ MongoDB insert failed:", e)
#         raise HTTPException(status_code=500, detail="Database error. Could not save inmate record.")

#     return {"message": "Inmate registered successfully"}



# # ══════════════════════════════════════════════════════
# #  ADMIN — Report Found Person / Family
# #  Frontend: POST /found-person   (connect2.js)
# #  ← NEW — merged from separate app
# # ══════════════════════════════════════════════════════
 
# @app.post("/found-person")
# async def found_person(
#     found_location: str = Form(...),
#     found_datetime: str = Form(...),
#     contact_name:   str = Form(...),
#     contact_number: str = Form(...)
# ):
#     # Phone validation
#     phone_number = contact_number.strip()
#     if not re.match(r'^[6-9]\d{9}$', phone_number):
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid Indian phone number (must be 10 digits, start with 6-9)"
#         )
 
#     # Date validation
#     if not found_datetime:
#         raise HTTPException(status_code=400, detail="Found date & time is required.")
#     try:
#         selected_date = datetime.fromisoformat(found_datetime)
#         if selected_date > datetime.now():
#             raise HTTPException(status_code=400, detail="Future date is not allowed.")
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid date format.")
 
#     # Save to MongoDB
#     found_document = {
#         "found_location": found_location,
#         "found_datetime": found_datetime,
#         "contact_name":   contact_name,
#         "contact_number": phone_number,
#         "created_at":     datetime.now().isoformat()
#     }
 
#     try:
#         result = found_collection.insert_one(found_document)
#         print("✅ Found person inserted:", result.inserted_id)
#     except Exception as e:
#         print("❌ MongoDB insert failed:", e)
#         raise HTTPException(status_code=500, detail="Database error. Could not save found report.")
 
#     return {"message": "Found person stored successfully"}
 


# # ══════════════════════════════════════════════════════
# #  ADMIN TABLE  —  Get Missing Reports (public reports)
# #  Frontend JS calls:  GET /get-missing-reports
# # ══════════════════════════════════════════════════════
# @app.get("/get-missing-reports")
# def get_missing_reports():
#     try:
#         reports = list(missing_collection.find())
#         for r in reports:
#             r["_id"]    = str(r["_id"])
#             r["status"] = r.get("status", "Missing")
#         return reports
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ══════════════════════════════════════════════════════
# #  ADMIN TABLE  —  Get All Reports (alias, same data)
# #  Frontend JS calls:  GET /get-reports
# # ══════════════════════════════════════════════════════
# @app.get("/get-reports")
# def get_reports():
#     try:
#         reports = list(missing_collection.find())
#         for r in reports:
#             r["_id"]    = str(r["_id"])
#             r["status"] = r.get("status", "Missing")
#         return reports
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ══════════════════════════════════════════════════════
# #  ADMIN TABLE  —  Mark Person as Found
# #  Frontend JS calls:  POST /mark-found/<id>
# # ══════════════════════════════════════════════════════
# @app.post("/mark-found/{report_id}")
# def mark_found(report_id: str):
#     try:
#         result = missing_collection.update_one(
#             {"_id": ObjectId(report_id)},
#             {"$set": {"status": "Found"}}
#         )
#         if result.matched_count == 0:
#             raise HTTPException(status_code=404, detail="Report not found")
#         return {"message": "Status updated to Found"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ══════════════════════════════════════════════════════
# #  Serve uploaded photos directly
# #  e.g.  GET /uploads/photos/abc123.jpg
# # ══════════════════════════════════════════════════════
# @app.get("/uploads/photos/{filename}")
# def get_photo(filename: str):
#     file_path = os.path.join(UPLOAD_FOLDER, filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Photo not found")
#     return FileResponse(file_path)

"""
server.py  –  Combined entry point for Render deployment
Merges:
  • app.py   → MongoDB backend  (routes: /submit, /register-inmate, etc.)
  • main.py  → Face Recognition (routes: /recognize, /compare, etc.)

All routes are available at the ROOT level (no prefix needed).
Duplicate routes (/health, /uploads/photos) are unified here.

Run locally:
    uvicorn server:app --host 0.0.0.0 --port 10000 --reload

Render Start Command:
    uvicorn server:app --host 0.0.0.0 --port 10000
"""

from __future__ import annotations

# ══════════════════════════════════════════════════════
#  Standard library
# ══════════════════════════════════════════════════════
import base64
import io
import logging
import os
import re
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Optional

# ══════════════════════════════════════════════════════
#  Third-party
# ══════════════════════════════════════════════════════
import numpy as np
import pandas as pd
from bson import ObjectId
from deepface import DeepFace
from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pymongo import MongoClient
from pydantic import BaseModel

# ── your custom modules ───────────────────────────────
from threshold_optimizer import genetic_algorithm, particle_swarm_optimization
from notification_client import notify_if_match

# ══════════════════════════════════════════════════════
#  Logging
# ══════════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("safe_return")

# ══════════════════════════════════════════════════════
#  Paths & config
# ══════════════════════════════════════════════════════
BASE_DIR        = Path(__file__).resolve().parent
EXCEL_PATH      = Path(os.environ.get("EXCEL_PATH",  str(BASE_DIR / "sheet.xlsx")))
DB_PATH         = Path(os.environ.get("DB_PATH",     str(BASE_DIR / "data")))
TEMP_DIR        = Path(os.environ.get("TEMP_DIR",    str(BASE_DIR / "temp_uploads")))
THRESHOLD_CACHE = BASE_DIR / "threshold.npy"
UPLOAD_FOLDER   = BASE_DIR / "uploads" / "photos"
STATIC_DIR      = BASE_DIR / "static"

TEMP_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# ══════════════════════════════════════════════════════
#  MongoDB  (from app.py)
# ══════════════════════════════════════════════════════
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set!")

mongo_client = MongoClient(MONGO_URI)
try:
    mongo_client.server_info()
    logger.info("✅ MongoDB Connected Successfully")
except Exception as e:
    logger.error("❌ MongoDB Connection Failed: %s", e)

mongo_db         = mongo_client["missing_person_db"]
missing_collection = mongo_db["user_login_details"]
inmate_collection  = mongo_db["inmates"]
found_collection   = mongo_db["found_persons"]

# ══════════════════════════════════════════════════════
#  GA + PSO Auto Threshold  (from main.py)
# ══════════════════════════════════════════════════════
_threshold_cache: Optional[float] = None


def compute_optimal_threshold() -> float:
    global _threshold_cache
    if _threshold_cache is not None:
        return _threshold_cache

    if THRESHOLD_CACHE.exists():
        _threshold_cache = float(np.load(str(THRESHOLD_CACHE)))
        logger.info("Threshold loaded from cache: %.4f", _threshold_cache)
        return _threshold_cache

    genuine_path  = BASE_DIR / "genuine_distances.npy"
    imposter_path = BASE_DIR / "imposter_distances.npy"

    if not genuine_path.exists() or not imposter_path.exists():
        logger.warning("Distance files not found – using fallback threshold 0.6")
        _threshold_cache = 0.6
        return _threshold_cache

    try:
        genuine  = np.load(str(genuine_path))
        imposter = np.load(str(imposter_path))
        _threshold_cache = float(
            (genetic_algorithm(genuine, imposter) + particle_swarm_optimization(genuine, imposter)) / 2
        )
        np.save(str(THRESHOLD_CACHE), _threshold_cache)
        logger.info("Threshold computed & saved: %.4f", _threshold_cache)
    except Exception as exc:
        logger.error("Threshold computation failed: %s – using 0.6", exc)
        _threshold_cache = 0.6

    return _threshold_cache


# ══════════════════════════════════════════════════════
#  Excel helper  (from main.py)
# ══════════════════════════════════════════════════════
_person_df: Optional[pd.DataFrame] = None


def get_person_df() -> pd.DataFrame:
    global _person_df
    if _person_df is None:
        _person_df = pd.read_excel(str(EXCEL_PATH))
        logger.info("Excel loaded: %d rows", len(_person_df))
    return _person_df


# ══════════════════════════════════════════════════════
#  Image helpers  (from main.py)
# ══════════════════════════════════════════════════════
def save_upload_to_temp(upload: UploadFile) -> Path:
    contents = upload.file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    tmp = TEMP_DIR / f"{uuid.uuid4().hex}.jpg"
    img.save(str(tmp), "JPEG")
    return tmp


def decode_base64_to_temp(b64_data: str) -> Path:
    if "," in b64_data:
        b64_data = b64_data.split(",", 1)[1]
    b64_data = b64_data.strip().replace(" ", "+").replace("\n", "").replace("\r", "")
    missing = len(b64_data) % 4
    if missing:
        b64_data += "=" * (4 - missing)
    img_bytes = base64.b64decode(b64_data)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    tmp = TEMP_DIR / f"{uuid.uuid4().hex}.jpg"
    img.save(str(tmp), "JPEG")
    return tmp


def cleanup(*paths: Optional[Path]) -> None:
    for p in paths:
        try:
            if p and p.exists():
                p.unlink()
        except OSError:
            pass


def image_to_b64(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
    except Exception:
        return ""


# ══════════════════════════════════════════════════════
#  Pydantic models  (from main.py)
# ══════════════════════════════════════════════════════
class RecognizeRequest(BaseModel):
    image: str
    location: str = "Unknown Camera"


class CompareRequest(BaseModel):
    image1: str
    image2: str
    location: str = "Unknown Camera"


# ══════════════════════════════════════════════════════
#  FastAPI app  (single combined instance)
# ══════════════════════════════════════════════════════
app = FastAPI(
    title="Safe Return – Combined API",
    description="MongoDB backend + ArcFace face recognition in one service",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file mounts ────────────────────────────────
app.mount("/uploads", StaticFiles(directory=str(BASE_DIR / "uploads")), name="uploads")
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ══════════════════════════════════════════════════════
#  Startup
# ══════════════════════════════════════════════════════
@app.on_event("startup")
def startup_event():
    logger.info("Excel  : %s  %s", EXCEL_PATH, "✓" if EXCEL_PATH.exists() else "✗ NOT FOUND")
    logger.info("DB     : %s  %s", DB_PATH,    "✓" if DB_PATH.exists()    else "✗ NOT FOUND")
    compute_optimal_threshold()
    try:
        get_person_df()
    except Exception as exc:
        logger.warning("Excel preload failed: %s", exc)


# ════════════════════════════════════════════════════
#  ─────────── GENERAL ROUTES ────────────────────────
# ════════════════════════════════════════════════════

# Render health-check sends HEAD / → must allow GET + HEAD
@app.api_route("/", methods=["GET", "HEAD"])
async def serve_index(response: Response):
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
    return JSONResponse({"status": "ok", "message": "Safe Return API is running"})


@app.api_route("/health", methods=["GET", "HEAD"])
def health(response: Response):
    return {
        "status":    "ok",
        "excel":     EXCEL_PATH.exists(),
        "db":        DB_PATH.exists(),
        "threshold": compute_optimal_threshold(),
        "mongo":     "connected",
    }


# ════════════════════════════════════════════════════
#  ─────────── BACKEND ROUTES  (from app.py) ─────────
# ════════════════════════════════════════════════════

@app.post("/submit", tags=["Public"])
async def submit(
    public_fullName:      str           = Form(...),
    public_age:           str           = Form(...),
    gender:               str           = Form(...),
    language_spoken:      Optional[str] = Form(None),
    public_location:      str           = Form(...),
    public_dateTime:      str           = Form(...),
    clothing_description: Optional[str] = Form(None),
    general_description:  Optional[str] = Form(None),
    medical_condition:    Optional[str] = Form(None),
    public_familyName:    str           = Form(...),
    public_familyPhone:   str           = Form(...),
    photo: Optional[UploadFile]         = File(None),
):
    phone = public_familyPhone.strip()
    if not re.match(r'^[6-9]\d{9}$', phone):
        raise HTTPException(status_code=400, detail="Invalid Indian phone number")

    if not public_dateTime:
        raise HTTPException(status_code=400, detail="Date & time is required")
    try:
        selected_dt = datetime.fromisoformat(public_dateTime)
        if selected_dt > datetime.now():
            raise HTTPException(status_code=400, detail="Future date is not allowed")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    photo_path = None
    if photo and photo.filename:
        ext  = os.path.splitext(photo.filename)[1].lower()
        name = f"{uuid.uuid4().hex}{ext}"
        path = UPLOAD_FOLDER / name
        path.write_bytes(await photo.read())
        photo_path = f"uploads/photos/{name}"

    doc = {
        "full_name":            public_fullName,
        "age":                  public_age,
        "gender":               gender,
        "language_spoken":      language_spoken,
        "last_seen_location":   public_location,
        "last_seen_datetime":   public_dateTime,
        "clothing_description": clothing_description,
        "general_description":  general_description,
        "medical_condition":    medical_condition,
        "contact_name":         public_familyName,
        "contact_phone":        phone,
        "photo_path":           photo_path,
        "status":               "Missing",
        "created_at":           datetime.now().isoformat(),
    }
    try:
        result = missing_collection.insert_one(doc)
        logger.info("Lost report inserted: %s", result.inserted_id)
    except Exception as e:
        logger.error("MongoDB insert failed: %s", e)
        raise HTTPException(status_code=500, detail="Database error. Could not save report.")

    return {"message": "Report submitted successfully"}


@app.post("/register-inmate", tags=["Admin"])
async def register_inmate(
    inmate_id:       str           = Form(...),
    registration_no: str           = Form(...),
    unique_id:       Optional[str] = Form(None),
    status:          str           = Form(...),
    full_name:       str           = Form(...),
    dob:             str           = Form(...),
    gender:          str           = Form(...),
    languages:       Optional[str] = Form(None),
    address:         Optional[str] = Form(None),
    joining_date:    str           = Form(...),
    photo: Optional[UploadFile]    = File(None),
):
    try:
        dob_date         = date.fromisoformat(dob)
        joining_date_obj = date.fromisoformat(joining_date)
        today            = date.today()
        if dob_date > today:
            raise HTTPException(status_code=400, detail="Future Date of Birth is not allowed")
        if joining_date_obj > today:
            raise HTTPException(status_code=400, detail="Future Joining Date is not allowed")
        if joining_date_obj < dob_date:
            raise HTTPException(status_code=400, detail="Joining date cannot be before Date of Birth")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

    photo_path = None
    if photo and photo.filename:
        ext  = os.path.splitext(photo.filename)[1].lower()
        name = f"{uuid.uuid4().hex}{ext}"
        path = UPLOAD_FOLDER / name
        path.write_bytes(await photo.read())
        photo_path = f"uploads/photos/{name}"

    doc = {
        "inmate_id":       inmate_id,
        "registration_no": registration_no,
        "unique_id":       unique_id,
        "status":          status,
        "full_name":       full_name,
        "dob":             dob,
        "gender":          gender,
        "languages":       languages,
        "address":         address,
        "joining_date":    joining_date,
        "photo_path":      photo_path,
        "created_at":      datetime.now().isoformat(),
    }
    try:
        result = inmate_collection.insert_one(doc)
        logger.info("Inmate inserted: %s", result.inserted_id)
    except Exception as e:
        logger.error("MongoDB insert failed: %s", e)
        raise HTTPException(status_code=500, detail="Database error. Could not save inmate record.")

    return {"message": "Inmate registered successfully"}


@app.post("/found-person", tags=["Admin"])
async def found_person(
    found_location: str = Form(...),
    found_datetime: str = Form(...),
    contact_name:   str = Form(...),
    contact_number: str = Form(...),
):
    phone = contact_number.strip()
    if not re.match(r'^[6-9]\d{9}$', phone):
        raise HTTPException(status_code=400, detail="Invalid Indian phone number")
    if not found_datetime:
        raise HTTPException(status_code=400, detail="Found date & time is required.")
    try:
        if datetime.fromisoformat(found_datetime) > datetime.now():
            raise HTTPException(status_code=400, detail="Future date is not allowed.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    doc = {
        "found_location": found_location,
        "found_datetime": found_datetime,
        "contact_name":   contact_name,
        "contact_number": phone,
        "created_at":     datetime.now().isoformat(),
    }
    try:
        result = found_collection.insert_one(doc)
        logger.info("Found person inserted: %s", result.inserted_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error. Could not save found report.")

    return {"message": "Found person stored successfully"}


@app.get("/get-missing-reports", tags=["Admin"])
def get_missing_reports():
    try:
        reports = list(missing_collection.find())
        for r in reports:
            r["_id"]    = str(r["_id"])
            r["status"] = r.get("status", "Missing")
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-reports", tags=["Admin"])
def get_reports():
    return get_missing_reports()


@app.post("/mark-found/{report_id}", tags=["Admin"])
def mark_found(report_id: str):
    try:
        result = missing_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Found"}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"message": "Status updated to Found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════
#  ─────────── FACE RECOGNITION ROUTES (from main.py)─
# ════════════════════════════════════════════════════

@app.get("/threshold", tags=["Face Recognition"])
def get_threshold():
    return {"success": True, "threshold": compute_optimal_threshold()}


@app.post("/reload-excel", tags=["Face Recognition"])
def reload_excel():
    global _person_df
    try:
        _person_df = pd.read_excel(str(EXCEL_PATH))
        logger.info("Excel reloaded: %d rows", len(_person_df))
        return {"success": True, "rows": len(_person_df)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/reload-threshold", tags=["Face Recognition"])
def reload_threshold():
    global _threshold_cache
    _threshold_cache = None
    if THRESHOLD_CACHE.exists():
        THRESHOLD_CACHE.unlink()
    return {"success": True, "threshold": compute_optimal_threshold()}


# ── /recognize  (JSON base64 body) ───────────────────
@app.post("/recognize", tags=["Face Recognition"])
async def recognize(payload: RecognizeRequest, background_tasks: BackgroundTasks):
    if not payload.image:
        raise HTTPException(status_code=400, detail="No image provided")
    try:
        temp_path = decode_base64_to_temp(payload.image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}")

    try:
        threshold = compute_optimal_threshold()
        results = DeepFace.find(
            img_path=str(temp_path),
            db_path=str(DB_PATH),
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=False,
            silent=True,
        )
        if not results or len(results[0]) == 0:
            return {"success": True, "match": False, "message": "No matching face found in the database"}

        best       = results[0].iloc[0]
        distance   = float(best["distance"])
        confidence = round(1 - distance, 4)
        person_id  = Path(best["identity"]).stem

        df  = get_person_df()
        row = df[df["Inmate Id"].astype(str) == str(person_id)]
        if row.empty:
            raise HTTPException(status_code=404, detail=f"Person ID '{person_id}' not found in Excel sheet")

        person_name = str(row.iloc[0]["Name"])
        match       = confidence >= threshold

        result = {
            "success":        True,
            "match":          match,
            "person_name":    person_name,
            "person_id":      person_id,
            "confidence":     round(confidence * 100, 2),
            "confidence_raw": confidence,
            "distance":       distance,
            "threshold":      threshold,
            "matched_image":  image_to_b64(best["identity"]),
            "low_confidence": not match,
        }
        background_tasks.add_task(notify_if_match, result, location=payload.location)
        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Recognition error")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cleanup(temp_path)


# ── /recognize/upload  (multipart file upload) ───────
@app.post("/recognize/upload", tags=["Face Recognition"])
async def recognize_upload(
    file: UploadFile = File(...),
    location: str = "Unknown Camera",
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    temp_path: Optional[Path] = None
    try:
        temp_path = save_upload_to_temp(file)
        threshold = compute_optimal_threshold()
        results = DeepFace.find(
            img_path=str(temp_path),
            db_path=str(DB_PATH),
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=False,
            silent=True,
        )
        if not results or len(results[0]) == 0:
            return {"success": True, "match": False, "message": "No matching face found"}

        best       = results[0].iloc[0]
        distance   = float(best["distance"])
        confidence = round(1 - distance, 4)
        person_id  = Path(best["identity"]).stem

        df  = get_person_df()
        row = df[df["Inmate Id"].astype(str) == str(person_id)]
        if row.empty:
            raise HTTPException(status_code=404, detail=f"Person ID '{person_id}' not found")

        person_name = str(row.iloc[0]["Name"])
        match       = confidence >= threshold

        result = {
            "success":        True,
            "match":          match,
            "person_name":    person_name,
            "person_id":      person_id,
            "confidence":     round(confidence * 100, 2),
            "confidence_raw": confidence,
            "distance":       distance,
            "threshold":      threshold,
            "matched_image":  image_to_b64(best["identity"]),
            "low_confidence": not match,
        }
        background_tasks.add_task(notify_if_match, result, location=location)
        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Upload recognition error")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cleanup(temp_path)


# ── /compare  (JSON base64 body) ─────────────────────
@app.post("/compare", tags=["Face Recognition"])
async def compare(payload: CompareRequest):
    path1 = path2 = None
    try:
        path1 = decode_base64_to_temp(payload.image1)
        path2 = decode_base64_to_temp(payload.image2)
    except Exception as exc:
        cleanup(path1, path2)
        raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}")

    try:
        threshold = compute_optimal_threshold()
        result = DeepFace.verify(
            img1_path=str(path1),
            img2_path=str(path2),
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=True,
        )
        distance   = float(result["distance"])
        confidence = round(1 - distance, 4)
        verified   = distance <= threshold
        level      = "high" if (verified and confidence > 0.75) else ("borderline" if verified else "no_match")

        return {
            "success":            True,
            "verified":           verified,
            "confidence":         round(confidence * 100, 2),
            "confidence_raw":     confidence,
            "distance":           distance,
            "threshold":          threshold,
            "deepface_threshold": float(result.get("threshold", threshold)),
            "confidence_level":   level,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Comparison error")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cleanup(path1, path2)


# ── /compare/upload  (multipart two files) ───────────
@app.post("/compare/upload", tags=["Face Recognition"])
async def compare_upload(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    path1 = path2 = None
    try:
        path1 = save_upload_to_temp(file1)
        path2 = save_upload_to_temp(file2)
        threshold = compute_optimal_threshold()
        result = DeepFace.verify(
            img1_path=str(path1),
            img2_path=str(path2),
            model_name="ArcFace",
            detector_backend="retinaface",
            distance_metric="cosine",
            enforce_detection=True,
        )
        distance   = float(result["distance"])
        confidence = round(1 - distance, 4)
        verified   = distance <= threshold
        level      = "high" if (verified and confidence > 0.75) else ("borderline" if verified else "no_match")

        return {
            "success":          True,
            "verified":         verified,
            "confidence":       round(confidence * 100, 2),
            "confidence_raw":   confidence,
            "distance":         distance,
            "threshold":        threshold,
            "confidence_level": level,
        }
    except Exception as exc:
        logger.exception("Upload compare error")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        cleanup(path1, path2)


# ── Unified photo proxy ───────────────────────────────
@app.get("/uploads/photos/{filename}", tags=["Files"])
def get_photo(filename: str):
    file_path = UPLOAD_FOLDER / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(str(file_path))


# ══════════════════════════════════════════════════════
#  Dev entry point
# ══════════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=10000, reload=False)