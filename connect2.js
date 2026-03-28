// # // ================================
// # // BASE URL for Admin (app2.py)
// # // ================================
// # const ADMIN_BASE_URL = "https://missing-person-fastapi.onrender.com";
// # // Change this to your actual Render URL for app2.py after deployment

// console.log("Button clicked");
// # // ================================
// # // SUBMIT ADMIN INMATE REPORT
// # // This function is ONLY defined here in connect1.js
// # // It is NOT in script.js — that version was removed
// # // ================================
// # async function submitAdminInmateReport() {

// #     // ================================
// #     // Date Validation (frontend)
// #     // ================================
// #     const dobValue        = document.getElementById("admin_dob").value;
// #     const joiningDateValue = document.getElementById("admin_joiningDate").value;
// #     const today           = new Date();
// #     today.setHours(0, 0, 0, 0); // compare dates only, ignore time

// #     if (!dobValue) {
// #         alert("Date of Birth is required.");
// #         return;
// #     }

// #     const dobDate = new Date(dobValue);
// #     if (dobDate > today) {
// #         alert("Future Date of Birth is not allowed.");
// #         return;
// #     }

// #     if (!joiningDateValue) {
// #         alert("Joining Date is required.");
// #         return;
// #     }

// #     const joiningDate = new Date(joiningDateValue);
// #     if (joiningDate > today) {
// #         alert("Future Joining Date is not allowed.");
// #         return;
// #     }

// #     if (joiningDate < dobDate) {
// #         alert("Joining date cannot be before Date of Birth.");
// #         return;
// #     }

// #     // ================================
// #     // Required Fields Check
// #     // ================================
// #     const inmateId = document.getElementById("admin_inmateId").value.trim();
// #     const regNo    = document.getElementById("admin_regNo").value.trim();
// #     const fullName = document.getElementById("admin_fullName").value.trim();

// #     if (!inmateId || !regNo || !fullName) {
// #         alert("Please fill in Inmate ID, Registration No, and Full Name.");
// #         return;
// #     }

// #     // ================================
// #     // Build FormData
// #     // Field names here MUST match the FastAPI Form(...) parameter names in app2.py
// #     // ================================
// #     const formData = new FormData();
// #     formData.append("inmate_id",       inmateId);
// #     formData.append("registration_no", regNo);
// #     formData.append("unique_id",       document.getElementById("admin_uniqueId").value);
// #     formData.append("status",          document.getElementById("admin_status").value);
// #     formData.append("full_name",       fullName);
// #     formData.append("dob",             dobValue);          // sent as "YYYY-MM-DD"
// #     formData.append("gender",          document.getElementById("admin_gender").value);
// #     formData.append("languages",       document.getElementById("admin_languages").value);
// #     formData.append("address",         document.getElementById("admin_address").value);
// #     formData.append("joining_date",    joiningDateValue);  // sent as "YYYY-MM-DD"

// #     const photoInput = document.getElementById("adminPhotoInput");
// #     if (photoInput.files.length > 0) {
// #         formData.append("photo", photoInput.files[0]);
// #     }

// #     // ================================
// #     // Send to FastAPI backend (app2.py)
// #     // ================================
// #     try {
// #         const response = await fetch(`${ADMIN_BASE_URL}/register-inmate`, {
// #             method: "POST",
// #             body: formData
// #             // Do NOT set Content-Type header manually —
// #             // browser sets it automatically with the correct boundary for FormData
// #         });

// #         const result = await response.json();

// #         if (!response.ok) {
// #             // FastAPI HTTPException sends errors in "detail" field
// #             alert("Error: " + (result.detail || "Server error. Please try again."));
// #             return;
// #         }

// #         alert(result.message);  // "Inmate registered successfully"
// #         showDashboard();

// #     } catch (error) {
// #         console.error("Network error:", error);
// #         alert("Could not connect to the server. Please check your connection.");
// #     }
// # }


// # // ================================
// # // SET DATE MAX TO TODAY
// # // Prevents the browser date picker from allowing future dates
// # // ================================
// # window.addEventListener("DOMContentLoaded", function () {
// #     const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

// #     const dobInput     = document.getElementById("admin_dob");
// #     const joiningInput = document.getElementById("admin_joiningDate");

// #     if (dobInput)     dobInput.max     = today;
// #     if (joiningInput) joiningInput.max = today;
// # });

// ================================
// BASE URL — update this after deployment
// During local dev use: http://127.0.0.1:8000
// On Render: use your actual Render URL
// ================================
const ADMIN_BASE_URL = window.location.origin;
// Using window.location.origin means it always
// points to wherever the app is deployed — no hardcoding needed!
console.log("Button clicked");
// ================================
// SUBMIT ADMIN INMATE REPORT
// ================================
async function submitAdminInmateReport() {

    const dobValue         = document.getElementById("admin_dob").value;
    const joiningDateValue = document.getElementById("admin_joiningDate").value;
    const today            = new Date();
    today.setHours(0, 0, 0, 0);

    if (!dobValue) { alert("Date of Birth is required."); return; }
    const dobDate = new Date(dobValue);
    if (dobDate > today) { alert("Future Date of Birth is not allowed."); return; }
    if (!joiningDateValue) { alert("Joining Date is required."); return; }
    const joiningDate = new Date(joiningDateValue);
    if (joiningDate > today) { alert("Future Joining Date is not allowed."); return; }
    if (joiningDate < dobDate) { alert("Joining date cannot be before Date of Birth."); return; }

    const inmateId = document.getElementById("admin_inmateId").value.trim();
    const regNo    = document.getElementById("admin_regNo").value.trim();
    const fullName = document.getElementById("admin_fullName").value.trim();

    if (!inmateId || !regNo || !fullName) {
        alert("Please fill in Inmate ID, Registration No, and Full Name.");
        return;
    }

    const photoInput = document.getElementById("adminPhotoInput");
    if (!photoInput.files.length) {
        alert("Please upload at least one photo.");
        return;
    }

    const formData = new FormData();
    formData.append("inmate_id",       inmateId);
    formData.append("registration_no", regNo);
    formData.append("unique_id",       document.getElementById("admin_uniqueId").value);
    formData.append("status",          document.getElementById("admin_status").value);
    formData.append("full_name",       fullName);
    formData.append("dob",             dobValue);
    formData.append("gender",          document.getElementById("admin_gender").value);
    formData.append("languages",       document.getElementById("admin_languages").value);
    formData.append("address",         document.getElementById("admin_address").value);
    formData.append("joining_date",    joiningDateValue);
    formData.append("photo",           photoInput.files[0]);

    try {
        const response = await fetch(`${ADMIN_BASE_URL}/register-inmate`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            alert("Error: " + (result.detail || "Server error. Please try again."));
            return;
        }

        alert(result.message);
        showDashboard();

    } catch (error) {
        console.error("Network error:", error);
        alert("Could not connect to the server. Please check your connection.");
    }
}

// ================================
// SET DATE MAX TO TODAY
// ================================
window.addEventListener("DOMContentLoaded", function () {
    const today        = new Date().toISOString().split("T")[0];
    const dobInput     = document.getElementById("admin_dob");
    const joiningInput = document.getElementById("admin_joiningDate");
    if (dobInput)     dobInput.max     = today;
    if (joiningInput) joiningInput.max = today;
});
