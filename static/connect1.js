// function submitFoundReport() {

//     console.log("Button clicked");

//     const foundLocation = document.getElementById("foundLocation").value.trim();
//     const foundDatetime = document.getElementById("foundDatetime").value;
//     const contactName = document.getElementById("contact_name").value.trim();
//     const contactNumber = document.getElementById("contact_phone").value.trim();

//     if (!foundLocation || !foundDatetime || !contactName || !contactNumber) {
//         alert("Please fill all required fields");
//         return;
//     }

//     // 🔥 INDIAN PHONE VALIDATION
//     const indianPhoneRegex = /^[6-9]\d{9}$/;

//     if (!indianPhoneRegex.test(contactNumber)) {
//         alert("Please enter valid 10-digit Indian mobile number (starts with 6-9)");
//         return;
//     }

// // 🔹 DATE VALIDATION
// const dateTimeValue = document.getElementById("foundDatetime").value;

// if (!dateTimeValue) {
//   alert("Please select last seen date & time.");
//   return;
// }

// const selectedDate = new Date(dateTimeValue);
// const currentDate = new Date();

// if (selectedDate > currentDate) {
//   alert("Future date is not allowed. Please select a past date & time.");
//   return;
// }

//     fetch("http://127.0.0.1:5001/found-person", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             found_location: foundLocation,
//             found_datetime: foundDatetime,
//             contact_name: contactName,
//             contact_number: contactNumber
//         })
//     })
//     .then(res => res.json())
//     .then(data => {
//     console.log("Server response:", data);

//     alert("Found report submitted successfully!");

//     // 🔥 Redirect to Admin Dashboard
//     showDashboard();
// })
//     .catch(err => {
//         console.error("Fetch error:", err);
//         alert("Error submitting report");
//     });
    
// }
// window.addEventListener("DOMContentLoaded", function () {
//   const now = new Date();
//   now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
//   document.getElementById("foundDatetime").max = now.toISOString().slice(0,16);
// });
// //     fetch("http://127.0.0.1:5001/found-person", {
// //         method: "POST",
// //         headers: {
// //             "Content-Type": "application/json"
// //         },
// //         body: JSON.stringify({
// //             found_location: foundLocation,
// //             found_datetime: foundDatetime,
// //             contact_name:  contactName,
// //             contact_number: contactNumber
// //         })
// //     })
// //     .then(res => {
// //         if (!res.ok) throw new Error("Server rejected request");
// //         return res.json();
// //     })
// //     .then(data => {
// //         alert("Found family reported successfully!");
// //     })
// //     .catch(err => {
// //         console.error(err);
// //         alert("Error submitting report");
// //     });
// // }


// ================================
// Found Report — Frontend Submit
// ================================

// const BASE_URL = "https://missing-person-fastapi.onrender.com"; // ✅ https not http

// function submitFoundReport() {

//     console.log("Button clicked");

//     const foundLocation = document.getElementById("foundLocation").value.trim();
//     const foundDatetime = document.getElementById("foundDatetime").value;
//     const contactName   = document.getElementById("contact_name").value.trim();
//     const contactNumber = document.getElementById("contact_phone").value.trim();

//     // Required fields check
//     if (!foundLocation || !foundDatetime || !contactName || !contactNumber) {
//         alert("Please fill all required fields");
//         return;
//     }

//     // Phone validation
//     const indianPhoneRegex = /^[6-9]\d{9}$/;
//     if (!indianPhoneRegex.test(contactNumber)) {
//         alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
//         return;
//     }

//     // Date validation
//     const selectedDate = new Date(foundDatetime);
//     const currentDate  = new Date();
//     if (selectedDate > currentDate) {
//         alert("Future date is not allowed. Please select a past date & time.");
//         return;
//     }

//     fetch(`${BASE_URL}/found-person`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             found_location: foundLocation,
//             found_datetime: foundDatetime,
//             contact_name:   contactName,
//             contact_number: contactNumber
//         })
//     })
//     .then(res => res.json())
//     .then(data => {
//         console.log("Server response:", data);
//         if (data.detail) {
//             alert("Error: " + data.detail);
//             return;
//         }
//         alert("Found report submitted successfully!");
//         showDashboard();
//     })
//     .catch(err => {
//         console.error("Fetch error:", err);
//         alert("Error submitting report. Please try again.");
//     });
// }

// // ================================
// // Prevent future dates in the form
// // ================================
// window.addEventListener("DOMContentLoaded", function () {
//     const dtInput = document.getElementById("foundDatetime");
//     if (dtInput) {
//         const now = new Date();
//         now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
//         dtInput.max = now.toISOString().slice(0, 16);
//     }
// });

// ================================
// Found Report — Frontend Submit
// connect2.js  —  sends FormData (matches Form(...) in backend)
// ================================

// const BASE_URL = window.location.origin;

// function submitFoundReport() {

//     console.log("Found report button clicked");

//     const foundLocation = document.getElementById("foundLocation").value.trim();
//     const foundDatetime = document.getElementById("foundDatetime").value;
//     const contactName   = document.getElementById("contact_name").value.trim();
//     const contactNumber = document.getElementById("contact_phone").value.trim();

//     // Required fields
//     if (!foundLocation || !foundDatetime || !contactName || !contactNumber) {
//         alert("Please fill all required fields");
//         return;
//     }

//     // Phone validation
//     const indianPhoneRegex = /^[6-9]\d{9}$/;
//     if (!indianPhoneRegex.test(contactNumber)) {
//         alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
//         return;
//     }

//     // Date validation
//     const selectedDate = new Date(foundDatetime);
//     const currentDate  = new Date();
//     if (selectedDate > currentDate) {
//         alert("Future date is not allowed. Please select a past date & time.");
//         return;
//     }

//     // Build FormData — matches Form(...) parameters in backend
//     const formData = new FormData();
//     formData.append("found_location", foundLocation);
//     formData.append("found_datetime", foundDatetime);
//     formData.append("contact_name",   contactName);
//     formData.append("contact_number", contactNumber);

//     // POST to /found-person
//     fetch(`${BASE_URL}/found-person`, {
//         method: "POST",
//         body: formData
//         // Do NOT set Content-Type manually — browser sets it with boundary for FormData
//     })
//     .then(res => res.json())
//     .then(data => {
//         console.log("Server response:", data);
//         if (data.detail) {
//             alert("Error: " + data.detail);
//             return;
//         }
//         alert(data.message);   // "Found person stored successfully"
//         showDashboard();
//     })
//     .catch(err => {
//         console.error("Fetch error:", err);
//         alert("Error submitting report. Please check your connection.");
//     });
// }

// // ================================
// // Prevent future dates in the form
// // ================================
// window.addEventListener("DOMContentLoaded", function () {
//     const dtInput = document.getElementById("foundDatetime");
//     if (dtInput) {
//         const now = new Date();
//         now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
//         dtInput.max = now.toISOString().slice(0, 16);
//     }
// });

// ================================
// Found Report — Frontend Submit
// connect2.js
// ================================

function submitFoundReport() {

    console.log("✅ submitFoundReport() called");

    const FOUND_API = "https://missing-person-fastapi.onrender.com";

    const foundLocationEl = document.getElementById("foundLocation");
    const foundDatetimeEl = document.getElementById("foundDatetime");
    const contactNameEl   = document.getElementById("contact_name");
    const contactPhoneEl  = document.getElementById("contact_phone");

    if (!foundLocationEl || !foundDatetimeEl || !contactNameEl || !contactPhoneEl) {
        alert("Form error: fields not found. Please refresh.");
        return;
    }

    const foundLocation = foundLocationEl.value.trim();
    const foundDatetime = foundDatetimeEl.value.trim();
    const contactName   = contactNameEl.value.trim();
    const contactNumber = contactPhoneEl.value.trim();

    console.log("foundLocation:", foundLocation);
    console.log("foundDatetime:", foundDatetime);
    console.log("contactName:",   contactName);
    console.log("contactNumber:", contactNumber);

    // ── Validate each field separately ───────────────
    if (!foundLocation) {
        alert("Please enter the Family Location.");
        foundLocationEl.focus();
        return;
    }
    if (!foundDatetime) {
        alert("Please select the Found Date & Time.");
        foundDatetimeEl.focus();
        return;
    }
    if (!contactName) {
        alert("Please enter the Family Member's Name.");
        contactNameEl.focus();
        return;
    }
    if (!contactNumber) {
        alert("Please enter the Phone Number.");
        contactPhoneEl.focus();
        return;
    }

    // ── Phone validation ──────────────────────────────
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(contactNumber)) {
        alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9).");
        contactPhoneEl.focus();
        return;
    }

    // ── Date validation ───────────────────────────────
    const selectedDate = new Date(foundDatetime);
    const currentDate  = new Date();
    if (selectedDate > currentDate) {
        alert("Future date is not allowed. Please select a past date & time.");
        foundDatetimeEl.focus();
        return;
    }

    // ── Build FormData ────────────────────────────────
    const formData = new FormData();
    formData.append("found_location", foundLocation);
    formData.append("found_datetime", foundDatetime);
    formData.append("contact_name",   contactName);
    formData.append("contact_number", contactNumber);

    // ── Disable button while submitting ──────────────
    const submitBtn = document.querySelector("#foundReportPage .submit-report-btn");
    if (submitBtn) {
        submitBtn.disabled    = true;
        submitBtn.textContent = "Submitting...";
    }

    // ── POST request ──────────────────────────────────
    fetch(FOUND_API + "/found-person", {
        method: "POST",
        body:   formData
    })
    .then(function(res) {
        console.log("HTTP status:", res.status);
        return res.json();
    })
    .then(function(data) {
        console.log("Server response:", data);

        if (submitBtn) {
            submitBtn.disabled    = false;
            submitBtn.textContent = "Submit Found Family Report";
        }

        if (data.detail) {
            alert("Error from server: " + data.detail);
            return;
        }

        alert("✅ " + (data.message || "Found family report submitted successfully!"));
        showDashboard();
    })
    .catch(function(err) {
        console.error("Fetch error:", err);

        if (submitBtn) {
            submitBtn.disabled    = false;
            submitBtn.textContent = "Submit Found Family Report";
        }

        alert("❌ Network error. Please check your connection and try again.\n\nDetails: " + err.message);
    });
}

// ── Prevent future dates ──────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    var dtInput = document.getElementById("foundDatetime");
    if (dtInput) {
        var now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dtInput.max = now.toISOString().slice(0, 16);
    }
});
