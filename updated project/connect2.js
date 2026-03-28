async function submitAdminInmateReport() {

// 🔥 DATE VALIDATION FOR DOB & JOINING DATE

const dobValue = document.getElementById("admin-dob").value;
const joiningDateValue = document.getElementById("admin-joiningDate").value;

const currentDate = new Date();

// DOB Validation
if (!dobValue) {
    alert("Date of Birth is required.");
    return;
}

const dobDate = new Date(dobValue);
if (dobDate > currentDate) {
    alert("Future Date of Birth is not allowed.");
    return;
}

// Joining Date Validation
if (!joiningDateValue) {
    alert("Joining Date is required.");
    return;
}

const joiningDate = new Date(joiningDateValue);
if (joiningDate > currentDate) {
    alert("Future Joining Date is not allowed.");
    return;
}

    const formData = new FormData();

    formData.append("inmate_id", document.getElementById("admin-inmateId").value);
    formData.append("registration_no", document.getElementById("admin-regNo").value);
    formData.append("unique_id", document.getElementById("admin-uniqueId").value);
    formData.append("status", document.getElementById("admin-status").value);
    formData.append("full_name", document.getElementById("admin-fullName").value);
    formData.append("dob", document.getElementById("admin-dob").value);
    formData.append("gender", document.getElementById("admin-gender").value);
    formData.append("languages", document.getElementById("admin-languages").value);
    formData.append("address", document.getElementById("admin-address").value);
    formData.append("joining_date", document.getElementById("admin-joiningDate").value);

    const photoInput = document.getElementById("adminPhotoInput");
    if (photoInput.files.length > 0) {
        formData.append("photo", photoInput.files[0]);
    }

       try {
    const response = await fetch("http://127.0.0.1:5001/register-inmate", {
        method: "POST",
        body: formData
    });

    // 🔥 ADD THIS CHECK HERE
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
    }

    const result = await response.json();
    alert(result.message);
    showDashboard();

} catch (error) {
    console.error("Error:", error.message);
    alert(error.message || "Error registering inmate");
}
}

window.addEventListener("DOMContentLoaded", function () {
    const today = new Date().toISOString().split("T")[0];

    document.getElementById("admin-dob").max = today;
    document.getElementById("admin-joiningDate").max = today;
});

//     try {
//         const response = await fetch("http://127.0.0.1:5001/register-inmate", {
//             method: "POST",
//             body: formData
//         });

//         const result = await response.json();
//         alert(result.message);

//     } catch (error) {
//         console.error(error);
//         alert("Error registering inmate");
//     }
// }
