
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, date
import os
import re
import uuid
from typing import Optional

app = FastAPI()

# ===========================
# CORS
# ===========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# MongoDB Connection
# ===========================
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set!")

client = MongoClient(MONGO_URI)

try:
    client.server_info()
    print("✅ MongoDB Connected Successfully")
except Exception as e:
    print("❌ MongoDB Connection Failed:", e)

db = client["missing_person_db"]

# ── Two separate collections ──────────────────────────
# 1. Public lost-person reports  →  missing_reports
# 2. Admin inmate registrations  →  inmates
missing_collection = db["user_login_details"]
collection   = db["inmates"]
found_collection   = db["found_persons"]

# ===========================
# Upload Folder Setup
# ===========================
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads/photos")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

STATIC_DIR = os.path.join(os.getcwd(), "static")

# ===========================
# Mount Static Files
# Order matters: mount /uploads BEFORE /static
# ===========================
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ===========================
# Serve index.html  (lives inside /static/)
# ===========================
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(
            content="<h2>Frontend not found. Place index.html inside the /static folder.</h2>",
            status_code=404
        )
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# ===========================
# Health Check
# ===========================
@app.get("/health")
def health():
    return {"status": "ok", "message": "Safe Return API is running"}


# ══════════════════════════════════════════════════════
#  PUBLIC  —  Submit Lost Person Report
#  Frontend JS calls:  POST /submit
# ══════════════════════════════════════════════════════
@app.post("/submit")
async def submit(
    public_fullName:      str            = Form(...),
    public_age:           str            = Form(...),
    gender:               str            = Form(...),
    language_spoken:      Optional[str]  = Form(None),
    public_location:      str            = Form(...),
    public_dateTime:      str            = Form(...),
    clothing_description: Optional[str]  = Form(None),
    general_description:  Optional[str]  = Form(None),
    medical_condition:    Optional[str]  = Form(None),
    public_familyName:    str            = Form(...),
    public_familyPhone:   str            = Form(...),
    photo: Optional[UploadFile]          = File(None)
):
    # ── Phone validation ──────────────────────────────
    phone = public_familyPhone.strip()
    if not re.match(r'^[6-9]\d{9}$', phone):
        raise HTTPException(status_code=400, detail="Invalid Indian phone number")

    # ── Date validation ───────────────────────────────
    if not public_dateTime:
        raise HTTPException(status_code=400, detail="Date & time is required")
    try:
        selected_dt = datetime.fromisoformat(public_dateTime)
        if selected_dt > datetime.now():
            raise HTTPException(status_code=400, detail="Future date is not allowed")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # ── Save photo ────────────────────────────────────
    photo_path = None
    if photo and photo.filename:
        ext             = os.path.splitext(photo.filename)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path       = os.path.join(UPLOAD_FOLDER, unique_filename)
        with open(file_path, "wb") as f:
            f.write(await photo.read())
        photo_path = f"uploads/photos/{unique_filename}"

    # ── Save to MongoDB  (missing_reports collection) ─
    document = {
        "full_name":             public_fullName,
        "age":                   public_age,
        "gender":                gender,
        "language_spoken":       language_spoken,
        "last_seen_location":    public_location,
        "last_seen_datetime":    public_dateTime,
        "clothing_description":  clothing_description,
        "general_description":   general_description,
        "medical_condition":     medical_condition,
        "contact_name":          public_familyName,
        "contact_phone":         phone,
        "photo_path":            photo_path,
        "status":                "Missing",
        "created_at":            datetime.now().isoformat()
    }

    try:
        result = missing_collection.insert_one(document)
        print("✅ Lost report inserted:", result.inserted_id)
    except Exception as e:
        print("❌ MongoDB insert failed:", e)
        raise HTTPException(status_code=500, detail="Database error. Could not save report.")

    return {"message": "Report submitted successfully"}


# ══════════════════════════════════════════════════════
#  ADMIN  —  Register Inmate
#  Frontend JS calls:  POST /register-inmate
# ══════════════════════════════════════════════════════
@app.post("/register-inmate")
async def register_inmate(
    inmate_id:       str            = Form(...),
    registration_no: str            = Form(...),
    unique_id:       Optional[str]  = Form(None),
    status:          str            = Form(...),
    full_name:       str            = Form(...),
    dob:             str            = Form(...),
    gender:          str            = Form(...),
    languages:       Optional[str]  = Form(None),
    address:         Optional[str]  = Form(None),
    joining_date:    str            = Form(...),
    photo: Optional[UploadFile]     = File(None)
):
    # ── Date validation ───────────────────────────────
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
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

    # ── Save photo ────────────────────────────────────
    photo_path = None
    if photo and photo.filename:
        ext             = os.path.splitext(photo.filename)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path       = os.path.join(UPLOAD_FOLDER, unique_filename)
        contents        = await photo.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        photo_path = f"uploads/photos/{unique_filename}"

    # ── Save to MongoDB  (inmates collection) ─────────
    inmate_document = {
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
        "created_at":      datetime.now().isoformat()
    }

    try:
        result = collection.insert_one(inmate_document)
        print("✅ Inmate inserted:", result.inserted_id)
    except Exception as e:
        print("❌ MongoDB insert failed:", e)
        raise HTTPException(status_code=500, detail="Database error. Could not save inmate record.")

    return {"message": "Inmate registered successfully"}



# ══════════════════════════════════════════════════════
#  ADMIN — Report Found Person / Family
#  Frontend: POST /found-person   (connect2.js)
#  ← NEW — merged from separate app
# ══════════════════════════════════════════════════════
 
@app.post("/found-person")
async def found_person(
    found_location: str = Form(...),
    found_datetime: str = Form(...),
    contact_name:   str = Form(...),
    contact_number: str = Form(...)
):
    # Phone validation
    phone_number = contact_number.strip()
    if not re.match(r'^[6-9]\d{9}$', phone_number):
        raise HTTPException(
            status_code=400,
            detail="Invalid Indian phone number (must be 10 digits, start with 6-9)"
        )
 
    # Date validation
    if not found_datetime:
        raise HTTPException(status_code=400, detail="Found date & time is required.")
    try:
        selected_date = datetime.fromisoformat(found_datetime)
        if selected_date > datetime.now():
            raise HTTPException(status_code=400, detail="Future date is not allowed.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")
 
    # Save to MongoDB
    found_document = {
        "found_location": found_location,
        "found_datetime": found_datetime,
        "contact_name":   contact_name,
        "contact_number": phone_number,
        "created_at":     datetime.now().isoformat()
    }
 
    try:
        result = found_collection.insert_one(found_document)
        print("✅ Found person inserted:", result.inserted_id)
    except Exception as e:
        print("❌ MongoDB insert failed:", e)
        raise HTTPException(status_code=500, detail="Database error. Could not save found report.")
 
    return {"message": "Found person stored successfully"}
 


# ══════════════════════════════════════════════════════
#  ADMIN TABLE  —  Get Missing Reports (public reports)
#  Frontend JS calls:  GET /get-missing-reports
# ══════════════════════════════════════════════════════
@app.get("/get-missing-reports")
def get_missing_reports():
    try:
        reports = list(missing_collection.find())
        for r in reports:
            r["_id"]    = str(r["_id"])
            r["status"] = r.get("status", "Missing")
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════
#  ADMIN TABLE  —  Get All Reports (alias, same data)
#  Frontend JS calls:  GET /get-reports
# ══════════════════════════════════════════════════════
@app.get("/get-reports")
def get_reports():
    try:
        reports = list(missing_collection.find())
        for r in reports:
            r["_id"]    = str(r["_id"])
            r["status"] = r.get("status", "Missing")
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════
#  ADMIN TABLE  —  Mark Person as Found
#  Frontend JS calls:  POST /mark-found/<id>
# ══════════════════════════════════════════════════════
@app.post("/mark-found/{report_id}")
def mark_found(report_id: str):
    try:
        result = missing_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Found"}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"message": "Status updated to Found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════
#  Serve uploaded photos directly
#  e.g.  GET /uploads/photos/abc123.jpg
# ══════════════════════════════════════════════════════
@app.get("/uploads/photos/{filename}")
def get_photo(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(file_path)
