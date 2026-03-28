# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import mysql.connector
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
# @app.route("/found-person", methods=["POST"])
# def found_person():
#
#     data = request.get_json()
#
#     if not data:
#         return jsonify({"error": "No JSON data received"}), 400
#
#     required_fields = [
#         "found_location",
#         "found_datetime",
#         "contact_name",
#         "contact_number"
#     ]
#
#     for field in required_fields:
#         if field not in data or not str(data[field]).strip():
#             return jsonify({"error": f"{field} is required"}), 400
#
#     cursor = db.cursor()
#
#     cursor.execute("""
#         SELECT inmate_id, name
#         FROM missing_persons_excel
#         ORDER BY inmate_id DESC
#         LIMIT 1
#     """)
#
#     row = cursor.fetchone()
#
#     if not row:
#         cursor.close()
#         return jsonify({"error": "No missing person found"}), 400
#
#     inmate_id, missing_name = row
#
#     cursor.execute("""
#         INSERT INTO found_persons
#         (inmate_id, missing_person_name, found_location, found_datetime, contact_name, contact_number)
#         VALUES (%s,%s,%s,%s,%s,%s)
#     """, (
#         inmate_id,
#         missing_name,
#         data["found_location"],
#         data["found_datetime"],
#         data["contact_name"],
#         data["contact_number"]
#     ))
#
#     db.commit()
#     cursor.close()
#
#     return jsonify({"message": "Found person stored successfully"}), 200
#
# if __name__ == "__main__":
#     app.run(port=5001, debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ===========================
# MongoDB Connection
# ===========================

MONGO_URI = "mongodb+srv://render_user:Vanshika0509@cluster0.6ds8ydm.mongodb.net/missing_person_db"  # For Render
# For local testing you can temporarily hardcode

client = MongoClient(MONGO_URI)

try:
    client.server_info()
    print("MongoDB Connected Successfully")
except Exception as e:
    print("MongoDB Connection Failed:", e)

db = client["missing_person_db"]

found_collection = db["found_persons"]

# ===========================
# Found Person Route
# ===========================

@app.route("/found-person", methods=["POST"])
def found_person():

    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data received"}), 400

    required_fields = [
        "found_location",
        "found_datetime",
        "contact_name",
        "contact_number"
    ]

    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({"error": f"{field} is required"}), 400

    # 🔥 INDIAN PHONE VALIDATION
    phone_number = data["contact_number"]

    if not re.match(r'^[6-9]\d{9}$', phone_number):
        return jsonify({
            "error": "Invalid Indian phone number (must be 10 digits and start with 6-9)"
        }), 400

        # ===============================
        # 🔥 DATE VALIDATION STARTS HERE
        # ===============================
    found_datetime = data.get("found_datetime")

    if not found_datetime:
        return jsonify({
            "error": "Found date & time is required."
        }), 400

    try:
        selected_date = datetime.fromisoformat(found_datetime)
        current_date = datetime.now()

        if selected_date > current_date:
            return jsonify({
                "error": "Future date is not allowed."
            }), 400
    except ValueError:
        return jsonify({
            "error": "Invalid date format."
        }), 400
    # ===============================
    # 🔥 DATE VALIDATION ENDS HERE
    # ===============================

    # 🔥 Create MongoDB document
    found_document = {
        "found_location": data["found_location"],
        "found_datetime": data["found_datetime"],
        "contact_name": data["contact_name"],
        "contact_number": phone_number
    }

    found_collection.insert_one(found_document)

    return jsonify({"message": "Found person stored successfully"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)