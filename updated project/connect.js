// async function submitPublicLostReport() {

//   const formData = new FormData();

//   // text fields
//   formData.append("public-fullName", document.getElementById("public-fullName").value);
//   formData.append("public-age", document.getElementById("public-age").value);
//   formData.append("gender", document.getElementById("gender").value);
//   formData.append("language_spoken", document.getElementById("language_spoken").value);
//   formData.append("public-location", document.getElementById("public-location").value);
//   formData.append("public-dateTime", document.getElementById("public-dateTime").value);
//   formData.append("clothing_description", document.getElementById("clothing_description").value);
//   formData.append("general_description", document.getElementById("general_description").value);
//   formData.append("medical_condition", document.getElementById("medical_condition").value);
//   formData.append("public-familyName", document.getElementById("public-familyName").value);
//   formData.append("public-familyPhone", document.getElementById("public-familyPhone").value);

//   // photo file
//   const photoInput = document.getElementById("publicPhotoInput");
//   if (photoInput.files.length > 0) {
//     formData.append("photo", photoInput.files[0]);
//   }

//   const response = await fetch("http://127.0.0.1:5001/submit", {
//     method: "POST",
//     body: formData   // ❗ NO headers here
//   });

//   const result = await response.json();
//   alert(result.message);
// }


// async function submitPublicLostReport() {

//   // 🔥 GET PHONE NUMBER FIRST
//   const phoneNumber = document.getElementById("public-familyPhone").value.trim();

//   // ✅ Indian mobile number regex
//   const indianPhoneRegex = /^[6-9]\d{9}$/;

//   if (!indianPhoneRegex.test(phoneNumber)) {
//     alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
//     return;   // stop submission
//   }

//   const formData = new FormData();

//   // text fields
//   formData.append("public-fullName", document.getElementById("public-fullName").value);
//   formData.append("public-age", document.getElementById("public-age").value);
//   formData.append("gender", document.getElementById("gender").value);
//   formData.append("language_spoken", document.getElementById("language_spoken").value);
//   formData.append("public-location", document.getElementById("public-location").value);
//   formData.append("public-dateTime", document.getElementById("public-dateTime").value);
//   formData.append("clothing_description", document.getElementById("clothing_description").value);
//   formData.append("general_description", document.getElementById("general_description").value);
//   formData.append("medical_condition", document.getElementById("medical_condition").value);
//   formData.append("public-familyName", document.getElementById("public-familyName").value);
//   formData.append("public-familyPhone", phoneNumber);

//   // photo file
//   const photoInput = document.getElementById("publicPhotoInput");
//   if (photoInput.files.length > 0) {
//     formData.append("photo", photoInput.files[0]);
//   }

//   const response = await fetch("http://127.0.0.1:5001/submit", {
//     method: "POST",
//     body: formData
//   });

//   const result = await response.json();
//   alert(result.message);
// }

async function submitPublicLostReport() {


  // 🔹 GET PHONE NUMBER
  const phoneNumber = document.getElementById("public-familyPhone").value.trim();
  const indianPhoneRegex = /^[6-9]\d{9}$/;

  if (!indianPhoneRegex.test(phoneNumber)) {
    alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
    return;   // stop submission
  }

  // 🔹 DATE VALIDATION
const dateTimeValue = document.getElementById("public-dateTime").value;

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

  const formData = new FormData();

  // text fields
  formData.append("public-fullName", document.getElementById("public-fullName").value);
  formData.append("public-age", document.getElementById("public-age").value);
  formData.append("gender", document.getElementById("gender").value);
  formData.append("language_spoken", document.getElementById("language_spoken").value);
  formData.append("public-location", document.getElementById("public-location").value);
  formData.append("public-dateTime", document.getElementById("public-dateTime").value);
  formData.append("clothing_description", document.getElementById("clothing_description").value);
  formData.append("general_description", document.getElementById("general_description").value);
  formData.append("medical_condition", document.getElementById("medical_condition").value);
  formData.append("public-familyName", document.getElementById("public-familyName").value);
  formData.append("public-familyPhone", phoneNumber);

  // photo file
  const photoInput = document.getElementById("publicPhotoInput");
  if (photoInput.files.length > 0) {
    formData.append("photo", photoInput.files[0]);
  }

  const response = await fetch("http://127.0.0.1:5001/submit", {
    method: "POST",
    body: formData
  });

    const result = await response.json();

  if (!response.ok) {
    alert(result.error);
    return;
  }

  alert(result.message);

 alert(result.message);

// 🔥 Force switch to Admin Dashboard
  currentUserRole = "Public";   // 🔥 important line
  showDashboard();
}

async function loadAdminReports() {
    try {
        const res = await fetch("http://127.0.0.1:5001/get-missing-reports");
        adminReports = await res.json();
        renderAdminTable();
    } catch (err) {
        console.error("Error loading reports:", err);
    }
}

window.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("public-dateTime").max = now.toISOString().slice(0,16);
});