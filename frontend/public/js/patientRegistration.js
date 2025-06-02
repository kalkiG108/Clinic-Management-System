function validateField(input) {
  //console.log("🟠 validateField called for:", input.id);
  let isValid = true;
  const feedback = document.getElementById(`${input.id}Feedback`);
  const value = input.value.trim();
  
  // First check if field is empty
  if (!value) {
    isValid = false;
    if (feedback) {
      feedback.textContent = `${input.labels[0].textContent.replace('*', '').trim()} is required`;
      feedback.style.display = 'block';
    }
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    return isValid;
  }

  // Then check specific validations
  switch(input.id) {
    case "regAadharNo":
      isValid = /^\d{12}$/.test(value);
      if (feedback) {
        feedback.textContent = isValid ? '' : "Aadhar Number must be exactly 12 digits";
        feedback.style.display = isValid ? 'none' : 'block';
      }
      break;
      
    case "regPhoneNumber":
      isValid = /^\d{10}$/.test(value);
      if (feedback) {
        feedback.textContent = isValid ? '' : "Phone Number must be exactly 10 digits";
        feedback.style.display = isValid ? 'none' : 'block';
      }
      break;
      
    case "regAge":
      const ageValue = parseInt(value);
      isValid = !isNaN(ageValue) && ageValue >= 0 && ageValue <= 120;
      if (feedback) {
        feedback.textContent = isValid ? '' : "Age must be between 0 and 120";
        feedback.style.display = isValid ? 'none' : 'block';
      }
      break;
      
    case "regName":
      // Check if name contains only letters and spaces
      isValid = /^[A-Za-z\s]+$/.test(value);
      if (feedback) {
        feedback.textContent = isValid ? '' : "Name should contain only letters (no numbers or special characters)";
        feedback.style.display = isValid ? 'none' : 'block';
      }
      break;

    case "regMedicalHistory":
      isValid = value.length > 0;
      if (feedback) {
        feedback.textContent = isValid ? '' : `${input.labels[0].textContent.replace('*', '').trim()} is required`;
        feedback.style.display = isValid ? 'none' : 'block';
      }
      break;
  }

  // Update validation classes
  if (isValid) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
  }
  
  return isValid;
}

// Function to clear validation state
function clearValidation(input) {
  //console.log("🟢 clearValidation called for:", input.id);
  const feedback = document.getElementById(`${input.id}Feedback`);
  input.classList.remove('is-valid', 'is-invalid');
  if (feedback) {
    feedback.style.display = 'none';
    feedback.textContent = '';
  }
}

// Function to show message with auto-hide after 5 seconds
function showMessage(messageBox, message, isError = false) {
  messageBox.style.color = isError ? "red" : "green";
  messageBox.innerHTML = message;
  messageBox.style.display = "block";
  messageBox.scrollIntoView({ behavior: "smooth", block: "center" });

  // Set timeout to hide message after 5 seconds
  setTimeout(() => {
    messageBox.style.display = "none";
  }, 10000);
}

// Function to reset form and clear validation states
function resetForm() {
  const form = document.getElementById("registerPatientForm");
  form.reset();
  document.querySelectorAll('#registerPatientForm input, #registerPatientForm textarea').forEach(input => {
    clearValidation(input);
  });
}


document.addEventListener('DOMContentLoaded', function () {
  console.log("🚀 DOM fully loaded, attaching event listeners!");

  let typingTimer; // Variable for debounce timer

  // Delegate focus event to clear validation
  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input[required], textarea[required]")) {
      console.log("🔵 Focus event fired for:", event.target.id);
      clearValidation(event.target);
    }
  });

  // Delegate input event for real-time validation (with debounce logic)
  document.addEventListener("input", (event) => {
    if (event.target.matches("input[required], textarea[required]")) {
      console.log("✏️ Input event detected for:", event.target.id);
      
      // Clear any existing debounce timer
      if (typingTimer) clearTimeout(typingTimer);

      // Clear validation state immediately
      clearValidation(event.target);

      // Set a new debounce timer to delay validation
      typingTimer = setTimeout(() => {
        if (event.target.value.trim()) {  // Only validate if there's a value
          validateField(event.target);
        }
      }, 500);  // 500ms debounce for better UX
    }
  });

  // Delegate blur event to validate immediately when the user leaves the field
  document.addEventListener("focusout", (event) => {
    if (event.target.matches("input[required], textarea[required]")) {
      console.log("🔴 Blur event fired for:", event.target.id);
      
      // Clear any pending debounce timer and validate immediately
      if (typingTimer) clearTimeout(typingTimer);
      validateField(event.target);
    }
  });
});




// Function to validate all fields
function validateAllFields() {
  const form = document.getElementById('registerPatientForm');
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  return isValid;
}


  

// Main function to handle token assignment
async function assignToken() {
  if (!validateAllFields()) {
    return;
  }

  const formData = {
    aadharNo: document.getElementById('regAadharNo').value.trim(),
    name: document.getElementById('regName').value.trim(),
    age: document.getElementById('regAge').value.trim(),
    phoneNumber: document.getElementById('regPhoneNumber').value.trim(),
    medicalHistory: document.getElementById('regMedicalHistory').value.trim()
  };

  const messageBox = document.getElementById("registrationMessage");

  try {
    const response = await fetch("/tokens/assign-token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      let patientTypeMsg = result.isNewPatient
        ? "<strong>🟢 New patient registered!</strong>"
        : "<strong>🟡 Token updated for existing patient!</strong>";
      let successMsg = `${patientTypeMsg}<br>
        ✅ ${result.message}<br>
        Patient Name: <strong>${result.patient.name}</strong><br>
        Assigned Token: <strong>${result.patient.latestTokenNumber}</strong>`;
      
      showMessage(messageBox, successMsg, false);
      resetForm();
    } else {
      let errorMessage;
      if (result.mismatchedFields) {
        let mismatchMsg = `❌ Details don't match for this Aadhar number!<br><br>
          The following fields don't match with existing records:<br>`;
        result.mismatchedFields.forEach(field => {
          mismatchMsg += `• ${field}<br>`;
        });
        mismatchMsg += `<br>Existing patient details:<br>
          • Name: ${result.existingDetails.name}<br>
          • Age: ${result.existingDetails.age}<br>
          • Phone: ${result.existingDetails.phoneNumber}`;
        errorMessage = mismatchMsg;
      } else {
        errorMessage = `❌ ${result.error}`;
      }
      showMessage(messageBox, errorMessage, true);
    }
  } catch (error) {
    showMessage(messageBox, "❌ Error assigning token!", true);
  }
} 