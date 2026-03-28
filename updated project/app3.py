# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import mysql.connector
# import os
# from werkzeug.utils import secure_filename
#
# app = Flask(__name__)
# CORS(app)
#
# db = mysql.connector.connect(
#     host="localhost",
#     user="root",
#     password="Vanshika0509@",
#     database="missing_person_db"
# )
#
# UPLOAD_FOLDER = "uploads/inmates"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)
#
#
# # 🔒 THIS ROUTE INSERTS ONLY INTO missing_persons_excel
# @app.route("/register-inmate", methods=["POST"])
# def register_inmate():
#
#     data = request.form
#     photo = request.files.get("photo")
#
#     photo_path = None
#     if photo:
#         filename = secure_filename(photo.filename)
#         photo_path = os.path.join(UPLOAD_FOLDER, filename)
#         photo.save(photo_path)
#
#     cursor = db.cursor()
#
#     cursor.execute("""
#         INSERT INTO inmates
#         (inmate_id, registration_no, unique_id, status, full_name,
#          dob, gender, languages, address, joining_date, photo_path)
#         VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
#     """, (
#         data.get("inmate_id"),
#         data.get("registration_no"),
#         data.get("unique_id"),
#         data.get("status"),
#         data.get("full_name"),
#         data.get("dob"),
#         data.get("gender"),
#         data.get("languages"),
#         data.get("address"),
#         data.get("joining_date"),
#         photo_path
#     ))
#
#     db.commit()
#     cursor.close()
#
#     return jsonify({"message": "Inmate registered successfully"})

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ===========================
# MongoDB Connection
# ===========================

MONGO_URI = "mongodb+srv://render_user:Vanshika0509@cluster0.6ds8ydm.mongodb.net/missing_person_db"

client = MongoClient(MONGO_URI)

try:
    client.server_info()
    print("MongoDB Connected Successfully")
except Exception as e:
    print("MongoDB Connection Failed:", e)

db = client["missing_person_db"]

inmates_collection = db["inmates"]

# ===========================
# Upload Folder Setup
# ===========================

UPLOAD_FOLDER = "uploads/inmates"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===========================
# Register Inmate Route
# ===========================

@app.route("/register-inmate", methods=["POST"])
def register_inmate():

    data = request.form
    photo = request.files.get("photo")

    # ===============================
    # 🔥 DATE VALIDATION STARTS HERE
    # ===============================

    dob = data.get("dob")
    joining_date = data.get("joining_date")

    if not dob or not joining_date:
        return jsonify({"error": "DOB and Joining Date are required"}), 400

    try:
        dob_date = datetime.fromisoformat(dob)
        joining_date_obj = datetime.fromisoformat(joining_date)
        current_date = datetime.now()

        # ❌ Future DOB
        if dob_date > current_date:
            return jsonify({"error": "Future Date of Birth is not allowed"}), 400

        # ❌ Future Joining Date
        if joining_date_obj > current_date:
            return jsonify({"error": "Future Joining Date is not allowed"}), 400

        # ❌ Joining date before DOB
        if joining_date_obj < dob_date:
            return jsonify({"error": "Joining date cannot be before Date of Birth"}), 400

    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    # ===============================
    # 🔥 DATE VALIDATION ENDS HERE
    # ===============================

    photo_path = None
    if photo:
        filename = secure_filename(photo.filename)
        photo_path = os.path.join(UPLOAD_FOLDER, filename)
        photo.save(photo_path)

    # 🔥 Create MongoDB document
    inmate_document = {
        "inmate_id": data.get("inmate_id"),
        "registration_no": data.get("registration_no"),
        "unique_id": data.get("unique_id"),
        "status": data.get("status"),
        "full_name": data.get("full_name"),
        "dob": data.get("dob"),
        "gender": data.get("gender"),
        "languages": data.get("languages"),
        "address": data.get("address"),
        "joining_date": data.get("joining_date"),
        "photo_path": photo_path
    }

    inmates_collection.insert_one(inmate_document)

    return jsonify({"message": "Inmate registered successfully"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)