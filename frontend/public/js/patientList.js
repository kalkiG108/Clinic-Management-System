let patients = [];
let currentPatientId = null;

// Function to format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Function to create a patient card
function createPatientCard(patient) {
  return `
    <div class="col-md-6 col-lg-4" data-patient-id="${patient._id}">
      <div class="card h-100 shadow-sm border-0">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h5 class="card-title fw-bold mb-2">${patient.name}</h5>
              <p class="card-text text-muted mb-0">
                <i class="bi bi-calendar3 me-1"></i>
                <small>Registered: ${formatDate(patient.createdAt)}</small>
              </p>
            </div>
            <div class="btn-group">
              <button class="btn btn-light btn-sm me-1" onclick="openUpdateModal('${patient._id}')" title="Edit Patient">
                <i class="bi bi-pencil-square text-success"></i>
              </button>
              <button class="btn btn-light btn-sm" onclick="openDeleteModal('${patient._id}')" title="Delete Patient">
                <i class="bi bi-trash text-danger"></i>
              </button>
            </div>
          </div>
          <div class="patient-details">
            <div class="mb-3 p-3 rounded-3" style="background: rgba(52, 168, 83, 0.05);">
              <p class="card-text mb-2 d-flex align-items-center">
                <i class="bi bi-person-vcard me-2 text-success"></i>
                <span class="text-dark">${patient.aadharNo}</span>
              </p>
              <p class="card-text mb-2 d-flex align-items-center">
                <i class="bi bi-telephone me-2 text-success"></i>
                <span class="text-dark">${patient.phoneNumber}</span>
              </p>
              <p class="card-text mb-0 d-flex align-items-center">
                <i class="bi bi-person me-2 text-success"></i>
                <span class="text-dark">Age: ${patient.age}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to load and display patients
async function loadPatients() {
  try {
    const response = await fetch("/patients", {
      headers: {
        "Authorization": localStorage.getItem("token")
      }
    });
    
    if (!response.ok) throw new Error("Failed to fetch patients");
    
    patients = await response.json();
    console.log("Loaded patients:", patients.length); // Debug log
    displayPatients(patients);
    setupSearch(); // Setup search after patients are loaded
    
  } catch (error) {
    console.error("Error loading patients:", error);
    document.getElementById("patientsContainer").innerHTML = `
      <div class="col-12 text-center text-danger">
        <i class="bi bi-exclamation-triangle"></i> Error loading patients. Please try again.
      </div>
    `;
  }
}

// Function to display patients
function displayPatients(patientsToShow) {
  const container = document.getElementById("patientsContainer");
  if (patientsToShow.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted">
        <i class="bi bi-inbox"></i> No patients found.
      </div>
    `;
    return;
  }
  
  container.innerHTML = patientsToShow
    .map(patient => createPatientCard(patient))
    .join("");
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById("viewPatientSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    console.log("Search term:", e.target.value); // Debug log
    const searchTerm = e.target.value.toLowerCase().trim();
    
    const filteredPatients = patients.filter(patient => 
      (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
      (patient.aadharNo && patient.aadharNo.includes(searchTerm)) ||
      (patient.phoneNumber && patient.phoneNumber.includes(searchTerm))
    );
    
    console.log("Filtered patients:", filteredPatients.length); // Debug log
    displayPatients(filteredPatients);
  });
}

// Update patient modal functions
function openUpdateModal(patientId) {
  currentPatientId = patientId;
  const patient = patients.find(p => p._id === patientId);
  
  document.getElementById("updatePatientId").value = patientId;
  document.getElementById("updateName").value = patient.name;
  document.getElementById("updateAge").value = patient.age;
  document.getElementById("updatePhone").value = patient.phoneNumber;
  document.getElementById("updateMedicalHistory").value = patient.medicalHistory || "";
  
  new bootstrap.Modal(document.getElementById("updatePatientModal")).show();
}

async function updatePatient() {
  const form = document.getElementById("updatePatientForm");
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  try {
    const updatedData = {
      name: document.getElementById("updateName").value,
      age: document.getElementById("updateAge").value,
      phoneNumber: document.getElementById("updatePhone").value,
      medicalHistory: document.getElementById("updateMedicalHistory").value
    };
    
    const response = await fetch(`/patients/${currentPatientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
      },
      body: JSON.stringify(updatedData)
    });
    
    if (!response.ok) throw new Error("Failed to update patient");
    
    // Close modal and reload patients
    bootstrap.Modal.getInstance(document.getElementById("updatePatientModal")).hide();
    await loadPatients();
    
  } catch (error) {
    console.error("Error updating patient:", error);
    alert("Failed to update patient. Please try again.");
  }
}

// Delete patient modal functions
function openDeleteModal(patientId) {
  currentPatientId = patientId;
  new bootstrap.Modal(document.getElementById("deleteConfirmModal")).show();
}

async function deletePatient() {
  try {
    const response = await fetch(`/patients/${currentPatientId}`, {
      method: "DELETE",
      headers: {
        "Authorization": localStorage.getItem("token")
      }
    });
    
    if (!response.ok) throw new Error("Failed to delete patient");
    
    // Close modal and reload patients
    bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal")).hide();
    await loadPatients();
    
  } catch (error) {
    console.error("Error deleting patient:", error);
    alert("Failed to delete patient. Please try again.");
  }
}

// Initialize everything when the view patients section becomes visible
function initializePatientList() {
  loadPatients();
  setupSearch();
}

// Load patients when the section becomes visible
document.getElementById("viewPatientsLink").addEventListener("click", initializePatientList);
document.getElementById("viewPatientsLinkMobile").addEventListener("click", initializePatientList);

// Add search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('viewPatientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterPatientCards(searchTerm);
        });
    }
});

// Filter patient cards based on search term
function filterPatientCards(searchTerm) {
    const patientCards = document.querySelectorAll('.patient-card');
    let hasVisibleCards = false;

    patientCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes(searchTerm)) {
            card.style.display = '';
            hasVisibleCards = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Show/hide no results message
    const noResultsMessage = document.getElementById('noResultsMessage');
    if (noResultsMessage) {
        if (!hasVisibleCards && searchTerm !== '') {
            noResultsMessage.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'none';
        }
    }
} 