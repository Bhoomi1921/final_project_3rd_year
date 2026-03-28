function submitFoundReport() {

    console.log("Button clicked");

    const foundLocation = document.getElementById("foundLocation").value.trim();
    const foundDatetime = document.getElementById("foundDatetime").value;
    const contactName = document.getElementById("contact_name").value.trim();
    const contactNumber = document.getElementById("contact_phone").value.trim();

    if (!foundLocation || !foundDatetime || !contactName || !contactNumber) {
        alert("Please fill all required fields");
        return;
    }

    // 🔥 INDIAN PHONE VALIDATION
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneRegex.test(contactNumber)) {
        alert("Please enter valid 10-digit Indian mobile number (starts with 6-9)");
        return;
    }

// 🔹 DATE VALIDATION
const dateTimeValue = document.getElementById("foundDatetime").value;

if (!dateTimeValue) {
  alert("Please select last seen date & time.");
  return;
}

const selectedDate = new Date(dateTimeValue);
const currentDate = new Date();

if (selectedDate > currentDate) {
  alert("Future date is not allowed. Please select a past date & time.");
  return;
}

    fetch("http://127.0.0.1:5001/found-person", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            found_location: foundLocation,
            found_datetime: foundDatetime,
            contact_name: contactName,
            contact_number: contactNumber
        })
    })
    .then(res => res.json())
    .then(data => {
    console.log("Server response:", data);

    alert("Found report submitted successfully!");

    // 🔥 Redirect to Admin Dashboard
    showDashboard();
})
    .catch(err => {
        console.error("Fetch error:", err);
        alert("Error submitting report");
    });
    
}
window.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("foundDatetime").max = now.toISOString().slice(0,16);
});
//     fetch("http://127.0.0.1:5001/found-person", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             found_location: foundLocation,
//             found_datetime: foundDatetime,
//             contact_name:  contactName,
//             contact_number: contactNumber
//         })
//     })
//     .then(res => {
//         if (!res.ok) throw new Error("Server rejected request");
//         return res.json();
//     })
//     .then(data => {
//         alert("Found family reported successfully!");
//     })
//     .catch(err => {
//         console.error(err);
//         alert("Error submitting report");
//     });
// }


