// Global variable to store user data
let userData = null;
let isEditMode = false;

// Function to format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Function to show success message
function showSuccess(message) {
  const alert = document.getElementById('successAlert');
  alert.innerHTML = `
    <i class="bi bi-check-circle-fill"></i> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alert.classList.add('show');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Function to toggle edit mode
function toggleEditMode(enable) {
  isEditMode = enable;
  const inputs = document.querySelectorAll('#profileForm input');
  const saveBtn = document.getElementById('saveProfileBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const editBtn = document.getElementById('editProfileBtn');

  inputs.forEach(input => {
    input.disabled = !enable;
  });

  if (enable) {
    saveBtn.style.display = 'block';
    cancelBtn.style.display = 'block';
    editBtn.style.display = 'none';
  } else {
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    editBtn.style.display = 'block';
    // Reset form to original values
    if (userData) {
      displayUserProfile(userData);
    }
  }
}

// Function to load user profile
async function loadUserProfile() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = '/auth/doctor-dashboard';
      return;
    }

    const response = await fetch("/users/profile", {
      headers: {
        "Authorization": token
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/auth/logindoctor';
        return;
      }
      throw new Error("Failed to fetch profile");
    }

    userData = await response.json();
    displayUserProfile(userData);
  } catch (error) {
    console.error("Error loading profile:", error);
    document.querySelector(".user-name").textContent = "Error loading profile";
    document.querySelector(".doctor-id").textContent = "Please try refreshing the page";
  }
}

// Function to display user profile
function displayUserProfile(user) {
  // Update header
  document.querySelector(".user-name").textContent = user.name;
  document.querySelector(".doctor-id").textContent = `ID: ${user.doctorId}`;

  // Update form fields
  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profilePhone").value = user.phone;
  document.getElementById("profileNewPassword").value = '';
  
  // Update timestamps
  document.querySelector(".created-at").textContent = formatDate(user.createdAt);
  document.querySelector(".updated-at").textContent = formatDate(user.updatedAt);
}

// Function to validate form
function validateProfileForm() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  const password = document.getElementById("profileNewPassword").value;

  let isValid = true;
  const errors = {};

  // Name validation
  if (!name || !/^[A-Za-z\s]+$/.test(name)) {
    isValid = false;
    errors.name = "Please enter a valid name (letters only)";
  }

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    isValid = false;
    errors.email = "Please enter a valid email address";
  }

  // Phone validation
  if (!phone || !/^\d{10}$/.test(phone)) {
    isValid = false;
    errors.phone = "Please enter a valid 10-digit phone number";
  }

  // Password validation (only if provided)
  if (password && password.length < 6) {
    isValid = false;
    errors.password = "Password must be at least 6 characters";
  }

  return { isValid, errors };
}

// Function to update profile
async function updateProfile(event) {
  event.preventDefault();

  const { isValid, errors } = validateProfileForm();
  if (!isValid) {
    // Display validation errors
    Object.keys(errors).forEach(field => {
      const input = document.getElementById(`profile${field.charAt(0).toUpperCase() + field.slice(1)}`);
      input.classList.add('is-invalid');
      input.nextElementSibling.textContent = errors[field];
    });
    return;
  }

  const updatedData = {
    name: document.getElementById("profileName").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    phone: document.getElementById("profilePhone").value.trim()
  };

  const password = document.getElementById("profileNewPassword").value;
  if (password) {
    updatedData.password = password;
  }

  try {
    const response = await fetch("/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/auth/logindoctor';
        return;
      }
      throw new Error("Failed to update profile");
    }

    const result = await response.json();
    userData = result.user;
    displayUserProfile(userData);

    // Show success message
    showSuccess("Profile updated successfully!");
    
    // Exit edit mode
    toggleEditMode(false);
    
    // Remove any validation states
    document.querySelectorAll('#profileForm .is-invalid').forEach(input => {
      input.classList.remove('is-invalid');
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    showError("Failed to update profile. Please try again.");
  }
}

// Initialize profile functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check for token first
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/auth/doctor-dashboard';
    return;
  }

  // Load profile data
  loadUserProfile();

  // Add submit handler to form
  document.getElementById('profileForm').addEventListener('submit', updateProfile);

  // Add edit button handler
  document.getElementById('editProfileBtn').addEventListener('click', () => toggleEditMode(true));

  // Add cancel button handler
  document.getElementById('cancelEditBtn').addEventListener('click', () => toggleEditMode(false));

  // Add input handlers to clear validation states
  document.querySelectorAll('#profileForm input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
    });
  });
}); 